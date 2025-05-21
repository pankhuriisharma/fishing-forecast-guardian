
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
import io
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import json

app = FastAPI(title="Illegal Fishing ML API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define model mapping
MODEL_MAPPING = {
    "Decision Tree": DecisionTreeClassifier,
    "Random Forest": RandomForestClassifier,
    "SVM": SVC,
    "KNN": KNeighborsClassifier,
    "Neural Network": MLPClassifier,
    "Logistic Regression": LogisticRegression
}

# Define model parameters
MODEL_PARAMS = {
    "Random Forest": {
        "n_estimators": lambda x: {"n_estimators": x}
    },
    "SVM": {
        "kernel": lambda x: {"kernel": x}
    },
    "KNN": {
        "neighbors": lambda x: {"n_neighbors": x}
    },
    "Neural Network": {
        "activation": lambda x: {"activation": x}
    }
}

class TrainingResponse(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: List[List[int]]
    model_name: str

@app.get("/")
def read_root():
    """Root endpoint to verify API is running"""
    return {"message": "Illegal Fishing Detection ML API is running"}

@app.post("/train", response_model=TrainingResponse)
async def train_model(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    model_params: Optional[str] = Form(None)
):
    """
    Train a machine learning model based on the uploaded CSV data.
    
    Args:
        file (UploadFile): The CSV file containing the dataset
        model_name (str): Name of the model to train (e.g., "Random Forest")
        model_params (str): JSON string of model parameters
    
    Returns:
        TrainingResponse: Model evaluation metrics
    """
    try:
        # Validate model name
        if model_name not in MODEL_MAPPING:
            raise HTTPException(status_code=400, detail=f"Unsupported model: {model_name}. Supported models: {list(MODEL_MAPPING.keys())}")
        
        # Parse model parameters if provided
        params = {}
        if model_params:
            try:
                params_dict = json.loads(model_params)
                
                # Apply parameter transformation based on model type
                if model_name in MODEL_PARAMS:
                    for param_name, transform_func in MODEL_PARAMS[model_name].items():
                        if param_name in params_dict:
                            params.update(transform_func(params_dict[param_name]))
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid model parameters JSON")
        
        # Read CSV file
        content = await file.read()
        
        try:
            # Try to parse CSV
            df = pd.read_csv(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error parsing CSV file: {str(e)}")
        
        # Simple validation of data format
        required_columns = ["lat", "lon", "hour", "illegal"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain columns: {', '.join(required_columns)}. Found: {', '.join(df.columns)}"
            )
        
        # Prepare data for training
        # Features (X) and target (y)
        X = df[["lat", "lon", "hour"]].values
        y = df["illegal"].values
        
        # Split data into training and testing sets
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Initialize and train model
        model_class = MODEL_MAPPING[model_name]
        model = model_class(**params)
        
        # Train the model
        model.fit(X_train, y_train)
        
        # Make predictions on the test set
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        # Return evaluation results
        return TrainingResponse(
            accuracy=float(acc),
            precision=float(prec),
            recall=float(rec),
            f1_score=float(f1),
            confusion_matrix=cm,
            model_name=model_name
        )
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions as is
    except Exception as e:
        # Catch all other exceptions and return 500
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/predict")
async def predict(
    lat: float = Form(...),
    lon: float = Form(...),
    hour: int = Form(...),
    model_name: str = Form(...)
):
    """
    Endpoint for making predictions (simplified - in a real app you'd want to 
    save trained models and load them here instead of training again each time)
    """
    # For a complete implementation, you would save trained models and load them here
    # This is a simplified placeholder that should be expanded in a real application
    
    result = {
        "result": hour >= 19 or hour <= 4,  # Simple demo logic based on hour
        "probability": 0.7 + (abs(lat) / 90) * 0.3,  # Demo probability calculation
        "model": model_name
    }
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
