
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Globe, Waves, Clock, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface RealTimeFishingActivity {
  id: number;
  latitude: number;
  longitude: number;
  fishing_hours: number;
  vessel_count: number;
  flag_state: string;
  risk_level: string;
  last_updated: string;
}

interface FishingDataResponse {
  timestamp: string;
  total_entries: number;
  high_risk_areas: RealTimeFishingActivity[];
  message?: string;
}

const RealTimeFishingPage = () => {
  const [fishingData, setFishingData] = useState<FishingDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const navigate = useNavigate();

  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('fetch-fishing-data');
      if (error) throw error;
      if (data.success) {
        setFishingData(data.data);
      } else if (data.fallback_data) {
        setFishingData(data.fallback_data);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      // fallback demo data
      setFishingData({
        timestamp: new Date().toISOString(),
        total_entries: 8,
        high_risk_areas: [
          {
            id: 1, latitude: -10.5, longitude: 105.3, fishing_hours: 45, vessel_count: 8,
            flag_state: 'Indonesia', risk_level: 'High', last_updated: new Date().toISOString()
          },
          {
            id: 2, latitude: 15.2, longitude: -23.8, fishing_hours: 62, vessel_count: 12,
            flag_state: 'Spain', risk_level: 'Critical', last_updated: new Date().toISOString()
          },
          {
            id: 3, latitude: -5.8, longitude: 34.2, fishing_hours: 28, vessel_count: 5,
            flag_state: 'Kenya', risk_level: 'Medium', last_updated: new Date().toISOString()
          },
          {
            id: 4, latitude: 42.1, longitude: -8.5, fishing_hours: 38, vessel_count: 7,
            flag_state: 'Portugal', risk_level: 'High', last_updated: new Date().toISOString()
          }
        ],
        message: 'Demo data - Connect to Global Fishing Watch for real data'
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      <main className="flex-1 flex flex-col items-center px-2 py-8">
        <div className="w-full max-w-3xl mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-3"
          >
            ← Back to Dashboard
          </Button>
        </div>

        <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-md border border-slate-200">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                  <Globe className="h-7 w-7 text-blue-500" />
                  Real-Time Fishing Activities
                </h2>
                <p className="text-slate-600 text-sm">
                  Live data from Global Fishing Watch - High-risk areas for illegal fishing
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRealTimeData}
                disabled={loading}
                className="flex items-center gap-1"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center">
              <div className="text-3xl font-bold text-blue-700">{fishingData?.total_entries ?? 0}</div>
              <div className="text-sm mt-1 text-slate-600 text-center">Total Activity Reports</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center">
              <div className="text-3xl font-bold text-red-600">{fishingData?.high_risk_areas?.length ?? 0}</div>
              <div className="text-sm mt-1 text-slate-600 text-center">High-Risk Areas</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 flex flex-col items-center">
              <div className="text-xs font-medium flex items-center gap-1 text-slate-500">
                <Clock className="h-4 w-4" />
                Last Updated
              </div>
              <div className="text-base text-slate-700">{lastUpdated}</div>
            </div>
          </div>

          {fishingData?.message && (
            <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{fishingData.message}</p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-md font-semibold flex items-center gap-2 mb-3 text-slate-900">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              High-Risk Fishing Areas
            </h3>
            {loading && !fishingData ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {fishingData?.high_risk_areas && fishingData.high_risk_areas.length > 0 ? (
                  fishingData.high_risk_areas.map((area, i) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-md font-mono text-slate-500">#{i + 1}</div>
                        <div>
                          <div className="flex items-center gap-2 text-lg font-bold text-slate-800">
                            {area.latitude.toFixed(3)}, {area.longitude.toFixed(3)}
                            <Badge variant="outline">{area.flag_state}</Badge>
                          </div>
                          <div className="flex gap-5 text-xs text-slate-600 mt-1">
                            <span>{area.fishing_hours}h fishing</span>
                            <span>{area.vessel_count} vessels</span>
                            <span>
                              Updated:&nbsp;
                              {new Date(area.last_updated).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={getRiskBadgeColor(area.risk_level)}>{area.risk_level}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No high-risk fishing activities detected in the current monitoring period.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RealTimeFishingPage;
