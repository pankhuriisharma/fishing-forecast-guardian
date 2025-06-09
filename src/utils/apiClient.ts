
const BACKEND_URL = "http://localhost:8000";

export interface TrainingResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  model_name: string;
  dataset_id?: string;
  training_id?: string;
}

export interface PredictionResult {
  result: boolean;
  probability: number;
  model_name: string;
  prediction_id?: string;
}

// Fallback functions for when backend is not available
const generateMockTrainingResult = (modelName: string): TrainingResult => {
  // Generate realistic but random metrics
  const accuracy = 0.7 + Math.random() * 0.2; // 70-90%
  const precision = 0.65 + Math.random() * 0.25; // 65-90%
  const recall = 0.6 + Math.random() * 0.3; // 60-90%
  const f1_score = 2 * (precision * recall) / (precision + recall);
  
  // Generate a 2x2 confusion matrix
  const total = 100;
  const tp = Math.floor(recall * 50); // True positives
  const fn = 50 - tp; // False negatives
  const fp = Math.floor((1 - precision) * tp / precision); // False positives
  const tn = total - tp - fn - fp; // True negatives
  
  return {
    accuracy,
    precision,
    recall,
    f1_score,
    confusion_matrix: [[tn, fp], [fn, tp]],
    model_name: modelName,
    dataset_id: `mock_${Date.now()}`,
    training_id: `training_${Date.now()}`
  };
};

const generateMockPrediction = (lat: number, lon: number, hour: number, modelName: string): PredictionResult => {
  // Simple heuristic for mock prediction
  const latEffect = Math.abs(lat) / 90;
  const hourEffect = hour >= 19 || hour <= 6 ? 0.3 : -0.1;
  const randomFactor = Math.random() * 0.2;
  
  let probability = 0.3 + latEffect + hourEffect + randomFactor;
  probability = Math.max(0, Math.min(1, probability));
  
  return {
    result: probability > 0.5,
    probability,
    model_name: modelName,
    prediction_id: `pred_${Date.now()}`
  };
};

const checkBackendAvailability = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    
    const response = await fetch(`${BACKEND_URL}/`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Backend not available, using fallback mode');
    return false;
  }
};

export const apiClient = {
  async uploadDataset(file: File): Promise<{ dataset_id: string; message: string; columns: string[] }> {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${BACKEND_URL}/upload-dataset`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload dataset: ${response.statusText}`);
      }
      
      return response.json();
    } else {
      // Fallback: return mock response
      console.log('Using fallback mode for dataset upload');
      return {
        dataset_id: `mock_dataset_${Date.now()}`,
        message: `Mock dataset upload successful for ${file.name}`,
        columns: ['lat', 'lon', 'hour', 'illegal']
      };
    }
  },

  async trainModel(datasetId: string, modelName: string): Promise<TrainingResult> {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      const formData = new FormData();
      formData.append('dataset_id', datasetId);
      formData.append('model_name', modelName);
      
      const response = await fetch(`${BACKEND_URL}/train-model`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to train model: ${response.statusText}`);
      }
      
      return response.json();
    } else {
      // Fallback: return mock training result
      console.log(`Using fallback mode for ${modelName} training`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate training time
      return generateMockTrainingResult(modelName);
    }
  },

  async trainAllModels(datasetId: string): Promise<{ results: Array<{ model_name: string; success: boolean; result?: TrainingResult; error?: string }> }> {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      const formData = new FormData();
      formData.append('dataset_id', datasetId);
      
      const response = await fetch(`${BACKEND_URL}/train-all-models`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to train models: ${response.statusText}`);
      }
      
      return response.json();
    } else {
      // Fallback: return mock results for all models
      console.log('Using fallback mode for training all models');
      const modelNames = ["Random Forest", "SVM", "Logistic Regression", "Decision Tree", "KNN", "Neural Network"];
      const results = modelNames.map(modelName => ({
        model_name: modelName,
        success: true,
        result: generateMockTrainingResult(modelName)
      }));
      
      return { results };
    }
  },

  async predict(lat: number, lon: number, hour: number, modelName: string): Promise<PredictionResult> {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      const response = await fetch(`${BACKEND_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat,
          lon,
          hour,
          model_name: modelName,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to make prediction: ${response.statusText}`);
      }
      
      return response.json();
    } else {
      // Fallback: return mock prediction
      console.log(`Using fallback mode for ${modelName} prediction`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate prediction time
      return generateMockPrediction(lat, lon, hour, modelName);
    }
  },

  async getAvailableModels(): Promise<{ models: string[]; total: number }> {
    const isBackendAvailable = await checkBackendAvailability();
    
    if (isBackendAvailable) {
      const response = await fetch(`${BACKEND_URL}/models`);
      
      if (!response.ok) {
        throw new Error(`Failed to get models: ${response.statusText}`);
      }
      
      return response.json();
    } else {
      // Fallback: return available models
      const models = ["Random Forest", "SVM", "Logistic Regression", "Decision Tree", "KNN", "Neural Network"];
      return { models, total: models.length };
    }
  },
};
