
import { supabase } from "@/integrations/supabase/client";

export interface HistoricalPrediction {
  latitude: number;
  longitude: number;
  hour: number;
  prediction_result: boolean;
  prediction_probability: number;
  actual_result?: boolean;
}

export const getHistoricalPredictions = async (): Promise<HistoricalPrediction[]> => {
  try {
    const { data, error } = await supabase
      .from('model_predictions')
      .select('latitude, longitude, hour, prediction_result, prediction_probability, actual_result')
      .order('created_at', { ascending: false })
      .limit(1000); // Get last 1000 predictions

    if (error) {
      console.error('Error fetching historical predictions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getHistoricalPredictions:', error);
    return [];
  }
};

export const enhancePredictionWithHistory = async (
  lat: number,
  lon: number,
  hour: number,
  basePrediction: { result: boolean; probability: number }
): Promise<{ result: boolean; probability: number }> => {
  try {
    const historicalData = await getHistoricalPredictions();
    
    if (historicalData.length === 0) {
      return basePrediction;
    }

    // Find similar predictions (within 0.1 degrees and same hour)
    const similarPredictions = historicalData.filter(pred => 
      Math.abs(pred.latitude - lat) < 0.1 &&
      Math.abs(pred.longitude - lon) < 0.1 &&
      pred.hour === hour
    );

    if (similarPredictions.length === 0) {
      return basePrediction;
    }

    // Calculate average probability from similar predictions
    const avgProbability = similarPredictions.reduce((sum, pred) => 
      sum + pred.prediction_probability, 0) / similarPredictions.length;

    // Blend base prediction with historical average (70% base, 30% historical)
    const enhancedProbability = (basePrediction.probability * 0.7) + (avgProbability * 0.3);
    
    return {
      result: enhancedProbability > 0.5,
      probability: Math.max(0, Math.min(1, enhancedProbability))
    };
  } catch (error) {
    console.error('Error enhancing prediction:', error);
    return basePrediction;
  }
};

export const getModelAccuracyTrend = async (modelName: string): Promise<number[]> => {
  try {
    const { data, error } = await supabase
      .from('ml_model_results')
      .select('accuracy, created_at')
      .eq('model_name', modelName)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching model accuracy trend:', error);
      return [];
    }

    return data.map(result => result.accuracy);
  } catch (error) {
    console.error('Error in getModelAccuracyTrend:', error);
    return [];
  }
};
