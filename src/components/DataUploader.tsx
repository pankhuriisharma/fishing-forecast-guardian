
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FishingData } from "@/types";
import { processCSVFile, generateMockData } from "@/utils/dataProcessor";
import { UploadCloud, Database, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DataUploaderProps {
  onDataLoaded: (data: FishingData[]) => void;
}

const DataUploader = ({ onDataLoaded }: DataUploaderProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    const fileNames: string[] = [];
    const allData: FishingData[] = [];
    let processedCount = 0;
    
    Array.from(files).forEach((file) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error(`File ${file.name} is not a CSV file.`);
        return;
      }
      
      fileNames.push(file.name);
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = processCSVFile(content);
          
          if (data.length === 0) {
            toast.error(`No valid data found in ${file.name}`);
          } else {
            allData.push(...data);
            toast.success(`Successfully processed ${data.length} records from ${file.name}`);
          }
        } catch (error) {
          toast.error(`Error processing ${file.name}: ${(error as Error).message}`);
        }
        
        processedCount++;
        setProgress((processedCount / files.length) * 100);
        
        if (processedCount === files.length) {
          setIsProcessing(false);
          setUploadedFiles(fileNames);
          
          if (allData.length > 0) {
            onDataLoaded(allData);
            toast.success(`Loaded ${allData.length} total data points`);
          } else {
            toast.error("No valid data points found in any files");
          }
        }
      };
      
      reader.onerror = () => {
        toast.error(`Failed to read file: ${file.name}`);
        processedCount++;
        setProgress((processedCount / files.length) * 100);
        
        if (processedCount === files.length) {
          setIsProcessing(false);
        }
      };
      
      reader.readAsText(file);
    });
  };
  
  const handleUseDemoData = () => {
    setIsProcessing(true);
    setProgress(25);
    
    // Simulate processing delay
    setTimeout(() => {
      setProgress(50);
      
      setTimeout(() => {
        setProgress(75);
        
        setTimeout(() => {
          const demoData = generateMockData(500);
          onDataLoaded(demoData);
          setUploadedFiles(["demo_data.csv"]);
          setIsProcessing(false);
          setProgress(100);
          toast.success(`Loaded 500 mock data points for demonstration`);
        }, 400);
      }, 300);
    }, 300);
  };
  
  return (
    <Card className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium tracking-tight">Data Uploader</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Upload CSV files containing fishing vessel data
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            <Database className="w-3 h-3 mr-1" />
            Data Input
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <label
            htmlFor="file-upload"
            className={`relative cursor-pointer rounded-md border-2 border-dashed border-slate-300 bg-slate-50/50 px-6 py-8 text-center transition-colors hover:bg-slate-100/50 ${
              isProcessing ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
              <div className="text-sm">
                <span className="font-medium text-primary">Click to upload</span> or drag and drop
              </div>
              <p className="mt-1 text-xs text-slate-500">CSV files only (max 10MB)</p>
            </div>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".csv"
              multiple
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </label>
          
          {uploadedFiles.length > 0 && (
            <div className="bg-slate-50/50 rounded-md p-2">
              <div className="text-xs font-medium text-slate-500 mb-1">Uploaded Files:</div>
              <div className="max-h-20 overflow-y-auto">
                {uploadedFiles.map((fileName, index) => (
                  <div key={index} className="flex items-center text-xs py-1">
                    <FileSpreadsheet className="h-3 w-3 text-slate-400 mr-1" />
                    <span className="text-slate-600 truncate">{fileName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
              <span className="text-xs text-slate-500">No data? Use our demo dataset</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseDemoData}
              disabled={isProcessing}
            >
              <Database className="h-4 w-4 mr-2" />
              Use Demo Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataUploader;
