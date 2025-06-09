
import { supabase } from "@/integrations/supabase/client";
import { apiClient, PredictionResult } from "@/utils/apiClient";
import { Prediction } from "@/types";

export const predictionService = {
  async checkExistingPrediction(
    lat: number, 
    lon: number, 
    hour: number, 
    modelType: string
  ): Promise<Prediction | null> {
    try {
      // Check for existing prediction within a small radius (0.01 degrees ≈ 1km)
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('model_type', modelType)
        .eq('hour', hour)
        .gte('latitude', lat - 0.01)
        .lte('latitude', lat + 0.01)
        .gte('longitude', lon - 0.01)
        .lte('longitude', lon + 0.01)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking existing prediction:', error);
        return null;
      }

      if (data && data.length > 0) {
        const pred = data[0];
        return {
          result: pred.predicted_illegal,
          probability: pred.probability,
          location: [pred.latitude, pred.longitude],
          hour: pred.hour
        };
      }

      return null;
    } catch (error) {
      console.error('Error in checkExistingPrediction:', error);
      return null;
    }
  },

  async makePrediction(
    lat: number, 
    lon: number, 
    hour: number, 
    modelType: string
  ): Promise<Prediction> {
    try {
      // First check if we have a cached prediction
      const existingPrediction = await this.checkExistingPrediction(lat, lon, hour, modelType);
      
      if (existingPrediction) {
        console.log('Using cached prediction from Supabase');
        return existingPrediction;
      }

      // No cached prediction found, call the backend
      console.log('No cached prediction found, calling backend...');
      const backendResult: PredictionResult = await apiClient.predict(lat, lon, hour, modelType);
      
      // The backend already stores the prediction in Supabase, so we just return the result
      return {
        result: backendResult.result,
        probability: backendResult.probability,
        location: [lat, lon],
        hour
      };
    } catch (error) {
      console.error('Error making prediction:', error);
      throw new Error(`Prediction failed: ${(error as Error).message}`);
    }
  },

  async getTrainingHistory() {
    try {
      const { data, error } = await supabase
        .from('model_trainings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching training history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTrainingHistory:', error);
      return [];
    }
  },

  async getPredictionHistory() {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching prediction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPredictionHistory:', error);
      return [];
    }
  }
};
