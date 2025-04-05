
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { modelDefinitions } from "@/utils/fishingModels";
import { ModelType } from "@/types";
import { LucideIcon, TreeDeciduous, GitBranch, Network, Target, LineChart, Divide } from "lucide-react";

interface ModelSelectorProps {
  selectedModel: ModelType;
  onModelChange: (model: ModelType) => void;
  params: any;
  onParamsChange: (params: any) => void;
}

const ModelSelector = ({
  selectedModel,
  onModelChange,
  params,
  onParamsChange
}: ModelSelectorProps) => {
  
  const getModelIcon = (modelType: ModelType): LucideIcon => {
    switch (modelType) {
      case "Random Forest":
        return TreeDeciduous;
      case "Decision Tree":
        return GitBranch;
      case "Neural Network":
        return Network;
      case "KNN":
        return Target;
      case "Logistic Regression":
        return LineChart;
      case "SVM":
        return Divide;
      default:
        return TreeDeciduous;
    }
  };
  
  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium tracking-tight">Select Model</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Choose a machine learning algorithm to predict illegal fishing
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            ML Prediction
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedModel} className="w-full" onValueChange={(value) => onModelChange(value as ModelType)}>
          <TabsList className="grid w-full mb-2">
            <div className="flex gap-1 md:gap-2 overflow-x-auto pb-1 w-full">
              {Object.keys(modelDefinitions).map((model) => (
                <TabsTrigger 
                  key={model} 
                  value={model}
                  className="flex-shrink-0 whitespace-nowrap flex items-center gap-1 px-2 md:px-3 py-1.5 text-xs md:text-sm"
                >
                  {(() => {
                    const Icon = getModelIcon(model as ModelType);
                    return <Icon className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />;
                  })()}
                  <span className="hidden sm:inline">{model}</span>
                </TabsTrigger>
              ))}
            </div>
          </TabsList>
          
          {Object.entries(modelDefinitions).map(([model, definition]) => (
            <TabsContent key={model} value={model} className="mt-4 space-y-4">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-md ${definition.color} text-white`}>
                  {(() => {
                    const Icon = getModelIcon(model as ModelType);
                    return <Icon className="w-5 h-5" />;
                  })()}
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium leading-none">{definition.name}</h4>
                  <p className="text-sm text-muted-foreground">{definition.description}</p>
                  <p className="text-sm font-medium">Expected Accuracy: {definition.accuracy}</p>
                </div>
              </div>
              
              {/* Model specific parameters */}
              <div className="pt-2 border-t">
                {model === "Random Forest" && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Number of Trees</Label>
                      <span className="text-sm font-medium">{params.randomForest?.n_estimators || 100}</span>
                    </div>
                    <Slider
                      value={[params.randomForest?.n_estimators || 100]}
                      min={10}
                      max={500}
                      step={10}
                      onValueChange={(value) => 
                        onParamsChange({ ...params, randomForest: { n_estimators: value[0] } })
                      }
                    />
                  </div>
                )}
                
                {model === "SVM" && (
                  <div className="space-y-2">
                    <Label>Kernel Function</Label>
                    <Select
                      value={params.svm?.kernel || "rbf"}
                      onValueChange={(value) => 
                        onParamsChange({ ...params, svm: { kernel: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select kernel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="rbf">RBF</SelectItem>
                        <SelectItem value="poly">Polynomial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {model === "KNN" && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Number of Neighbors</Label>
                      <span className="text-sm font-medium">{params.knn?.neighbors || 5}</span>
                    </div>
                    <Slider
                      value={[params.knn?.neighbors || 5]}
                      min={1}
                      max={20}
                      step={1}
                      onValueChange={(value) => 
                        onParamsChange({ ...params, knn: { neighbors: value[0] } })
                      }
                    />
                  </div>
                )}
                
                {model === "Neural Network" && (
                  <div className="space-y-2">
                    <Label>Activation Function</Label>
                    <Select
                      value={params.neuralNetwork?.activation || "relu"}
                      onValueChange={(value) => 
                        onParamsChange({ ...params, neuralNetwork: { activation: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select activation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relu">ReLU</SelectItem>
                        <SelectItem value="tanh">Tanh</SelectItem>
                        <SelectItem value="logistic">Sigmoid</SelectItem>
                        <SelectItem value="identity">Identity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModelSelector;
