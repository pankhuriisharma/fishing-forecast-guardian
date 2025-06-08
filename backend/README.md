
# Illegal Fishing Detection ML Backend

This FastAPI backend provides comprehensive machine learning capabilities for the Illegal Fishing Detection web application with full Supabase integration.

## Features

- **Complete ML Pipeline**: Trains all 6 machine learning models (Random Forest, SVM, Logistic Regression, Decision Tree, KNN, Neural Network)
- **Supabase Integration**: Stores datasets, training results, and predictions in Supabase
- **Model Management**: Track training history and model performance
- **Prediction API**: Make predictions using trained models
- **Data Persistence**: All training data and results are stored for analysis

## Supported Models

1. **Random Forest** - Ensemble method with multiple decision trees
2. **SVM (Support Vector Machine)** - Finds optimal decision boundaries
3. **Logistic Regression** - Statistical classification method
4. **Decision Tree** - Tree-based classification
5. **KNN (K-Nearest Neighbors)** - Distance-based classification
6. **Neural Network** - Multi-layer perceptron for complex patterns

## Setup and Running

### Environment Setup

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your Supabase credentials (already configured for this project)

### Using Docker (Recommended)

1. Build the Docker image:
   ```bash
   docker build -t fishing-ml-backend .
   ```

2. Run the container:
   ```bash
   docker run -p 8000:8000 --env-file .env fishing-ml-backend
   ```

### Manual Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

### Core Endpoints
- `GET /`: Root endpoint with API status
- `GET /models`: List all available ML models

### Dataset Management
- `POST /upload-dataset`: Upload CSV dataset to Supabase
- `GET /training-history`: Get all training results
- `GET /prediction-history`: Get all prediction results

### Model Training
- `POST /train-model`: Train a specific ML model
- `POST /train-all-models`: Train all 6 ML models at once

### Predictions
- `POST /predict`: Make predictions using trained models

## CSV Data Format

Your CSV file must contain these columns:
- `lat`: Latitude (float)
- `lon`: Longitude (float) 
- `hour`: Hour of day (0-23)
- `illegal`: Binary target (0 or 1)

## Example Usage

1. **Upload Dataset**:
   ```bash
   curl -X POST "http://localhost:8000/upload-dataset" \
        -F "file=@your_data.csv"
   ```

2. **Train All Models**:
   ```bash
   curl -X POST "http://localhost:8000/train-all-models" \
        -F "dataset_id=your-dataset-id"
   ```

3. **Make Prediction**:
   ```bash
   curl -X POST "http://localhost:8000/predict" \
        -H "Content-Type: application/json" \
        -d '{"lat": 40.7128, "lon": -74.0060, "hour": 22, "model_name": "Random Forest"}'
   ```

## Supabase Integration

The backend automatically creates and manages these tables:
- `datasets`: Stores uploaded CSV data
- `model_trainings`: Stores training results and metrics
- `predictions`: Stores all prediction requests and results

## Testing

Run the test script to verify API functionality:
```bash
python test_api.py
```

## Model Parameters

Each model accepts custom parameters:
- **Random Forest**: `n_estimators`, `max_depth`, etc.
- **SVM**: `kernel` (linear, rbf, poly), `C`, `gamma`
- **KNN**: `n_neighbors`, `weights`
- **Neural Network**: `hidden_layer_sizes`, `activation`, `learning_rate`

## Production Deployment

For production use:
1. Set proper CORS origins in `main.py`
2. Use environment variables for all sensitive data
3. Enable logging and monitoring
4. Scale with multiple worker processes
5. Use a production WSGI server like Gunicorn

## Architecture

```
Frontend (React) → FastAPI Backend → Supabase Database
                                  → ML Models (scikit-learn)
```

The backend serves as the bridge between your React frontend and the ML models, with Supabase providing data persistence and management.
