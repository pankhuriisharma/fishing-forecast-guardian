
import { ModelDefinition, ModelType } from "../types";
import { apiClient, TrainingResult } from "./apiClient";

export const modelDefinitions: Record<ModelType, ModelDefinition> = {
  "Random Forest": {
    name: "Random Forest",
    description: "An ensemble of decision trees that improves accuracy and reduces overfitting through voting mechanisms.",
    accuracy: "80-90%",
    icon: "trees",
    color: "bg-green-600"
  },
  "SVM": {
    name: "Support Vector Machine", 
    description: "A classifier that finds the optimal boundary to separate classes in high-dimensional space.",
    accuracy: "75-85%",
    icon: "divide",
    color: "bg-blue-600"
  },
  "Logistic Regression": {
    name: "Logistic Regression",
    description: "A simple yet effective statistical model for binary classification problems with probability outcomes.",
    accuracy: "70-80%",
    icon: "line-chart",
    color: "bg-indigo-600"
  },
  "Decision Tree": {
    name: "Decision Tree",
    description: "A tree-structured classifier that splits data based on feature importance and information gain.",
    accuracy: "65-75%",
    icon: "git-branch",
    color: "bg-yellow-600"
  },
  "KNN": {
    name: "K-Nearest Neighbors",
    description: "A distance-based classifier that makes predictions based on the closest examples in the feature space.",
    accuracy: "60-75%",
    icon: "target",
    color: "bg-red-600"
  },
  "Neural Network": {
    name: "Neural Network", 
    description: "A deep learning model that mimics human brain structure to recognize complex patterns in data.",
    accuracy: "78-92%",
    icon: "network",
    color: "bg-purple-600"
  }
};

// Function to train model using the backend
export const trainModel = async (
  model: ModelType,
  datasetId: string,
  params?: any
): Promise<{ accuracy: number; confusionMatrix: number[][] }> => {
  try {
    console.log(`Training ${model} model with dataset ${datasetId}...`);
    const result: TrainingResult = await apiClient.trainModel(datasetId, model);
    
    return {
      accuracy: result.accuracy,
      confusionMatrix: result.confusion_matrix
    };
  } catch (error) {
    console.error(`Error training ${model} model:`, error);
    throw new Error(`Failed to train ${model} model: ${(error as Error).message}`);
  }
};

// Function to train all models using the backend
export const trainAllModels = async (datasetId: string) => {
  try {
    console.log('Training all models with dataset', datasetId);
    const result = await apiClient.trainAllModels(datasetId);
    return result;
  } catch (error) {
    console.error('Error training all models:', error);
    throw new Error(`Failed to train models: ${(error as Error).message}`);
  }
};

// Upload dataset to backend
export const uploadDataset = async (file: File) => {
  try {
    console.log('Uploading dataset:', file.name);
    const result = await apiClient.uploadDataset(file);
    return result;
  } catch (error) {
    console.error('Error uploading dataset:', error);
    throw new Error(`Failed to upload dataset: ${(error as Error).message}`);
  }
};

// Mockup function to predict illegal fishing (kept for fallback)
export const predictIllegalFishing = (
  latitude: number,
  longitude: number,
  hour: number
): { result: boolean; probability: number } => {
  // Simple mockup logic for prediction
  // Real implementation would use the trained model
  
  // Distance from the equator increases likelihood (just for demo)
  const latEffect = Math.abs(latitude) / 90;
  
  // Hour effect - higher probability during night hours
  const hourEffect = hour >= 19 || hour <= 4 ? 0.3 : -0.1;
  
  // Random factor
  const randomFactor = Math.random() * 0.2;
  
  // Calculate probability
  let probability = 0.3 + latEffect + hourEffect + randomFactor;
  probability = Math.max(0, Math.min(1, probability)); // Ensure between 0 and 1
  
  return {
    result: probability > 0.5,
    probability
  };
};
