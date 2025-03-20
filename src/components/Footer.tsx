
import { Separator } from "@/components/ui/separator";
import { Heart, Ship, GithubIcon, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200 py-6 bg-white/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Ship className="h-5 w-5 text-ocean" />
              <h3 className="text-lg font-semibold text-slate-800">FishGuard</h3>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Advanced illegal fishing detection and prediction system
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex items-center gap-4">
              <a href="#" className="text-slate-400 hover:text-ocean transition-colors" aria-label="GitHub">
                <GithubIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-ocean transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-ocean transition-colors" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center">
              Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> for ocean conservation
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="text-xs text-center text-slate-400">
          <p>© {new Date().getFullYear()} FishGuard. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="hover:text-ocean transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-ocean transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-ocean transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
