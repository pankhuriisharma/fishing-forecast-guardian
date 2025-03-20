
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrainedModel, Prediction } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, X, AlertTriangle, Percent, Trophy, Brain } from "lucide-react";

// Helper function to get color based on likelihood
const getLikelihoodColor = (probability: number): string => {
  if (probability >= 0.7) return "text-red-500";
  if (probability >= 0.4) return "text-yellow-500";
  return "text-green-500";
};

interface ModelResultsProps {
  trainedModel: TrainedModel | null;
  prediction: Prediction | null;
}

const ModelResults = ({ trainedModel, prediction }: ModelResultsProps) => {
  if (!trainedModel) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-medium tracking-tight">Model Results</CardTitle>
          <CardDescription>Train a model to see results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-slate-400">
              <Brain className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No model has been trained yet</p>
              <p className="text-xs mt-1">Train a model to view performance metrics</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { accuracy, confusionMatrix, type } = trainedModel;
  
  // Compute precision and recall from confusion matrix
  const truePositives = confusionMatrix[1][1];
  const falsePositives = confusionMatrix[0][1];
  const falseNegatives = confusionMatrix[1][0];
  
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = 2 * ((precision * recall) / (precision + recall)) || 0;
  
  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium tracking-tight">Model Results</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Performance metrics and prediction details
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            <Trophy className="w-3 h-3 mr-1" />
            {type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">Accuracy</div>
            <div className="text-sm font-semibold">{(accuracy * 100).toFixed(1)}%</div>
          </div>
          <Progress value={accuracy * 100} className="h-2" />
          
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="flex flex-col items-center bg-slate-50 p-2 rounded-md">
              <div className="text-xs text-slate-500 mb-1">Precision</div>
              <div className="text-sm font-semibold">{(precision * 100).toFixed(1)}%</div>
            </div>
            <div className="flex flex-col items-center bg-slate-50 p-2 rounded-md">
              <div className="text-xs text-slate-500 mb-1">Recall</div>
              <div className="text-sm font-semibold">{(recall * 100).toFixed(1)}%</div>
            </div>
            <div className="flex flex-col items-center bg-slate-50 p-2 rounded-md">
              <div className="text-xs text-slate-500 mb-1">F1 Score</div>
              <div className="text-sm font-semibold">{(f1Score * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
        
        <Separator />
        
        {prediction ? (
          <div className="space-y-3">
            <div className="text-sm font-medium">Prediction Result</div>
            
            <Alert variant={prediction.result ? "destructive" : "default"} className="border-2">
              <div className="flex items-start">
                {prediction.result ? (
                  <AlertTriangle className="h-5 w-5 mr-2 text-destructive-foreground" />
                ) : (
                  <Check className="h-5 w-5 mr-2 text-green-500" />
                )}
                <div>
                  <AlertTitle className="mb-2 font-semibold">
                    {prediction.result 
                      ? "High Risk of Illegal Fishing" 
                      : "Low Risk of Illegal Fishing"}
                  </AlertTitle>
                  <AlertDescription>
                    <div className="text-sm">
                      <div className="flex items-center mb-1">
                        <Percent className="h-4 w-4 mr-1" />
                        Probability: <span className={`ml-1 font-semibold ${getLikelihoodColor(prediction.probability)}`}>
                          {(prediction.probability * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Time: {prediction.hour}:00
                      </div>
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
            
            <div className="bg-slate-50 p-3 rounded-md">
              <div className="text-xs font-medium text-slate-500 mb-2">Prediction Details</div>
              <div className="text-sm">
                <p>The model analyzed the provided location and time, considering factors like proximity to known fishing grounds, time of day patterns, and historical data.</p>
                <div className="mt-2 p-2 border border-slate-200 rounded bg-white">
                  <div className="flex items-start">
                    <div className={`h-3 w-3 rounded-full mt-1 mr-2 ${prediction.result ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <p className="text-xs">
                      {prediction.result 
                        ? "There is a significant probability of illegal fishing activity at this location and time. Consider increasing surveillance or enforcement in this area."
                        : "The model predicts low likelihood of illegal fishing activity. However, continue routine monitoring as conditions may change."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-6">
            <div className="text-center text-slate-400">
              <AlertTriangle className="mx-auto h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No prediction has been made yet</p>
              <p className="text-xs mt-1">Make a prediction to see results</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Define Clock component for time display
const Clock = ({ className }: { className?: string }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
};

export default ModelResults;
