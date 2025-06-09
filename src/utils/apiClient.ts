
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

export const apiClient = {
  async uploadDataset(file: File): Promise<{ dataset_id: string; message: string; columns: string[] }> {
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
  },

  async trainModel(datasetId: string, modelName: string): Promise<TrainingResult> {
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
  },

  async trainAllModels(datasetId: string): Promise<{ results: Array<{ model_name: string; success: boolean; result?: TrainingResult; error?: string }> }> {
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
  },

  async predict(lat: number, lon: number, hour: number, modelName: string): Promise<PredictionResult> {
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
  },

  async getAvailableModels(): Promise<{ models: string[]; total: number }> {
    const response = await fetch(`${BACKEND_URL}/models`);
    
    if (!response.ok) {
      throw new Error(`Failed to get models: ${response.statusText}`);
    }
    
    return response.json();
  },
};
