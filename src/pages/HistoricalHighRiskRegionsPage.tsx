
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, MapPin, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { predictionService } from "@/services/predictionService";

interface HighRiskRegion {
  latitude: number;
  longitude: number;
  riskScore: number;
  predictionCount: number;
  avgProbability: number;
  lastPrediction: string;
}

const HistoricalHighRiskRegionsPage = () => {
  const [regions, setRegions] = useState<HighRiskRegion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHighRiskRegions();
  }, []);

  const loadHighRiskRegions = async () => {
    try {
      setLoading(true);
      const history = await predictionService.getPredictionHistory();
      const locationGroups = new Map<string, any[]>();
      
      history.forEach((pred: any) => {
        const key = `${pred.latitude.toFixed(2)},${pred.longitude.toFixed(2)}`;
        if (!locationGroups.has(key)) {
          locationGroups.set(key, []);
        }
        locationGroups.get(key)!.push(pred);
      });

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

      const topRiskRegions = riskRegions
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      setRegions(topRiskRegions);
    } catch (error) {
      setRegions([]);
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      <main className="flex-1 flex flex-col items-center px-2 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <Card className="mt-8 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl font-black text-gray-900">
                <Database className="h-8 w-8 text-purple-700" />
                Historical High Risk Regions
              </CardTitle>
              <CardDescription className="text-lg text-slate-500">
                Regions with highest probability of illegal fishing based on your prediction history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
                </div>
              ) : (
                <>
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
                            className="flex items-center justify-between p-4 border rounded-xl bg-white mb-2 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-mono text-slate-500">#{index + 1}</div>
                              <div>
                                <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
                                  <MapPin className="h-5 w-5 text-slate-500" />
                                  <span>{region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                  <span>{region.predictionCount} predictions</span>
                                  <span>{(region.avgProbability * 100).toFixed(1)}% avg probability</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {new Date(region.lastPrediction).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${riskLevel.color} text-white font-bold px-3 py-1 text-base`}>
                                {riskLevel.label}
                              </Badge>
                              <div className="text-right ml-2 min-w-[80px]">
                                <div className="text-lg font-bold">
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default HistoricalHighRiskRegionsPage;

