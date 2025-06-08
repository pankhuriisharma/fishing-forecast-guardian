import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { TrainedModel, Prediction } from "@/types";
import { predictIllegalFishing } from "@/utils/fishingModels";
import { Clock, Locate, AlertTriangle, ArrowRight, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PredictionFormProps {
  trainedModel: TrainedModel | null;
  location: [number, number] | null;
  onPredict: (prediction: Prediction) => void;
}

const PredictionForm = ({ trainedModel, location, onPredict }: PredictionFormProps) => {
  const [hour, setHour] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const formatHour = (value: number): string => {
    return `${value.toString().padStart(2, '0')}:00`;
  };
  
  const getLikelihoodColor = (probability: number): string => {
    if (probability > 0.7) return "text-red-500";
    if (probability > 0.4) return "text-amber-500";
    return "text-green-500";
  };

  const savePredictionToDatabase = async (prediction: Prediction, modelId?: string) => {
    try {
      let modelResultId = null;
      
      // Try to find the latest model result for this model type
      if (trainedModel?.type) {
        const { data: modelResults } = await supabase
          .from('ml_model_results')
          .select('id')
          .eq('model_name', trainedModel.type)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (modelResults && modelResults.length > 0) {
          modelResultId = modelResults[0].id;
        }
      }

      const predictionData = {
        model_result_id: modelResultId,
        latitude: prediction.location[0],
        longitude: prediction.location[1],
        hour: prediction.hour,
        prediction_result: prediction.result,
        prediction_probability: prediction.probability
      };

      const { error } = await supabase
        .from('model_predictions')
        .insert(predictionData);

      if (error) {
        console.error('Error saving prediction:', error);
      } else {
        console.log('Prediction saved successfully');
      }
    } catch (error) {
      console.error('Error in savePredictionToDatabase:', error);
    }
  };
  
  const handlePredict = async () => {
    if (!location) {
      toast.error("Please select a location on the map first");
      return;
    }
    
    if (!trainedModel) {
      toast.error("No trained model available. Please train a model first.");
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate a brief delay for prediction calculation
    setTimeout(async () => {
      try {
        const [lat, lon] = location;
        const prediction = predictIllegalFishing(lat, lon, hour);
        
        const result: Prediction = {
          result: prediction.result,
          probability: prediction.probability,
          location: [lat, lon],
          hour
        };
        
        // Save prediction to database
        await savePredictionToDatabase(result, trainedModel.id);
        
        onPredict(result);
        toast.success("Prediction calculated and saved successfully");
      } catch (error) {
        toast.error(`Prediction failed: ${(error as Error).message}`);
      } finally {
        setIsSubmitting(false);
      }
    }, 800);
  };
  
  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium tracking-tight">Predict Illegal Fishing</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Set parameters and predict illegal fishing likelihood
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            <BarChart3 className="w-3 h-3 mr-1" />
            Prediction
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Locate className="h-4 w-4 mr-2 text-slate-500" />
              <span className="text-sm font-medium">Selected Location</span>
            </div>
            {location ? (
              <Badge variant="outline" className="font-mono">
                {location[0].toFixed(4)}, {location[1].toFixed(4)}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-500 bg-red-50">
                No location selected
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-slate-500" />
              <span className="text-sm font-medium">Time of Day</span>
            </div>
            <Badge variant="outline" className="font-mono">
              {formatHour(hour)}
            </Badge>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="text-sm font-medium">Select Hour for Prediction</div>
          <Slider
            value={[hour]}
            min={0}
            max={23}
            step={1}
            onValueChange={([value]) => setHour(value)}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>
        
        {!trainedModel && (
          <div className="flex items-center p-2 bg-amber-50 border border-amber-200 rounded-md text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
            <span className="text-amber-800">
              You need to train a model before making predictions.
            </span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full"
          onClick={handlePredict}
          disabled={!location || !trainedModel || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Processing...
            </>
          ) : (
            <>
              Run Prediction
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PredictionForm;
