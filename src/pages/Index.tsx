
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DataUploader from "@/components/DataUploader";
import ModelTrainer from "@/components/ModelTrainer";
import ModelSelector from "@/components/ModelSelector";
import PredictionForm from "@/components/PredictionForm";
import ModelResults from "@/components/ModelResults";
import MapView from "@/components/MapView";
import ResultCharts from "@/components/ResultCharts";
import { FishingData, TrainedModel, Prediction, ModelType } from "@/types";

const Index = () => {
  const [data, setData] = useState<FishingData[] | null>(null);
  const [trainedModel, setTrainedModel] = useState<TrainedModel | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>("Random Forest");
  const [params, setParams] = useState<any>({});
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);

  const handleLocationSelect = (lat: number, lon: number) => {
    setSelectedLocation([lat, lon]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <DataUploader onDataLoaded={setData} />
            <ModelTrainer data={data} onModelTrained={setTrainedModel} />
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              params={params}
              onParamsChange={setParams}
            />
            <PredictionForm
              trainedModel={trainedModel}
              location={selectedLocation}
              onPredict={setPrediction}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <MapView
              data={data}
              prediction={prediction}
              onLocationSelect={handleLocationSelect}
            />
            <ModelResults
              trainedModel={trainedModel}
              prediction={prediction}
            />
            <ResultCharts
              data={data || []}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
