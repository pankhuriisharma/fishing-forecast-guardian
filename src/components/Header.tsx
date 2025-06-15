import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b">
      <div className="container py-4 px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="link" className="mr-4 text-2xl font-bold p-0 h-auto" onClick={() => navigate("/")}>
            FishGuard AI
          </Button>
        </div>
        
        <nav className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/articles")}
            className="gap-2"
          >
            Articles & Insights
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/smart-patrol")}
            className="gap-2"
          >
            Smart Patrol AI
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-sm">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Explore FishGuard AI
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <Button variant="ghost" className="justify-start" onClick={() => navigate("/")}>
                Home
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => navigate("/real-time-fishing")}>
                Real-Time Fishing
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => navigate("/high-risk-regions")}>
                High-Risk Regions
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => navigate("/historical-high-risk")}>
                Historical High-Risk
              </Button>
              <Button variant="ghost" className="justify-start" onClick={() => navigate("/articles")}>
                Articles & Insights
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => navigate("/smart-patrol")}
              >
                Smart Patrol AI
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
