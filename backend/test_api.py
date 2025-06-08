
import requests
import json

# Test script for the ML API
BASE_URL = "http://localhost:8000"

def test_api():
    print("Testing Illegal Fishing ML API...")
    
    # Test root endpoint
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root endpoint: {response.json()}")
    except Exception as e:
        print(f"Error testing root endpoint: {e}")
    
    # Test get models
    try:
        response = requests.get(f"{BASE_URL}/models")
        print(f"Available models: {response.json()}")
    except Exception as e:
        print(f"Error getting models: {e}")
    
    # Test prediction (assuming there's a trained model)
    try:
        prediction_data = {
            "lat": 40.7128,
            "lon": -74.0060,
            "hour": 22,
            "model_name": "Random Forest"
        }
        response = requests.post(f"{BASE_URL}/predict", json=prediction_data)
        print(f"Prediction result: {response.json()}")
    except Exception as e:
        print(f"Error making prediction: {e}")

if __name__ == "__main__":
    test_api()
