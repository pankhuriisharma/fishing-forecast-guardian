import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FishingData, ModelType, TrainedModel, Prediction } from "@/types";
import { trainModel, modelDefinitions, uploadDataset } from "@/utils/fishingModels";
import { prepareTrainingData, splitData, generateMockData } from "@/utils/dataProcessor";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DataUploader from "@/components/DataUploader";
import ModelSelector from "@/components/ModelSelector";
import MapView from "@/components/MapView";
import PredictionForm from "@/components/PredictionForm";
import ModelResults from "@/components/ModelResults";
import ResultCharts from "@/components/ResultCharts";
import GithubIcon from "@/components/GithubIcon";
import { toast } from "sonner";
import { Database, Brain, ChevronDown, Ship, UploadCloud, Beaker, Map } from "lucide-react";
import HighRiskRegions from "@/components/HighRiskRegions";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://igxauoyjttwtyujsoxjt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlneGF1b3lqdHR3dHl1anNveGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMDQ4ODUsImV4cCI6MjA2NDg4MDg4NX0.2yHE-O-HJtS8DLcfF52IFT9YHhSejGRtmjfi4V7Uw9g";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Index = () => {
  const [fishingData, setFishingData] = useState<FishingData[]>([]);
  const [activeTab, setActiveTab] = useState("data");
  const [selectedModel, setSelectedModel] = useState<ModelType>("Random Forest");
  const [modelParams, setModelParams] = useState({
    randomForest: { n_estimators: 100 },
    svm: { kernel: "rbf" as const },
    knn: { neighbors: 5 },
    neuralNetwork: { activation: "relu" as const }
  });
  const [trainedModel, setTrainedModel] = useState<TrainedModel | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
  const handleDataLoaded = (data: FishingData[]) => {
    setFishingData(data);
    setTrainedModel(null); // Reset trained model when new data is loaded
    setPrediction(null); // Reset prediction
    setActiveTab("model"); // Move to model tab after data is loaded
    
    toast.success(`Successfully loaded ${data.length} data points`, {
      description: "You can now train a model and make predictions"
    });
  };
  
  const handleLocationSelect = (lat: number, lon: number) => {
    setSelectedLocation([lat, lon]);
  };
  
  const handleTrainModel = async () => {
    if (fishingData.length === 0) {
      toast.error("No data available for training");
      return;
    }
    
    setIsTraining(true);
    setTrainedModel(null); // Reset previous model
    
    try {
      // Split data into training and testing sets
      const { train, test } = splitData(fishingData);
      
      // Prepare data for training
      const trainData = prepareTrainingData(train);
      const testData = prepareTrainingData(test);
      
      // Upload dataset and train model
      const file = new File([JSON.stringify(trainData)], 'training_data.json', { type: 'application/json' });
      const uploadResult = await uploadDataset(file);
      
      // Train model using the backend
      const result = await trainModel(selectedModel, uploadResult.dataset_id, modelParams);
      
      const newTrainedModel: TrainedModel = {
        type: selectedModel,
        accuracy: result.accuracy,
        confusionMatrix: result.confusionMatrix,
        params: modelParams
      };
      
      setTrainedModel(newTrainedModel);
      setActiveTab("predict"); // Move to predict tab after model is trained
      
      toast.success("Model training completed", {
        description: `${selectedModel} model trained with ${(result.accuracy * 100).toFixed(1)}% accuracy`
      });
    } catch (error) {
      console.error('Training error:', error);
      toast.error(`Model training failed: ${(error as Error).message}`);
    } finally {
      setIsTraining(false);
    }
  };
  
  const handlePredict = (newPrediction: Prediction) => {
    setPrediction(newPrediction);
    
    // Show toast notification based on prediction result
    if (newPrediction.result) {
      toast.warning("High risk of illegal fishing detected", {
        description: `${(newPrediction.probability * 100).toFixed(1)}% probability at the selected location`
      });
    } else {
      toast.success("Low risk of illegal fishing predicted", {
        description: `${(newPrediction.probability * 100).toFixed(1)}% probability at the selected location`
      });
    }
  };
  
  const handleSendEmailAlert = async () => {
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-illegal-fishing-alerts');
      if (error || !data) {
        toast.error("Failed to send email alert", { description: error?.message || "API failure." });
      } else if (data?.message) {
        toast.success("Email notification sent!", { description: data.message });
      } else {
        toast("Request complete", { description: "The edge function ran but didn't return a standard response." });
      }
    } catch (err: any) {
      toast.error("Failed to send email alert", { description: err.message });
    }
    setSendingEmail(false);
  };
  
  useEffect(() => {
    const demoData = generateMockData(100);
    setFishingData(demoData);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center mb-2">
            <span className="bg-ocean text-white text-xs font-medium px-2.5 py-0.5 rounded-full">AI-POWERED</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight text-slate-900 animate-fade-in">
            Illegal Fishing Detection & Prediction
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto animate-slide-up">
            Using advanced machine learning to protect marine ecosystems and sustainably manage fisheries
          </p>
          
          <div className="mt-6 inline-flex flex-col sm:flex-row items-center gap-3 animate-slide-up">
            <Button 
              size="lg" 
              className="w-full sm:w-auto gap-2 bg-ocean hover:bg-ocean-dark"
              onClick={() => setActiveTab("data")}
            >
              <UploadCloud className="h-5 w-5" />
              Upload Your Data
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full sm:w-auto gap-2"
              onClick={() => window.open("https://github.com/", "_blank")}
            >
              <GithubIcon className="h-5 w-5" />
              View on GitHub
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={handleSendEmailAlert}
              disabled={sendingEmail}
            >
              <span className="flex items-center gap-1">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block mr-1" viewBox="0 0 24 24"><path d="M4 4h16v16H4V4z" stroke="none"/><path d="M22 6v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6m16 0L12 13 4 6" /></svg>
                {sendingEmail ? "Sending..." : "Get Email Update"}
              </span>
            </Button>
          </div>
        </div>
        
        <div className="w-full max-w-6xl mx-auto">
          <Tabs 
            defaultValue="data" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex justify-center mb-6">
              <TabsList className="grid grid-cols-4 w-full max-w-lg">
                <TabsTrigger value="data" className="flex items-center gap-1">
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">Data</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="model" 
                  className="flex items-center gap-1"
                  disabled={fishingData.length === 0}
                >
                  <Brain className="w-4 h-4" />
                  <span className="hidden sm:inline">Model</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="predict" 
                  className="flex items-center gap-1"
                  disabled={!trainedModel}
                >
                  <Beaker className="w-4 h-4" />
                  <span className="hidden sm:inline">Predict</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="results" 
                  className="flex items-center gap-1"
                  disabled={fishingData.length === 0}
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Results</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="data" className="p-0 mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <DataUploader onDataLoaded={handleDataLoaded} />
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-md p-5 animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-md bg-ocean text-white">
                        <Ship className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">About FishGuard</h3>
                        <p className="text-sm text-slate-600 mb-3">
                          FishGuard is an AI-powered platform that leverages machine learning to detect and predict illegal fishing activities.
                          By analyzing vessel patterns, location data, and time-based information, our system helps authorities identify 
                          high-risk areas and optimize patrol resources.
                        </p>
                        <div className="text-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-slate-700">Upload vessel tracking data for analysis</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-slate-700">Train ML models to identify suspicious patterns</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-slate-700">Visualize hotspots and temporal patterns</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-slate-700">Make predictions to optimize patrol resources</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <ResultCharts data={fishingData} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="model" className="p-0 mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                    params={modelParams}
                    onParamsChange={setModelParams}
                  />
                  
                  <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 shadow-md p-5 animate-fade-in">
                    <h3 className="text-lg font-semibold mb-3">Training Configuration</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Configured to train a {selectedModel} model on {fishingData.length} data points.
                      The data will be automatically split into training (80%) and validation (20%) sets.
                    </p>
                    
                    {selectedModel === "Random Forest" && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-md text-sm">
                        <div className="font-medium mb-1">Random Forest Configuration</div>
                        <div className="text-slate-600 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Number of estimators:</span>
                            <span className="font-mono">{modelParams.randomForest.n_estimators}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max features:</span>
                            <span className="font-mono">auto</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bootstrap:</span>
                            <span className="font-mono">true</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedModel === "Neural Network" && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-md text-sm">
                        <div className="font-medium mb-1">Neural Network Configuration</div>
                        <div className="text-slate-600 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Hidden layers:</span>
                            <span className="font-mono">[100]</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Activation:</span>
                            <span className="font-mono">{modelParams.neuralNetwork.activation}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max iterations:</span>
                            <span className="font-mono">500</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full" 
                      onClick={handleTrainModel}
                      disabled={isTraining || fishingData.length === 0}
                    >
                      {isTraining ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Training Model...
                        </>
                      ) : (
                        <>
                          Train {selectedModel} Model
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <ModelResults trainedModel={trainedModel} prediction={prediction} />
                  {trainedModel && <HighRiskRegions />}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="predict" className="p-0 mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <MapView 
                    data={fishingData} 
                    prediction={prediction}
                    onLocationSelect={handleLocationSelect}
                  />
                </div>
                <div className="space-y-6">
                  <PredictionForm
                    trainedModel={trainedModel}
                    location={selectedLocation}
                    onPredict={handlePredict}
                  />
                  <ModelResults trainedModel={trainedModel} prediction={prediction} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="p-0 mt-0">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <MapView 
                    data={fishingData} 
                    prediction={prediction}
                    onLocationSelect={handleLocationSelect}
                  />
                  <HighRiskRegions />
                </div>
                <div className="space-y-6">
                  <ResultCharts data={fishingData} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
