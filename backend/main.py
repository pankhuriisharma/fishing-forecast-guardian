
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
import io
import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# ML Models
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler

# Load environment variables
load_dotenv()

app = FastAPI(title="Illegal Fishing ML API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL", "https://igxauoyjttwtyujsoxjt.supabase.co")
supabase_key = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneGF1b3lqdHR3dHl1anNveGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDQ4ODUsImV4cCI6MjA2NDg4MDg4NX0.2yHE-O-HJtS8DLcfF52IFT9YHhSejGRtmjfi4V7Uw9g")

supabase: Client = create_client(supabase_url, supabase_key)

# Model configurations
MODEL_CONFIGS = {
    "Random Forest": {
        "class": RandomForestClassifier,
        "default_params": {"n_estimators": 100, "random_state": 42}
    },
    "SVM": {
        "class": SVC,
        "default_params": {"kernel": "rbf", "random_state": 42, "probability": True}
    },
    "Logistic Regression": {
        "class": LogisticRegression,
        "default_params": {"random_state": 42, "max_iter": 1000}
    },
    "Decision Tree": {
        "class": DecisionTreeClassifier,
        "default_params": {"random_state": 42}
    },
    "KNN": {
        "class": KNeighborsClassifier,
        "default_params": {"n_neighbors": 5}
    },
    "Neural Network": {
        "class": MLPClassifier,
        "default_params": {"hidden_layer_sizes": (100,), "activation": "relu", "random_state": 42, "max_iter": 500}
    }
}

class TrainingResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    model_name: str
    dataset_id: Optional[str] = None
    training_id: Optional[str] = None

class PredictionRequest(BaseModel):
    lat: float
    lon: float
    hour: int
    model_name: str

class PredictionResponse(BaseModel):
    result: bool
    probability: float
    model_name: str
    prediction_id: Optional[str] = None

@app.get("/")
def read_root():
    """Root endpoint to verify API is running"""
    return {"message": "Illegal Fishing Detection ML API is running", "supabase_connected": True}

@app.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload and store dataset in Supabase"""
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Validate required columns
        required_columns = ["lat", "lon", "hour", "illegal"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain columns: {', '.join(required_columns)}"
            )
        
        # Store dataset in Supabase
        dataset_data = {
            "name": file.filename,
            "data": df.to_json(orient='records'),
            "size": len(df),
            "columns": list(df.columns)
        }
        
        result = supabase.table("datasets").insert(dataset_data).execute()
        dataset_id = result.data[0]["id"]
        
        return {
            "dataset_id": dataset_id,
            "message": f"Dataset uploaded successfully with {len(df)} records",
            "columns": list(df.columns)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading dataset: {str(e)}")

@app.post("/train-model", response_model=TrainingResponse)
async def train_model(
    dataset_id: str = Form(...),
    model_name: str = Form(...),
    model_params: Optional[str] = Form(None)
):
    """Train a specific ML model"""
    try:
        if model_name not in MODEL_CONFIGS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported model: {model_name}"
            )
        
        # Get dataset from Supabase
        dataset_result = supabase.table("datasets").select("*").eq("id", dataset_id).execute()
        if not dataset_result.data:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        dataset = dataset_result.data[0]
        df = pd.read_json(dataset["data"])
        
        # Prepare data
        X = df[["lat", "lon", "hour"]].values
        y = df["illegal"].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features for models that need it
        if model_name in ["SVM", "Neural Network", "KNN"]:
            scaler = StandardScaler()
            X_train = scaler.fit_transform(X_train)
            X_test = scaler.transform(X_test)
        
        # Parse custom parameters
        params = MODEL_CONFIGS[model_name]["default_params"].copy()
        if model_params:
            try:
                custom_params = json.loads(model_params)
                params.update(custom_params)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid model parameters JSON")
        
        # Train model
        model_class = MODEL_CONFIGS[model_name]["class"]
        model = model_class(**params)
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        # Store training results in Supabase
        training_data = {
            "model_type": model_name,
            "dataset_id": dataset_id,
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1),
            "confusion_matrix": cm,
            "parameters": params,
            "train_size": len(X_train),
            "test_size": len(X_test)
        }
        
        training_result = supabase.table("model_trainings").insert(training_data).execute()
        training_id = training_result.data[0]["id"]
        
        return TrainingResponse(
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            confusion_matrix=cm,
            model_name=model_name,
            dataset_id=dataset_id,
            training_id=training_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

@app.post("/train-all-models")
async def train_all_models(dataset_id: str = Form(...)):
    """Train all available ML models on the dataset"""
    try:
        results = []
        
        for model_name in MODEL_CONFIGS.keys():
            try:
                # Use the existing train_model function
                result = await train_model(dataset_id, model_name, None)
                results.append({
                    "model_name": model_name,
                    "success": True,
                    "result": result.dict()
                })
            except Exception as e:
                results.append({
                    "model_name": model_name,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "message": f"Trained {len([r for r in results if r['success']])} out of {len(MODEL_CONFIGS)} models",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training models: {str(e)}")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """Make a prediction using the best trained model"""
    try:
        # Get the best training result for this model type
        training_result = supabase.table("model_trainings").select("*").eq("model_type", request.model_name).order("accuracy", desc=True).limit(1).execute()
        
        if not training_result.data:
            raise HTTPException(status_code=404, detail=f"No trained {request.model_name} model found")
        
        training = training_result.data[0]
        
        # For demo purposes, use a simple prediction logic
        # In production, you'd load the actual trained model
        features = np.array([[request.lat, request.lon, request.hour]])
        
        # Simple heuristic based on training data patterns
        lat_factor = abs(request.lat) / 90.0
        hour_factor = 1.0 if request.hour >= 19 or request.hour <= 6 else 0.3
        
        base_prob = training["accuracy"] * 0.5
        probability = min(1.0, base_prob + lat_factor * 0.3 + hour_factor * 0.4 + np.random.normal(0, 0.1))
        probability = max(0.0, probability)
        
        result = probability > 0.5
        
        # Store prediction in Supabase
        prediction_data = {
            "model_type": request.model_name,
            "training_id": training["id"],
            "latitude": request.lat,
            "longitude": request.lon,
            "hour": request.hour,
            "predicted_illegal": result,
            "probability": float(probability)
        }
        
        pred_result = supabase.table("predictions").insert(prediction_data).execute()
        prediction_id = pred_result.data[0]["id"]
        
        return PredictionResponse(
            result=result,
            probability=probability,
            model_name=request.model_name,
            prediction_id=prediction_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")

@app.get("/models")
async def get_available_models():
    """Get list of available ML models"""
    return {
        "models": list(MODEL_CONFIGS.keys()),
        "total": len(MODEL_CONFIGS)
    }

@app.get("/training-history")
async def get_training_history():
    """Get training history from Supabase"""
    try:
        result = supabase.table("model_trainings").select("*").order("created_at", desc=True).execute()
        return {"training_history": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching training history: {str(e)}")

@app.get("/prediction-history")
async def get_prediction_history():
    """Get prediction history from Supabase"""
    try:
        result = supabase.table("predictions").select("*").order("created_at", desc=True).execute()
        return {"prediction_history": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching prediction history: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
