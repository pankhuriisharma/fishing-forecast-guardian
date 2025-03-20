
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="text-center max-w-md px-4 animate-fade-in">
        <div className="inline-flex items-center justify-center mb-6 p-3 bg-amber-100 rounded-full">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
        </div>
        <h1 className="text-6xl font-bold mb-4 text-slate-800">404</h1>
        <p className="text-xl text-slate-600 mb-8">Oops! The page you're looking for couldn't be found.</p>
        <Button 
          className="bg-ocean hover:bg-ocean-dark transition-colors"
          size="lg"
          onClick={() => window.location.href = '/'}
        >
          <Home className="h-5 w-5 mr-2" />
          Return to Home
        </Button>
        <p className="mt-6 text-sm text-slate-500">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
