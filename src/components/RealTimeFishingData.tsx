
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Globe, Waves, Clock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const RealTimeFishingData = () => {
  const [fishingData, setFishingData] = useState<FishingDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      console.log('Fetching real-time fishing data...');
      
      const { data, error } = await supabase.functions.invoke('fetch-fishing-data');
      
      if (error) {
        console.error('Error calling edge function:', error);
        throw error;
      }

      console.log('Received data:', data);
      
      if (data.success) {
        setFishingData(data.data);
      } else if (data.fallback_data) {
        setFishingData(data.fallback_data);
        console.log('Using fallback data:', data.fallback_data.message);
      }
      
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching real-time fishing data:', error);
      
      // Fallback data for demonstration
      setFishingData({
        timestamp: new Date().toISOString(),
        total_entries: 3,
        high_risk_areas: [
          {
            id: 1,
            latitude: -12.5,
            longitude: 115.3,
            fishing_hours: 48,
            vessel_count: 6,
            flag_state: 'Indonesia',
            risk_level: 'High',
            last_updated: new Date().toISOString()
          },
          {
            id: 2,
            latitude: 20.2,
            longitude: -15.8,
            fishing_hours: 65,
            vessel_count: 15,
            flag_state: 'Morocco',
            risk_level: 'Critical',
            last_updated: new Date().toISOString()
          },
          {
            id: 3,
            latitude: 35.1,
            longitude: 25.4,
            fishing_hours: 32,
            vessel_count: 4,
            flag_state: 'Greece',
            risk_level: 'Medium',
            last_updated: new Date().toISOString()
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
    // Refresh data every 5 minutes
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

  if (loading && !fishingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            Real-Time Fishing Activities
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Real-Time Fishing Activities
              </CardTitle>
              <CardDescription>
                Live data from Global Fishing Watch - High-risk areas for illegal fishing
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRealTimeData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fishingData?.message && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{fishingData.message}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">{fishingData?.total_entries || 0}</div>
              <div className="text-sm text-slate-600">Total Activity Reports</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{fishingData?.high_risk_areas?.length || 0}</div>
              <div className="text-sm text-slate-600">High-Risk Areas</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="text-sm font-medium flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                Last Updated
              </div>
              <div className="text-sm text-slate-600">{lastUpdated}</div>
            </div>
          </div>

          {fishingData?.high_risk_areas && fishingData.high_risk_areas.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                High-Risk Fishing Areas
              </h4>
              {fishingData.high_risk_areas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-mono text-slate-500">#{area.id}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {area.latitude.toFixed(3)}, {area.longitude.toFixed(3)}
                        </span>
                        <Badge variant="outline">{area.flag_state}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>{area.fishing_hours}h fishing</span>
                        <span>{area.vessel_count} vessels</span>
                        <span>Updated: {new Date(area.last_updated).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getRiskBadgeColor(area.risk_level)}>
                    {area.risk_level}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No high-risk fishing activities detected in the current monitoring period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeFishingData;
