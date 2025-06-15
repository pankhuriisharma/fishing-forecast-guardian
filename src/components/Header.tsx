
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Github, LifeBuoy, Ship, Waves, Database } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full backdrop-blur-md bg-white/90 sticky top-0 z-50 shadow-sm border-b border-slate-200">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-ocean-dark to-ocean-light opacity-75 blur-sm"></div>
            <div className="relative rounded-full p-1.5 bg-ocean text-white">
              <Ship className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">FishGuard</h1>
            <p className="text-xs text-slate-500">Illegal Fishing Detection System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="text-blue-700 border-blue-200 hover:bg-blue-50 font-semibold hidden md:flex"
            onClick={() => navigate("/real-time-fishing")}
          >
            <Waves className="h-4 w-4 mr-1" />
            Real-Time Fishing
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-purple-700 border-purple-200 hover:bg-purple-50 font-semibold hidden md:flex"
            onClick={() => navigate("/historical-high-risk")}
          >
            <Database className="h-4 w-4 mr-1" />
            Historical High Risk Regions
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-primary hidden md:flex"
              onClick={() => {
                toast.info("Help documentation would open here");
              }}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Help
            </Button>
            
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex"
                onClick={() => {
                  toast.info("Support would open here");
                }}
              >
                <LifeBuoy className="h-4 w-4 mr-1" />
                Support
              </Button>
              
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  window.open("https://github.com/", "_blank");
                }}
              >
                <Github className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">GitHub</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
