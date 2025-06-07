
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FishingData, TrainedModel } from "@/types";
import { UploadCloud, Brain, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

interface ModelTrainerProps {
  data: FishingData[] | null;
  onModelTrained: (model: TrainedModel) => void;
}

interface ModelResult {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: number[][];
  model_id: string;
}

const ModelTrainer = ({ data, onModelTrained }: ModelTrainerProps) => {
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentModel, setCurrentModel] = useState("");
  const [trainedModels, setTrainedModels] = useState<ModelResult[]>([]);

  const handleTrainAllModels = async () => {
    if (!data || data.length === 0) {
      toast.error("No data available for training");
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setTrainedModels([]);
    setCurrentModel("Preparing data...");

    try {
      // Convert data to CSV format
      const csvContent = convertDataToCSV(data);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'training_data.csv');

      setCurrentModel("Training all models...");
      setProgress(20);

      const response = await fetch('http://localhost:8000/train-all-models', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Training failed');
      }

      const result = await response.json();
      setProgress(100);
      setCurrentModel("Training completed!");
      setTrainedModels(result.results);

      // Update the parent component with the best model (highest accuracy)
      const bestModel = result.results.reduce((best: ModelResult, current: ModelResult) => 
        current.accuracy > best.accuracy ? current : best
      );

      const trainedModel: TrainedModel = {
        type: bestModel.model_name,
        accuracy: bestModel.accuracy,
        confusionMatrix: bestModel.confusion_matrix,
        id: bestModel.model_id
      };

      onModelTrained(trainedModel);
      toast.success(`Successfully trained ${result.results.length} models! Best: ${bestModel.model_name} (${(bestModel.accuracy * 100).toFixed(1)}% accuracy)`);

    } catch (error) {
      toast.error(`Training failed: ${(error as Error).message}`);
      setCurrentModel("Training failed");
    } finally {
      setIsTraining(false);
    }
  };

  const convertDataToCSV = (data: FishingData[]): string => {
    const headers = ['lat', 'lon', 'hour', 'illegal'];
    const rows = data.map(item => [
      item.lat.toString(),
      item.lon.toString(),
      item.hour.toString(),
      item.illegal ? '1' : '0'
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  };

  const getModelIcon = (modelName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Random Forest': <Brain className="w-4 h-4" />,
      'Decision Tree': <CheckCircle className="w-4 h-4" />,
      'SVM': <Zap className="w-4 h-4" />,
      'KNN': <AlertCircle className="w-4 h-4" />,
      'Neural Network': <Brain className="w-4 h-4" />,
      'Logistic Regression': <CheckCircle className="w-4 h-4" />
    };
    return icons[modelName] || <Brain className="w-4 h-4" />;
  };

  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium tracking-tight">Train ML Models</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Train all machine learning models on your dataset
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            <Brain className="w-3 h-3 mr-1" />
            All Models
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!data || data.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-slate-400">
              <UploadCloud className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No data available for training</p>
              <p className="text-xs mt-1">Please upload data first</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-slate-50/50 rounded-md p-3">
              <div className="text-sm font-medium text-slate-700 mb-1">Dataset Ready</div>
              <div className="text-xs text-slate-500">
                {data.length} data points • Ready to train 6 ML models
              </div>
            </div>

            {isTraining && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{currentModel}</span>
                  <span className="text-slate-500">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {trainedModels.length > 0 && (
              <div className="space-y-3">
                <Separator />
                <div className="text-sm font-medium">Training Results</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {trainedModels
                    .sort((a, b) => b.accuracy - a.accuracy)
                    .map((model, index) => (
                    <div key={model.model_id} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                      <div className="flex items-center gap-2">
                        {getModelIcon(model.model_name)}
                        <div>
                          <div className="text-sm font-medium">{model.model_name}</div>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Best Model
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{(model.accuracy * 100).toFixed(1)}%</div>
                        <div className="text-xs text-slate-500">accuracy</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              className="w-full" 
              onClick={handleTrainAllModels}
              disabled={isTraining}
            >
              {isTraining ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Training Models...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Train All 6 Models
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelTrainer;
