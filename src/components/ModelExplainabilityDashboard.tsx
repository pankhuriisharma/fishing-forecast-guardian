
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Sparkle, BarChart, ChartPie } from "lucide-react";
import { Prediction } from "@/types";

// Mock XAI data generator
function getExplanation(prediction?: Prediction) {
  // This can be replaced by backend explanation, here we fake values.
  if (!prediction) return [];
  // Example: Explain the top 3 features
  return [
    {
      feature: "Proximity to MPA",
      importance: 0.29,
      value: "2.5 km to zone",
      reason: "Very close to restricted area"
    },
    {
      feature: "Average Speed",
      importance: 0.18,
      value: "16 knots",
      reason: "Sudden drop near boundary"
    },
    {
      feature: "Hour of Day",
      importance: 0.14,
      value: prediction.hour + ":00",
      reason: "High risk time window"
    },
    {
      feature: "Direction Change",
      importance: 0.12,
      value: "Sharp turn ≈ 75°",
      reason: "Suspicious sharp maneuver"
    }
  ];
}

interface ModelExplainabilityDashboardProps {
  prediction: Prediction | null;
}

const ModelExplainabilityDashboard = ({ prediction }: ModelExplainabilityDashboardProps) => {
  if (!prediction) return null;
  const xai = getExplanation(prediction);
  return (
    <Card className="w-full bg-white/80 border shadow-md mt-4 animate-fade-in">
      <CardHeader className="pb-2 flex flex-row justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkle className="w-5 h-5 text-yellow-400" />
          Why did the model flag this?
        </CardTitle>
        <Badge variant="outline" className={`${prediction.result ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
          <ChartPie className="w-4 h-4 mr-1" />
          {prediction.result ? "High Risk" : "Low Risk"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {xai.map((item, i) => (
            <div key={item.feature} className="flex items-center gap-3 bg-slate-50/80 rounded-md px-3 py-2">
              <BarChart className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium">{item.feature}:</span>{" "}
                <span className="text-sm text-slate-700">{item.value}</span>
                <div className="text-xs text-slate-500">{item.reason}</div>
              </div>
              <Progress className="h-2 w-20" value={item.importance * 100} />
              <span className="text-xs font-mono text-slate-600 ml-2">{Math.round(item.importance * 100)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelExplainabilityDashboard;
