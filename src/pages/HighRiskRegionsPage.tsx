
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { predictionService } from "@/services/predictionService";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, MapPin, Clock, TrendingUp, Activity } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface DetailedRiskRegion {
  latitude: number;
  longitude: number;
  riskScore: number;
  predictionCount: number;
  avgProbability: number;
  lastPrediction: string;
  illegalCount: number;
  hourlyPattern: { hour: number; count: number }[];
  recentPredictions: any[];
}

const HighRiskRegionsPage = () => {
  const [regions, setRegions] = useState<DetailedRiskRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDetailedRiskRegions();
  }, []);

  const loadDetailedRiskRegions = async () => {
    try {
      setLoading(true);
      const history = await predictionService.getPredictionHistory();
      
      // Group predictions by location
      const locationGroups = new Map<string, any[]>();
      
      history.forEach((pred: any) => {
        const key = `${pred.latitude.toFixed(2)},${pred.longitude.toFixed(2)}`;
        if (!locationGroups.has(key)) {
          locationGroups.set(key, []);
        }
        locationGroups.get(key)!.push(pred);
      });

      // Calculate detailed risk data for each region
      const detailedRegions: DetailedRiskRegion[] = [];
      
      locationGroups.forEach((predictions, locationKey) => {
        const [lat, lon] = locationKey.split(',').map(Number);
        const illegalPredictions = predictions.filter(p => p.predicted_illegal);
        const totalPredictions = predictions.length;
        
        if (illegalPredictions.length > 0 && totalPredictions >= 2) {
          // Calculate hourly patterns
          const hourlyMap = new Map<number, number>();
          predictions.forEach(p => {
            const count = hourlyMap.get(p.hour) || 0;
            hourlyMap.set(p.hour, count + 1);
          });
          
          const hourlyPattern = Array.from(hourlyMap.entries())
            .map(([hour, count]) => ({ hour, count }))
            .sort((a, b) => a.hour - b.hour);

          detailedRegions.push({
            latitude: lat,
            longitude: lon,
            riskScore: (illegalPredictions.length / totalPredictions),
            predictionCount: totalPredictions,
            avgProbability: predictions.reduce((sum, p) => sum + p.probability, 0) / totalPredictions,
            lastPrediction: predictions[0].created_at,
            illegalCount: illegalPredictions.length,
            hourlyPattern,
            recentPredictions: predictions.slice(0, 5)
          });
        }
      });

      // Sort by risk score
      const sortedRegions = detailedRegions
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      setRegions(sortedRegions);
    } catch (error) {
      console.error('Error loading detailed risk regions:', error);
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
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              High Risk Regions Analysis
            </h1>
            <p className="text-lg text-slate-600">
              Comprehensive analysis of high-risk areas for illegal fishing activities
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{regions.length}</div>
              <div className="text-sm text-red-700">Active High-Risk Regions</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {regions.filter(r => getRiskLevel(r.riskScore).label === 'Critical').length}
              </div>
              <div className="text-sm text-orange-700">Critical Risk Areas</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-12 w-12 border-4 border-current border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid gap-6">
            {regions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Risk Data Available</h3>
                  <p className="text-slate-600">
                    Make some predictions to see risk pattern analysis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              regions.map((region, index) => {
                const riskLevel = getRiskLevel(region.riskScore);
                return (
                  <Card key={`${region.latitude}-${region.longitude}`} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-slate-400">#{index + 1}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}
                              </div>
                            </div>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Activity className="h-4 w-4" />
                              {region.predictionCount} total predictions
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Last: {new Date(region.lastPrediction).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className={`${riskLevel.color} text-white mb-2`}>
                            {riskLevel.label} Risk
                          </Badge>
                          <div className="text-2xl font-bold">
                            {(region.riskScore * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm text-slate-500">Risk Score</div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-sm text-slate-600">Illegal Predictions</div>
                          <div className="text-xl font-bold text-red-600">
                            {region.illegalCount} / {region.predictionCount}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-sm text-slate-600">Avg Probability</div>
                          <div className="text-xl font-bold">
                            {(region.avgProbability * 100).toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <div className="text-sm text-slate-600">Peak Hours</div>
                          <div className="text-sm">
                            {region.hourlyPattern
                              .sort((a, b) => b.count - a.count)
                              .slice(0, 3)
                              .map(h => `${h.hour}:00`)
                              .join(", ")
                            }
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Recent Predictions</h4>
                        <div className="space-y-2">
                          {region.recentPredictions.map((pred, i) => (
                            <div key={i} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                              <span>
                                Hour {pred.hour}:00 - {pred.model_type}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant={pred.predicted_illegal ? "destructive" : "secondary"}>
                                  {pred.predicted_illegal ? "Illegal" : "Legal"}
                                </Badge>
                                <span className="font-mono">
                                  {(pred.probability * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default HighRiskRegionsPage;
