
import { ModelDefinition, ModelType } from "../types";

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

// Mockup function to simulate model training
export const trainModel = (
  model: ModelType,
  data: { X: number[][], y: number[] },
  params: any
): { accuracy: number; confusionMatrix: number[][] } => {
  // Simulate model training with different accuracies based on model type
  let baseAccuracy = 0;
  
  switch (model) {
    case "Random Forest":
      baseAccuracy = 0.85;
      break;
    case "Neural Network":
      baseAccuracy = 0.84;
      break;
    case "SVM":
      baseAccuracy = 0.82;
      break;
    case "Logistic Regression":
      baseAccuracy = 0.76;
      break;
    case "Decision Tree":
      baseAccuracy = 0.72;
      break;
    case "KNN":
      baseAccuracy = 0.68;
      break;
    default:
      baseAccuracy = 0.75;
  }
  
  // Add random variation
  const accuracy = baseAccuracy + (Math.random() * 0.1 - 0.05);
  
  // Create a simple confusion matrix
  // For binary classification: [[TN, FP], [FN, TP]]
  const numSamples = data.y.length;
  const truePositives = Math.floor(numSamples * accuracy * 0.4);
  const trueNegatives = Math.floor(numSamples * accuracy * 0.6);
  const falsePositives = Math.floor(numSamples * (1 - accuracy) * 0.5);
  const falseNegatives = numSamples - truePositives - trueNegatives - falsePositives;
  
  return {
    accuracy,
    confusionMatrix: [
      [trueNegatives, falsePositives],
      [falseNegatives, truePositives]
    ]
  };
};

// Mockup function to predict illegal fishing
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
