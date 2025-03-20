
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FishingData, Prediction } from "@/types";
import { Map, Pin, LocateFixed, Search, AlertTriangle, Loader } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
// Import Leaflet and Leaflet heat types
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

interface MapViewProps {
  data: FishingData[];
  prediction?: Prediction | null;
  onLocationSelect: (lat: number, lon: number) => void;
}

const MapView = ({ data, prediction, onLocationSelect }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const [searchLat, setSearchLat] = useState<string>("");
  const [searchLon, setSearchLon] = useState<string>("");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Leaflet imports are already handled at the top of the file
    if (!mapContainerRef.current || leafletMapRef.current) return;
    
    try {
      // Initialize the map
      const map = L.map(mapContainerRef.current).setView([20, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      // Add zoom control
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
      
      // Store map in ref
      leafletMapRef.current = map;
      
      // Create markers layer
      markersLayerRef.current = L.layerGroup().addTo(map);
      
      // Set up click event
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
        setSearchLat(lat.toFixed(6));
        setSearchLon(lng.toFixed(6));
        toast.info(`Location selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      });
      
      setMapLoaded(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing map:", error);
      toast.error("Failed to load map. Please refresh the page.");
      setIsLoading(false);
    }
    
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [onLocationSelect]);
  
  // Update map when data changes
  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !markersLayerRef.current) return;
    
    // Clear existing layers
    markersLayerRef.current.clearLayers();
    if (heatLayerRef.current) {
      leafletMapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    
    if (data.length === 0) return;
    
    try {
      // Process data for heatmap - illegal points only
      const heatData = data
        .filter(point => point.illegal === 1)
        .map(point => [point.lat, point.lon, 1]); // lat, lon, intensity
      
      // Create and add heatmap layer if we have data
      if (heatData.length > 0 && L.heatLayer) {
        heatLayerRef.current = L.heatLayer(heatData as [number, number, number][], {
          radius: 15,
          blur: 20,
          maxZoom: 10,
          gradient: {0.4: 'blue', 0.6: 'green', 0.7: 'yellow', 0.8: 'orange', 1.0: 'red'}
        }).addTo(leafletMapRef.current);
      }
      
      // Add some illegal points as markers for visibility (not all to avoid overcrowding)
      const illegalSample = data
        .filter(point => point.illegal === 1)
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, 15); // Take a small sample
      
      illegalSample.forEach(point => {
        L.circleMarker([point.lat, point.lon], {
          radius: 4,
          color: 'rgba(255, 0, 0, 0.7)',
          fillOpacity: 0.7
        }).addTo(markersLayerRef.current!)
        .bindTooltip(`Illegal Activity<br>Hour: ${point.hour}:00`);
      });
    } catch (error) {
      console.error("Error updating map data:", error);
      toast.error("Error displaying data on the map");
    }
    
  }, [data, mapLoaded]);
  
  // Update prediction marker
  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !markersLayerRef.current || !prediction) return;
    
    try {
      // Add prediction marker
      const [lat, lon] = prediction.location;
      
      // Define custom icon
      const icon = L.divIcon({
        className: 'prediction-marker',
        html: `<div class="relative">
                <div class="absolute inset-0 bg-${prediction.result ? 'red' : 'green'}-500 rounded-full animate-pulse opacity-25"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="h-4 w-4 rounded-full bg-${prediction.result ? 'red' : 'green'}-500"></div>
                </div>
              </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const marker = L.marker([lat, lon], { icon })
        .addTo(markersLayerRef.current)
        .bindTooltip(`
          <strong>${prediction.result ? 'High' : 'Low'} Risk</strong><br>
          Probability: ${(prediction.probability * 100).toFixed(1)}%<br>
          Hour: ${prediction.hour}:00
        `);
      
      // Pan to the prediction location
      leafletMapRef.current.panTo([lat, lon]);
    } catch (error) {
      console.error("Error updating prediction marker:", error);
    }
    
  }, [prediction, mapLoaded]);
  
  const handleSearch = () => {
    const lat = parseFloat(searchLat);
    const lon = parseFloat(searchLon);
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error("Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180.");
      return;
    }
    
    onLocationSelect(lat, lon);
    
    if (mapLoaded && leafletMapRef.current) {
      leafletMapRef.current.setView([lat, lon], 6);
      toast.info(`Map centered at ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  };
  
  return (
    <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 shadow-md h-[400px] md:h-[600px] animate-fade-in">
      <div className="absolute top-2 left-2 z-10 flex flex-col md:flex-row gap-2">
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          <Map className="w-3 h-3 mr-1" />
          Illegal Fishing Map
        </Badge>
        
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
          High Risk
        </Badge>
        
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500" />
          Medium Risk
        </Badge>
        
        <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
          <AlertTriangle className="w-3 h-3 mr-1 text-green-500" />
          Low Risk
        </Badge>
      </div>
      
      <div className="absolute bottom-3 left-2 right-2 z-10">
        <div className="flex flex-col md:flex-row gap-2 items-center bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200">
          <div className="grid grid-cols-2 md:flex-1 gap-2">
            <div className="space-y-1">
              <Label htmlFor="latitude" className="text-xs">Latitude</Label>
              <Input
                id="latitude"
                type="text"
                placeholder="-90 to 90"
                value={searchLat}
                onChange={(e) => setSearchLat(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitude" className="text-xs">Longitude</Label>
              <Input
                id="longitude"
                type="text"
                placeholder="-180 to 180"
                value={searchLon}
                onChange={(e) => setSearchLon(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 flex-1" onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-1" />
                    <span className="sr-md:not-sr-only">Search</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search for coordinates</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 flex-1" onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          const { latitude, longitude } = position.coords;
                          setSearchLat(latitude.toFixed(6));
                          setSearchLon(longitude.toFixed(6));
                          onLocationSelect(latitude, longitude);
                          if (mapLoaded && leafletMapRef.current) {
                            leafletMapRef.current.setView([latitude, longitude], 6);
                          }
                          toast.info(`Using your location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                        },
                        () => {
                          toast.error("Could not get your location. Please enable location services.");
                        }
                      );
                    } else {
                      toast.error("Geolocation is not supported by your browser");
                    }
                  }}>
                    <LocateFixed className="w-4 h-4 mr-1" />
                    <span className="sr-md:not-sr-only">My Location</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use your current location</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading map...</p>
          </div>
        </div>
      )}
      
      <div ref={mapContainerRef} className="w-full h-full" />
    </Card>
  );
};

export default MapView;
