
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { TrainedModel, Prediction } from "@/types";
import { predictionService } from "@/services/predictionService";
import { Clock, Locate, AlertTriangle, ArrowRight, BarChart3, Database } from "lucide-react";
import { toast } from "sonner";

interface PredictionFormProps {
  trainedModel: TrainedModel | null;
  location: [number, number] | null;
  onPredict: (prediction: Prediction) => void;
}

const PredictionForm = ({ trainedModel, location, onPredict }: PredictionFormProps) => {
  const [hour, setHour] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [usingCachedResult, setUsingCachedResult] = useState<boolean>(false);
  
  const formatHour = (value: number): string => {
    return `${value.toString().padStart(2, '0')}:00`;
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
    setUsingCachedResult(false);
    
    try {
      const [lat, lon] = location;
      
      // Check for existing prediction first
      const existingPrediction = await predictionService.checkExistingPrediction(
        lat, lon, hour, trainedModel.type
      );
      
      if (existingPrediction) {
        setUsingCachedResult(true);
        onPredict(existingPrediction);
        toast.success("Using cached prediction result from database");
      } else {
        // Make new prediction via backend
        const prediction = await predictionService.makePrediction(lat, lon, hour, trainedModel.type);
        onPredict(prediction);
        toast.success("New prediction calculated and stored");
      }
    } catch (error) {
      toast.error(`Prediction failed: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-primary/10">
              <BarChart3 className="w-3 h-3 mr-1" />
              Prediction
            </Badge>
            {usingCachedResult && (
              <Badge variant="outline" className="bg-green-100 text-green-800">
                <Database className="w-3 h-3 mr-1" />
                Cached
              </Badge>
            )}
          </div>
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
