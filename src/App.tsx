import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import HighRiskRegionsPage from "./pages/HighRiskRegionsPage";
import NotFound from "./pages/NotFound";
import RealTimeFishingPage from "./pages/RealTimeFishingPage";
import HistoricalHighRiskRegionsPage from "./pages/HistoricalHighRiskRegionsPage";
import { ThemeProvider } from "./components/ThemeProvider";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/real-time-fishing" element={<RealTimeFishingPage />} />
            <Route path="/high-risk-regions" element={<HighRiskRegionsPage />} />
            <Route path="/historical-high-risk" element={<HistoricalHighRiskRegionsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
