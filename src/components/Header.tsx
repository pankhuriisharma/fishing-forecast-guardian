
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { HelpCircle, Github, LifeBuoy, Ship } from "lucide-react";
import { toast } from "sonner";
import { HeaderThemeToggle } from "./HeaderThemeToggle";

const Header = () => {
  return (
    <header className="w-full backdrop-blur-md bg-white/90 dark:bg-gray-900/90 sticky top-0 z-50 shadow-sm border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-ocean-dark to-ocean-light opacity-75 blur-sm"></div>
            <div className="relative rounded-full p-1.5 bg-ocean text-white">
              <Ship className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">FishGuard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Illegal Fishing Detection System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <HeaderThemeToggle />
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-600 dark:text-slate-300 hover:text-primary hidden md:flex"
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
