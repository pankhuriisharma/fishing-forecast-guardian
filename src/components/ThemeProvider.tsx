
import { createContext, useContext, useEffect } from "react";

type Theme = "light";

type ThemeContextType = {
  theme: Theme;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme: Theme = "light";

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any theme classes
    root.classList.remove("dark");
    
    // Add the light theme class
    root.classList.add("light");
    
    // Clear theme from localStorage
    localStorage.removeItem("theme");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}
