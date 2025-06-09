
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { predictionService } from "@/services/predictionService";
import { AlertTriangle, MapPin, Clock, TrendingUp, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RealTimeFishingData from "./RealTimeFishingData";

interface HighRiskRegion {
  latitude: number;
  longitude: number;
  riskScore: number;
  predictionCount: number;
  avgProbability: number;
  lastPrediction: string;
}

const HighRiskRegions = () => {
  const [regions, setRegions] = useState<HighRiskRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadHighRiskRegions();
  }, []);

  const loadHighRiskRegions = async () => {
    try {
      setLoading(true);
      const history = await predictionService.getPredictionHistory();
      
      // Group predictions by location (rounded to 2 decimal places for clustering)
      const locationGroups = new Map<string, any[]>();
      
      history.forEach((pred: any) => {
        const key = `${pred.latitude.toFixed(2)},${pred.longitude.toFixed(2)}`;
        if (!locationGroups.has(key)) {
          locationGroups.set(key, []);
        }
        locationGroups.get(key)!.push(pred);
      });

      // Calculate risk scores for each region
      const riskRegions: HighRiskRegion[] = [];
      
      locationGroups.forEach((predictions, locationKey) => {
        const [lat, lon] = locationKey.split(',').map(Number);
        const illegalPredictions = predictions.filter(p => p.predicted_illegal);
        const totalPredictions = predictions.length;
        const avgProbability = predictions.reduce((sum, p) => sum + p.probability, 0) / totalPredictions;
        
        if (illegalPredictions.length > 0) {
          riskRegions.push({
            latitude: lat,
            longitude: lon,
            riskScore: (illegalPredictions.length / totalPredictions) * avgProbability,
            predictionCount: totalPredictions,
            avgProbability,
            lastPrediction: predictions[0].created_at
          });
        }
      });

      // Sort by risk score and take top 10
      const topRiskRegions = riskRegions
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      setRegions(topRiskRegions);
    } catch (error) {
      console.error('Error loading high risk regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.8) return { label: "Critical", color: "bg-red-600" };
    if (score >= 0.6) return { label: "High", color: "bg-orange-500" };
    if (score >= 0.4) return { label: "Medium", color: "bg-yellow-500" };
    return { label: "Low", color: "bg-green-500" };
  };

  const HistoricalRiskRegions = () => {
    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Historical Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-500" />
            Historical High Risk Regions
          </CardTitle>
          <CardDescription>
            Regions with highest probability of illegal fishing based on your prediction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {regions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No high-risk regions identified yet. Make some predictions to see patterns.
            </p>
          ) : (
            <div className="space-y-3">
              {regions.map((region, index) => {
                const riskLevel = getRiskLevel(region.riskScore);
                return (
                  <div
                    key={`${region.latitude}-${region.longitude}`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-mono text-slate-500">#{index + 1}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-500" />
                          <span className="font-medium">
                            {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                          <span>{region.predictionCount} predictions</span>
                          <span>{(region.avgProbability * 100).toFixed(1)}% avg probability</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(region.lastPrediction).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${riskLevel.color} text-white`}>
                        {riskLevel.label}
                      </Badge>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {(region.riskScore * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-slate-500">Risk Score</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="realtime" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Real-Time Data
          </TabsTrigger>
          <TabsTrigger value="historical" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Historical Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="realtime" className="space-y-4">
          <RealTimeFishingData />
        </TabsContent>
        
        <TabsContent value="historical" className="space-y-4">
          <HistoricalRiskRegions />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={() => navigate("/high-risk-regions")}
          className="w-full"
        >
          View Detailed High Risk Analysis
        </Button>
      </div>
    </div>
  );
};

export default HighRiskRegions;
