
export interface DataPoint {
  id: string;
  lat: number;
  lon: number;
  timestamp: string;
  hour: number;
  illegal: number;
}

export interface FishingData {
  lat: number;
  lon: number;
  hour: number;
  illegal: number;
}

export interface ModelDefinition {
  name: string;
  description: string;
  accuracy: string;
  icon: string;
  color: string;
}

export interface ChartData {
  hour: number;
  illegal: number;
}

export interface ActivityCount {
  Illegal: number;
  Count: number;
}

export interface Prediction {
  result: boolean;
  probability: number;
  location: [number, number];
  hour: number;
}

export type ModelType = 
  | "Random Forest" 
  | "SVM" 
  | "Logistic Regression" 
  | "Decision Tree" 
  | "KNN" 
  | "Neural Network";

export interface ModelParams {
  randomForest?: {
    n_estimators: number;
  };
  svm?: {
    kernel: "linear" | "rbf" | "poly";
  };
  knn?: {
    neighbors: number;
  };
  neuralNetwork?: {
    activation: "relu" | "tanh" | "logistic" | "identity";
  };
}

export interface TrainedModel {
  type: ModelType;
  accuracy: number;
  confusionMatrix: number[][];
  params?: ModelParams;
  id?: string;
}
