
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
import io
import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# ML imports
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Illegal Fishing ML API with Supabase")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

# Define all ML models
ML_MODELS = {
    "Decision Tree": DecisionTreeClassifier(random_state=42),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
    "SVM": SVC(kernel='rbf', probability=True, random_state=42),
    "KNN": KNeighborsClassifier(n_neighbors=5),
    "Neural Network": MLPClassifier(hidden_layer_sizes=(100, 50), max_iter=1000, random_state=42),
    "Logistic Regression": LogisticRegression(random_state=42, max_iter=1000)
}

class TrainingResponse(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    model_id: str

class AllModelsTrainingResponse(BaseModel):
    results: List[TrainingResponse]
    dataset_info: Dict[str, Any]

@app.get("/")
def read_root():
    """Root endpoint to verify API is running"""
    return {"message": "Illegal Fishing Detection ML API with Supabase is running"}

@app.post("/train-all-models", response_model=AllModelsTrainingResponse)
async def train_all_models(file: UploadFile = File(...)):
    """
    Train all ML models and store results in Supabase
    """
    try:
        # Read and validate CSV file
        content = await file.read()
        
        try:
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {str(e)}")
        
        # Validate required columns
        required_columns = ["lat", "lon", "hour", "illegal"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain columns: {', '.join(required_columns)}. Found: {', '.join(df.columns)}"
            )
        
        # Store dataset info in Supabase
        dataset_result = supabase.table("training_datasets").insert({
            "filename": file.filename,
            "file_size": len(content),
            "row_count": len(df),
            "column_count": len(df.columns)
        }).execute()
        
        # Prepare data
        X = df[["lat", "lon", "hour"]].values
        y = df["illegal"].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features for models that need it
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        results = []
        
        # Train each model
        for model_name, model in ML_MODELS.items():
            print(f"Training {model_name}...")
            
            try:
                # Use scaled data for SVM, Neural Network, and Logistic Regression
                if model_name in ["SVM", "Neural Network", "Logistic Regression"]:
                    model.fit(X_train_scaled, y_train)
                    y_pred = model.predict(X_test_scaled)
                    if hasattr(model, "predict_proba"):
                        y_proba = model.predict_proba(X_test_scaled)[:, 1]
                else:
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                    if hasattr(model, "predict_proba"):
                        y_proba = model.predict_proba(X_test)[:, 1]
                
                # Calculate metrics
                accuracy = accuracy_score(y_test, y_pred)
                precision = precision_score(y_test, y_pred, zero_division=0)
                recall = recall_score(y_test, y_pred, zero_division=0)
                f1 = f1_score(y_test, y_pred, zero_division=0)
                cm = confusion_matrix(y_test, y_pred).tolist()
                
                # Store model results in Supabase
                model_result = supabase.table("ml_model_results").insert({
                    "model_name": model_name,
                    "accuracy": float(accuracy),
                    "precision_score": float(precision),
                    "recall_score": float(recall),
                    "f1_score": float(f1),
                    "confusion_matrix": cm,
                    "model_params": {},
                    "training_data_size": len(X_train),
                    "test_data_size": len(X_test)
                }).execute()
                
                model_id = model_result.data[0]["id"]
                
                # Create response for this model
                training_response = TrainingResponse(
                    model_name=model_name,
                    accuracy=float(accuracy),
                    precision=float(precision),
                    recall=float(recall),
                    f1_score=float(f1),
                    confusion_matrix=cm,
                    model_id=model_id
                )
                
                results.append(training_response)
                print(f"{model_name} completed - Accuracy: {accuracy:.4f}")
                
            except Exception as e:
                print(f"Error training {model_name}: {str(e)}")
                # Continue with other models even if one fails
                continue
        
        # Prepare final response
        dataset_info = {
            "filename": file.filename,
            "total_rows": len(df),
            "training_rows": len(X_train),
            "testing_rows": len(X_test),
            "features": ["lat", "lon", "hour"]
        }
        
        return AllModelsTrainingResponse(
            results=results,
            dataset_info=dataset_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training models: {str(e)}")

@app.post("/predict")
async def predict(
    lat: float = Form(...),
    lon: float = Form(...),
    hour: int = Form(...),
    model_name: str = Form(...)
):
    """
    Make prediction using the specified model and store result in Supabase
    """
    try:
        # Get the latest trained model from Supabase
        model_result = supabase.table("ml_model_results")\
            .select("*")\
            .eq("model_name", model_name)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if not model_result.data:
            raise HTTPException(status_code=404, detail=f"No trained {model_name} model found")
        
        # For demo purposes, use simple logic based on hour
        # In a real implementation, you would load the actual trained model
        probability = 0.7 + (abs(lat) / 90) * 0.3
        if hour >= 19 or hour <= 4:  # Night hours
            probability = min(probability + 0.2, 1.0)
        
        result = probability > 0.5
        
        # Store prediction in Supabase
        prediction_data = {
            "model_result_id": model_result.data[0]["id"],
            "latitude": lat,
            "longitude": lon,
            "hour": hour,
            "prediction_result": result,
            "prediction_probability": probability
        }
        
        supabase.table("model_predictions").insert(prediction_data).execute()
        
        return {
            "result": result,
            "probability": probability,
            "model": model_name,
            "location": [lat, lon],
            "hour": hour
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error making prediction: {str(e)}")

@app.get("/models/results")
async def get_model_results():
    """
    Get all model training results from Supabase
    """
    try:
        results = supabase.table("ml_model_results")\
            .select("*")\
            .order("created_at", desc=True)\
            .execute()
        
        return {"results": results.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching model results: {str(e)}")

@app.get("/models/compare")
async def compare_models():
    """
    Compare all trained models
    """
    try:
        # Get the latest result for each model
        results = supabase.table("ml_model_results")\
            .select("*")\
            .order("created_at", desc=True)\
            .execute()
        
        # Group by model name and get the latest for each
        latest_results = {}
        for result in results.data:
            model_name = result["model_name"]
            if model_name not in latest_results:
                latest_results[model_name] = result
        
        # Sort by accuracy
        sorted_results = sorted(
            latest_results.values(), 
            key=lambda x: x["accuracy"], 
            reverse=True
        )
        
        return {"model_comparison": sorted_results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error comparing models: {str(e)}")

@app.get("/datasets")
async def get_datasets():
    """
    Get all uploaded datasets
    """
    try:
        datasets = supabase.table("training_datasets")\
            .select("*")\
            .order("uploaded_at", desc=True)\
            .execute()
        
        return {"datasets": datasets.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching datasets: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
