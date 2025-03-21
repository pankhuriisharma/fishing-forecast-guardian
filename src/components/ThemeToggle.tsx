
import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 dark:text-slate-400" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="data-[state=checked]:bg-slate-700"
        aria-label="Toggle theme"
      />
      <Moon className="h-[1.2rem] w-[1.2rem] text-slate-700 dark:text-blue-400" />
    </div>
  );
}
