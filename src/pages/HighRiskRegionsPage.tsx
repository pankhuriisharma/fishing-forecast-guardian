
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">
                High Risk Regions Analysis
              </h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive analysis of high-risk areas for illegal fishing activities based on prediction data
            </p>
          </div>

          {/* Overview Cards */}
          <div className="flex justify-center mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl w-full">
              <div className="bg-gradient-to-br from-red-50 to-red-100 p-8 rounded-2xl border-2 border-red-200 shadow-lg transform hover:scale-105 transition-transform duration-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-red-600 mb-2">{regions.length}</div>
                  <div className="text-lg font-semibold text-red-700">Active High-Risk Regions</div>
                  <div className="text-sm text-red-600 mt-1">Identified from prediction history</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-8 rounded-2xl border-2 border-orange-200 shadow-lg transform hover:scale-105 transition-transform duration-200">
                <div className="text-center">
                  <div className="text-5xl font-bold text-orange-600 mb-2">
                    {regions.filter(r => getRiskLevel(r.riskScore).label === 'Critical').length}
                  </div>
                  <div className="text-lg font-semibold text-orange-700">Critical Risk Areas</div>
                  <div className="text-sm text-orange-600 mt-1">Requiring immediate attention</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-12 w-12 border-4 border-current border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {regions.length === 0 ? (
              <Card className="max-w-2xl mx-auto">
                <CardContent className="text-center py-16">
                  <TrendingUp className="h-16 w-16 mx-auto text-slate-400 mb-6" />
                  <h3 className="text-2xl font-medium mb-4">No Risk Data Available</h3>
                  <p className="text-slate-600 text-lg">
                    Make some predictions to see risk pattern analysis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-8">
                {regions.map((region, index) => {
                  const riskLevel = getRiskLevel(region.riskScore);
                  return (
                    <Card key={`${region.latitude}-${region.longitude}`} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-slate-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-4">
                              <span className="text-3xl font-bold text-slate-400 bg-white px-3 py-1 rounded-lg">#{index + 1}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-6 w-6 text-blue-600" />
                                  <span className="text-xl font-semibold">{region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}</span>
                                </div>
                              </div>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-6 mt-3 text-base">
                              <span className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-green-600" />
                                {region.predictionCount} total predictions
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-blue-600" />
                                Last: {new Date(region.lastPrediction).toLocaleDateString()}
                              </span>
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <Badge className={`${riskLevel.color} text-white mb-3 text-sm px-3 py-1`}>
                              {riskLevel.label} Risk
                            </Badge>
                            <div className="text-3xl font-bold text-gray-900">
                              {(region.riskScore * 100).toFixed(1)}%
                            </div>
                            <div className="text-sm text-slate-500 font-medium">Risk Score</div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6 p-6">
                        <div className="grid md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                            <div className="text-sm text-red-700 font-medium mb-1">Illegal Predictions</div>
                            <div className="text-2xl font-bold text-red-600">
                              {region.illegalCount} / {region.predictionCount}
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                            <div className="text-sm text-blue-700 font-medium mb-1">Avg Probability</div>
                            <div className="text-2xl font-bold text-blue-600">
                              {(region.avgProbability * 100).toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                            <div className="text-sm text-purple-700 font-medium mb-1">Peak Hours</div>
                            <div className="text-sm font-semibold text-purple-600">
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
                          <h4 className="font-semibold mb-3 text-lg">Recent Predictions</h4>
                          <div className="space-y-3">
                            {region.recentPredictions.map((pred, i) => (
                              <div key={i} className="flex items-center justify-between text-sm p-4 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors">
                                <span className="font-medium">
                                  Hour {pred.hour}:00 - {pred.model_type}
                                </span>
                                <div className="flex items-center gap-3">
                                  <Badge variant={pred.predicted_illegal ? "destructive" : "secondary"} className="text-xs">
                                    {pred.predicted_illegal ? "Illegal" : "Legal"}
                                  </Badge>
                                  <span className="font-mono font-bold text-gray-700">
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
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HighRiskRegionsPage;
