
# Illegal Fishing Detection ML Backend

This FastAPI backend provides machine learning capabilities for the Illegal Fishing Detection web application.

## Features

- Accepts CSV data uploads
- Trains multiple machine learning models:
  - Decision Tree
  - Random Forest
  - SVM
  - KNN
  - Neural Network
  - Logistic Regression
- Returns model accuracy and evaluation metrics
- Provides prediction endpoint

## Setup and Running

### Using Docker

1. Build the Docker image:
   ```
   docker build -t fishing-ml-backend .
   ```

2. Run the container:
   ```
   docker run -p 8000:8000 fishing-ml-backend
   ```

### Manual Setup

1. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   uvicorn main:app --reload
   ```

## API Endpoints

- `GET /`: Root endpoint to verify API is running
- `POST /train`: Train a machine learning model
  - Parameters:
    - `file`: CSV file upload
    - `model_name`: Name of the model to train
    - `model_params`: Optional JSON string with model parameters
  - Returns: Model evaluation metrics
- `POST /predict`: Make a prediction
  - Parameters:
    - `lat`: Latitude
    - `lon`: Longitude
    - `hour`: Hour of day
    - `model_name`: Model to use for prediction
  - Returns: Prediction result and probability

## CSV Format Requirements

The uploaded CSV must contain at minimum the following columns:
- `lat`: Latitude
- `lon`: Longitude
- `hour`: Hour of the day
- `illegal`: Binary target variable (0 or 1)

## Model Parameters

Different models accept different parameters:
- Random Forest: `n_estimators`
- SVM: `kernel` ("linear", "rbf", "poly")
- KNN: `neighbors` (number of neighbors)
- Neural Network: `activation` ("relu", "tanh", "logistic", "identity")
