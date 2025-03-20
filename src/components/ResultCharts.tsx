
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FishingData } from "@/types";
import { calculateHourlyActivity, calculateActivityDistribution } from "@/utils/dataProcessor";
import { PieChart, LineChart, BarChart3 } from "lucide-react";
import { PieChart as RechartsPageChart, Pie, Cell, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface ResultChartsProps {
  data: FishingData[];
}

const ResultCharts = ({ data }: ResultChartsProps) => {
  const [activeTab, setActiveTab] = useState("hourly");
  
  if (data.length === 0) {
    return (
      <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-medium tracking-tight">Analysis & Insights</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Upload data to see charts and analytics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <div className="text-center text-slate-400">
            <BarChart3 className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm">No data available for visualization</p>
            <p className="text-xs mt-1">Upload data files to generate insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const hourlyData = calculateHourlyActivity(data);
  const activityData = calculateActivityDistribution(data);
  
  // Transform distribution data for pie chart
  const pieData = [
    { name: "Legal Activity", value: activityData[0].Count },
    { name: "Illegal Activity", value: activityData[1].Count }
  ];
  
  const COLORS = ["#0088FE", "#FF8042"];
  
  // Calculate peak hours (top 3)
  const peakHours = [...hourlyData]
    .sort((a, b) => b.illegal - a.illegal)
    .slice(0, 3)
    .map(item => item.hour);
  
  // Calculate safe hours (bottom 3)
  const safeHours = [...hourlyData]
    .sort((a, b) => a.illegal - b.illegal)
    .slice(0, 3)
    .map(item => item.hour);
  
  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium tracking-tight">Analysis & Insights</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Visualizations and patterns in fishing data
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            <BarChart3 className="w-3 h-3 mr-1" />
            Analytics
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hourly" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="hourly" className="flex items-center gap-1">
              <LineChart className="w-4 h-4" />
              <span className="hidden sm:inline">Hourly Trends</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-1">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Distribution</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Key Insights</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="hourly" className="p-0">
            <div className="chart-container p-2 bg-white rounded-md shadow-sm">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={hourlyData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="hour" 
                      label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis
                      label={{ value: 'Illegal Activity (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Illegal Activity']}
                      labelFormatter={(hour) => `Hour: ${hour}:00`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="illegal" 
                      stroke="#005F73" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm">
                <div className="font-medium mb-2">Hourly Pattern Analysis</div>
                <p className="text-slate-700 text-xs">
                  The chart shows the percentage of illegal fishing activity by hour of the day. 
                  Higher peaks indicate times when illegal activity is more likely to occur.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-red-50 rounded-md border border-red-100">
                    <div className="text-xs font-medium text-red-800 mb-1">Peak Risk Hours</div>
                    <div className="flex flex-wrap gap-1">
                      {peakHours.map(hour => (
                        <Badge key={hour} variant="outline" className="bg-red-100 text-red-800">
                          {hour}:00
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-2 bg-green-50 rounded-md border border-green-100">
                    <div className="text-xs font-medium text-green-800 mb-1">Safest Hours</div>
                    <div className="flex flex-wrap gap-1">
                      {safeHours.map(hour => (
                        <Badge key={hour} variant="outline" className="bg-green-100 text-green-800">
                          {hour}:00
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="distribution" className="p-0">
            <div className="chart-container p-2 bg-white rounded-md shadow-sm">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPageChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Count']} />
                  </RechartsPageChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm">
                <div className="font-medium mb-2">Activity Distribution</div>
                <p className="text-slate-700 text-xs">
                  This chart shows the distribution between legal and illegal fishing activities in the dataset.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="flex items-center p-2 bg-blue-50 rounded-md border border-blue-100">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    <div>
                      <div className="text-xs font-medium text-blue-800">Legal</div>
                      <div className="text-xs text-blue-600">{pieData[0].value} vessels</div>
                    </div>
                  </div>
                  <div className="flex items-center p-2 bg-orange-50 rounded-md border border-orange-100">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <div>
                      <div className="text-xs font-medium text-orange-800">Illegal</div>
                      <div className="text-xs text-orange-600">{pieData[1].value} vessels</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="p-0">
            <div className="p-3 bg-white rounded-md shadow-sm">
              <div className="grid gap-3 mb-4">
                <div className="bg-primary-foreground border border-primary/20 rounded-md p-3">
                  <div className="text-sm font-medium text-primary mb-1">Key Patterns</div>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span>Illegal fishing activity peaks during {peakHours.map(h => `${h}:00`).join(', ')} hours.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span>Approximately {(pieData[1].value / (pieData[0].value + pieData[1].value) * 100).toFixed(1)}% of detected fishing activity is potentially illegal.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2"></div>
                      <span>Nighttime hours generally show higher rates of suspicious activity compared to daylight hours.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="text-sm font-medium text-slate-700 mb-1">Recommendations</div>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                      <span>Focus patrol resources during peak hours of {peakHours.map(h => `${h}:00`).join(', ')} for maximum effectiveness.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                      <span>Consider establishing regular patrol routes in areas with repeated illegal activity.</span>
                    </li>
                    <li className="flex items-start">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 mr-2"></div>
                      <span>Deploy automated monitoring systems to enhance surveillance during nighttime hours.</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <div className="text-sm font-medium text-amber-800 mb-1">Prediction Confidence</div>
                  <p className="text-xs text-amber-700">
                    This analysis is based on {data.length} data points. The model accuracy improves with more data.
                    Consider collecting additional data for more precise predictions.
                  </p>
                  <div className="mt-2 w-full bg-amber-200 rounded-full h-1.5">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, data.length / 10)}%` }} 
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-amber-700">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
              
              <div className="h-40 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyData.filter((_, idx) => idx % 2 === 0)} // Use every other hour for cleaner display
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Activity']}
                      labelFormatter={(hour) => `Hour: ${hour}:00`}
                    />
                    <Bar dataKey="illegal" fill="#005F73" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ResultCharts;
