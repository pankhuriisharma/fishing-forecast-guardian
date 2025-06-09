
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

  async getHistoricalDataForLocation(
    lat: number, 
    lon: number, 
    radius: number = 0.05
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .gte('latitude', lat - radius)
        .lte('latitude', lat + radius)
        .gte('longitude', lon - radius)
        .lte('longitude', lon + radius)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching historical data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getHistoricalDataForLocation:', error);
      return [];
    }
  },

  async calculateEnhancedProbability(
    lat: number,
    lon: number,
    hour: number,
    baseProbability: number
  ): Promise<number> {
    try {
      // Get historical data for this location
      const historicalData = await this.getHistoricalDataForLocation(lat, lon);
      
      if (historicalData.length === 0) {
        return baseProbability;
      }

      // Calculate factors based on historical data
      const hourlyData = historicalData.filter(d => d.hour === hour);
      const nearbyData = historicalData.filter(d => 
        Math.abs(d.latitude - lat) <= 0.02 && Math.abs(d.longitude - lon) <= 0.02
      );

      // Time-based adjustment
      let timeAdjustment = 0;
      if (hourlyData.length > 0) {
        const hourlyIllegalRate = hourlyData.filter(d => d.predicted_illegal).length / hourlyData.length;
        timeAdjustment = (hourlyIllegalRate - 0.5) * 0.2; // Max ±20% adjustment
      }

      // Location-based adjustment
      let locationAdjustment = 0;
      if (nearbyData.length > 0) {
        const locationIllegalRate = nearbyData.filter(d => d.predicted_illegal).length / nearbyData.length;
        locationAdjustment = (locationIllegalRate - 0.5) * 0.3; // Max ±30% adjustment
      }

      // Recent activity adjustment
      let recentActivityAdjustment = 0;
      const recentData = historicalData.filter(d => {
        const predTime = new Date(d.created_at);
        const now = new Date();
        const daysDiff = (now.getTime() - predTime.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // Last 7 days
      });

      if (recentData.length > 0) {
        const recentIllegalRate = recentData.filter(d => d.predicted_illegal).length / recentData.length;
        recentActivityAdjustment = (recentIllegalRate - 0.5) * 0.15; // Max ±15% adjustment
      }

      // Apply adjustments
      let enhancedProbability = baseProbability + timeAdjustment + locationAdjustment + recentActivityAdjustment;
      
      // Ensure probability stays within bounds
      enhancedProbability = Math.max(0, Math.min(1, enhancedProbability));

      console.log(`Enhanced probability calculation:
        Base: ${baseProbability.toFixed(3)}
        Time adj: ${timeAdjustment.toFixed(3)}
        Location adj: ${locationAdjustment.toFixed(3)}
        Recent adj: ${recentActivityAdjustment.toFixed(3)}
        Final: ${enhancedProbability.toFixed(3)}`);

      return enhancedProbability;
    } catch (error) {
      console.error('Error calculating enhanced probability:', error);
      return baseProbability;
    }
  },

  async storePrediction(
    lat: number,
    lon: number,
    hour: number,
    modelType: string,
    result: boolean,
    probability: number
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          model_type: modelType,
          latitude: lat,
          longitude: lon,
          hour: hour,
          predicted_illegal: result,
          probability: probability
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing prediction:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in storePrediction:', error);
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
      
      // Enhance probability using historical data
      const enhancedProbability = await this.calculateEnhancedProbability(
        lat, lon, hour, backendResult.probability
      );
      
      const enhancedResult = enhancedProbability > 0.5;

      // Store the enhanced prediction in Supabase
      await this.storePrediction(lat, lon, hour, modelType, enhancedResult, enhancedProbability);

      return {
        result: enhancedResult,
        probability: enhancedProbability,
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
