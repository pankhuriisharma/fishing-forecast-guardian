
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
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center mb-8">
            <Button 
              variant="outline" 
              onClick={() => navigate("/")}
              className="gap-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          
          {/* Hero Section - Centered */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl shadow-lg">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl font-bold text-gray-900 mb-2">
                  High Risk Regions
                </h1>
                <h2 className="text-2xl font-semibold text-gray-600">
                  Analysis Dashboard
                </h2>
              </div>
            </div>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Comprehensive analysis of high-risk areas for illegal fishing activities based on historical prediction data and machine learning insights
            </p>
          </div>

          {/* Overview Cards - Centered */}
          <div className="flex justify-center mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl w-full">
              <div className="bg-gradient-to-br from-red-50 via-red-100 to-red-200 p-10 rounded-3xl border-2 border-red-200 shadow-xl transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center">
                  <div className="text-6xl font-bold text-red-600 mb-4">{regions.length}</div>
                  <div className="text-xl font-bold text-red-700 mb-2">Active High-Risk Regions</div>
                  <div className="text-base text-red-600">Identified from prediction history</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 p-10 rounded-3xl border-2 border-orange-200 shadow-xl transform hover:scale-105 transition-all duration-300 hover:shadow-2xl">
                <div className="text-center">
                  <div className="text-6xl font-bold text-orange-600 mb-4">
                    {regions.filter(r => getRiskLevel(r.riskScore).label === 'Critical').length}
                  </div>
                  <div className="text-xl font-bold text-orange-700 mb-2">Critical Risk Areas</div>
                  <div className="text-base text-orange-600">Requiring immediate attention</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-80">
              <div className="text-center">
                <div className="animate-spin h-16 w-16 border-4 border-ocean border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-xl text-gray-600">Loading risk analysis...</p>
              </div>
            </div>
          ) : (
            <>
              {regions.length === 0 ? (
                <Card className="max-w-3xl mx-auto shadow-xl">
                  <CardContent className="text-center py-20">
                    <TrendingUp className="h-20 w-20 mx-auto text-slate-400 mb-8" />
                    <h3 className="text-3xl font-bold mb-6 text-gray-900">No Risk Data Available</h3>
                    <p className="text-xl text-slate-600 leading-relaxed">
                      Make some predictions to see comprehensive risk pattern analysis and regional insights.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-10">
                  <div className="text-center mb-12">
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">Detailed Regional Analysis</h3>
                    <p className="text-lg text-gray-600">Explore each high-risk region with detailed metrics and recent activity patterns</p>
                  </div>
                  
                  <div className="grid gap-10">
                    {regions.map((region, index) => {
                      const riskLevel = getRiskLevel(region.riskScore);
                      return (
                        <Card key={`${region.latitude}-${region.longitude}`} className="overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border-0">
                          <CardHeader className="pb-6 bg-gradient-to-r from-slate-50 to-slate-100 border-b">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="flex items-center gap-6 mb-4">
                                  <span className="text-4xl font-bold text-slate-400 bg-white px-4 py-2 rounded-xl shadow-md">#{index + 1}</span>
                                  <div>
                                    <div className="flex items-center gap-3">
                                      <MapPin className="h-7 w-7 text-blue-600" />
                                      <span className="text-2xl font-bold text-gray-900">{region.latitude.toFixed(4)}, {region.longitude.toFixed(4)}</span>
                                    </div>
                                  </div>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-8 text-base">
                                  <span className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-600" />
                                    <span className="font-semibold">{region.predictionCount} total predictions</span>
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    <span className="font-semibold">Last: {new Date(region.lastPrediction).toLocaleDateString()}</span>
                                  </span>
                                </CardDescription>
                              </div>
                              <div className="text-right">
                                <Badge className={`${riskLevel.color} text-white mb-4 text-base px-4 py-2 font-bold`}>
                                  {riskLevel.label} Risk
                                </Badge>
                                <div className="text-4xl font-bold text-gray-900 mb-1">
                                  {(region.riskScore * 100).toFixed(1)}%
                                </div>
                                <div className="text-sm text-slate-500 font-semibold">Risk Score</div>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="space-y-8 p-8">
                            <div className="grid md:grid-cols-3 gap-8">
                              <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border-2 border-red-200 shadow-lg">
                                <div className="text-sm text-red-700 font-bold mb-2">Illegal Predictions</div>
                                <div className="text-3xl font-bold text-red-600">
                                  {region.illegalCount} / {region.predictionCount}
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                                <div className="text-sm text-blue-700 font-bold mb-2">Avg Probability</div>
                                <div className="text-3xl font-bold text-blue-600">
                                  {(region.avgProbability * 100).toFixed(1)}%
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-200 shadow-lg">
                                <div className="text-sm text-purple-700 font-bold mb-2">Peak Hours</div>
                                <div className="text-base font-bold text-purple-600">
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
                              <h4 className="font-bold mb-4 text-xl text-gray-900">Recent Predictions</h4>
                              <div className="space-y-4">
                                {region.recentPredictions.map((pred, i) => (
                                  <div key={i} className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 hover:from-slate-100 hover:to-slate-200 transition-all duration-200 shadow-md">
                                    <span className="font-semibold text-gray-800">
                                      Hour {pred.hour}:00 - {pred.model_type}
                                    </span>
                                    <div className="flex items-center gap-4">
                                      <Badge variant={pred.predicted_illegal ? "destructive" : "secondary"} className="text-sm font-bold px-3 py-1">
                                        {pred.predicted_illegal ? "Illegal" : "Legal"}
                                      </Badge>
                                      <span className="font-mono font-bold text-gray-700 text-lg">
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
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HighRiskRegionsPage;
