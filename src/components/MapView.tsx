import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FishingData, Prediction } from "@/types";
import { Map, Pin, LocateFixed, Search, AlertTriangle, Loader, Globe, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
// Import Leaflet and Leaflet heat types
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

interface MapViewProps {
  data: FishingData[] | null;
  prediction?: Prediction | null;
  onLocationSelect: (lat: number, lon: number) => void;
}

// Updated function to check if coordinates are over water (including seashores, coastal areas, and water bodies)
const isOceanLocation = (lat: number, lon: number): boolean => {
  // Major landmasses to exclude (simplified check for clearly inland areas)
  
  // Major inland areas of North America
  if (lat >= 25 && lat <= 70 && lon >= -130 && lon <= -60) {
    // Exclude central/inland North America, but allow coastal areas
    if (lat >= 30 && lat <= 65 && lon >= -120 && lon <= -75) {
      return false;
    }
  }
  
  // Major inland areas of South America
  if (lat >= -60 && lat <= 15 && lon >= -85 && lon <= -35) {
    // Exclude central/inland South America, but allow coastal areas
    if (lat >= -30 && lat <= 10 && lon >= -75 && lon <= -45) {
      return false;
    }
  }
  
  // Major inland areas of Europe and Western Asia
  if (lat >= 35 && lat <= 75 && lon >= -10 && lon <= 60) {
    // Exclude central/inland Europe and Western Asia, but allow coastal areas
    if (lat >= 40 && lat <= 70 && lon >= 5 && lon <= 50) {
      return false;
    }
  }
  
  // Major inland areas of Africa
  if (lat >= -35 && lat <= 40 && lon >= -20 && lon <= 55) {
    // Exclude central/inland Africa, but allow coastal areas
    if (lat >= -25 && lat <= 30 && lon >= -5 && lon <= 40) {
      return false;
    }
  }
  
  // Major inland areas of Asia
  if (lat >= 10 && lat <= 75 && lon >= 60 && lon <= 150) {
    // Exclude central/inland Asia, but allow coastal areas
    if (lat >= 20 && lat <= 65 && lon >= 75 && lon <= 135) {
      return false;
    }
  }
  
  // Major inland areas of Australia
  if (lat >= -45 && lat <= -10 && lon >= 110 && lon <= 160) {
    // Exclude central/inland Australia, but allow coastal areas
    if (lat >= -35 && lat <= -15 && lon >= 120 && lon <= 150) {
      return false;
    }
  }
  
  // Accept all other locations (includes oceans, seas, coastal areas, and water bodies)
  return true;
};

const MapView = ({ data, prediction, onLocationSelect }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const [searchLat, setSearchLat] = useState<string>("");
  const [searchLon, setSearchLon] = useState<string>("");
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mapView, setMapView] = useState<'heatmap' | 'markers'>('heatmap');
  
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;
    
    try {
      // Initialize the map with a more detailed basemap
      const map = L.map(mapContainerRef.current, {
        worldCopyJump: true,
        minZoom: 2
      }).setView([20, 0], 2);
      
      // Add multiple base layers for user to choose from
      const basemaps = {
        "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        "Satellite": L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        }),
        "Terrain": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
        })
      };
      
      basemaps["OpenStreetMap"].addTo(map);
      
      // Add layer control
      L.control.layers(basemaps, {}, {
        position: 'topright',
        collapsed: true
      }).addTo(map);
      
      // Add zoom control
      L.control.zoom({
        position: 'topright'
      }).addTo(map);
      
      // Add scale control
      L.control.scale({
        imperial: false,
        position: 'bottomright'
      }).addTo(map);
      
      // Store map in ref
      leafletMapRef.current = map;
      
      // Create markers layer
      markersLayerRef.current = L.layerGroup().addTo(map);
      
      // Set up click event with ocean validation
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        
        // Check if location is over ocean
        if (!isOceanLocation(lat, lng)) {
          toast.error("Invalid location selected", {
            description: "Please select a valid ocean location for fishing predictions"
          });
          return;
        }
        
        onLocationSelect(lat, lng);
        setSearchLat(lat.toFixed(6));
        setSearchLon(lng.toFixed(6));
        
        // Add a temporary marker at the clicked location
        if (markersLayerRef.current) {
          const clickMarker = L.circleMarker([lat, lng], {
            radius: 6,
            color: 'rgba(0, 0, 255, 0.7)',
            fillOpacity: 0.7
          }).addTo(markersLayerRef.current)
            .bindTooltip(`Selected Ocean Location<br>${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            
          // Remove the marker after a delay
          setTimeout(() => {
            if (markersLayerRef.current) {
              markersLayerRef.current.removeLayer(clickMarker);
            }
          }, 5000);
        }
        
        toast.success(`Ocean location selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
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
    
    // Handle null or empty data
    if (!data || data.length === 0) return;
    
    try {
      // Process data for heatmap - all points with intensity based on illegal status
      const heatData = data.map(point => {
        // Higher intensity for illegal points
        const intensity = point.illegal === 1 ? 1.0 : 0.3;
        return [point.lat, point.lon, intensity];
      });
      
      // Create and add heatmap layer if we have data and heatmap view is active
      if (heatData.length > 0 && L.heatLayer && mapView === 'heatmap') {
        heatLayerRef.current = L.heatLayer(heatData as [number, number, number][], {
          radius: 15,
          blur: 20,
          maxZoom: 10,
          // Use a more nuanced gradient
          gradient: {
            0.2: 'blue',
            0.4: 'cyan',
            0.6: 'lime',
            0.7: 'yellow',
            0.8: 'orange',
            1.0: 'red'
          }
        }).addTo(leafletMapRef.current);
      }
      
      // If in marker view or if heatmap fails, show markers instead
      if (mapView === 'markers' || !heatLayerRef.current) {
        // Add markers for all points
        data.forEach(point => {
          // Color based on illegal status
          const color = point.illegal === 1 ? 'rgba(255, 0, 0, 0.7)' : 'rgba(0, 128, 0, 0.7)';
          const status = point.illegal === 1 ? 'Illegal Activity' : 'Legal Activity';
          
          L.circleMarker([point.lat, point.lon], {
            radius: 4,
            color: color,
            fillOpacity: 0.7
          }).addTo(markersLayerRef.current!)
            .bindTooltip(`${status}<br>Hour: ${point.hour}:00`);
        });
      }
    } catch (error) {
      console.error("Error updating map data:", error);
      toast.error("Error displaying data on the map");
    }
    
  }, [data, mapLoaded, mapView]);
  
  // Update prediction marker
  useEffect(() => {
    if (!mapLoaded || !leafletMapRef.current || !markersLayerRef.current || !prediction) return;
    
    try {
      // Add prediction marker
      const [lat, lon] = prediction.location;
      
      // Define custom icon with pulse animation
      const pulseIcon = L.divIcon({
        className: 'prediction-marker',
        html: `<div class="relative w-6 h-6">
                <div class="absolute inset-0 bg-${prediction.result ? 'red' : 'green'}-500 rounded-full animate-ping opacity-30"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="h-4 w-4 rounded-full bg-${prediction.result ? 'red' : 'green'}-500"></div>
                </div>
              </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      
      const marker = L.marker([lat, lon], { icon: pulseIcon })
        .addTo(markersLayerRef.current)
        .bindTooltip(`
          <strong>${prediction.result ? 'High' : 'Low'} Risk</strong><br>
          Probability: ${(prediction.probability * 100).toFixed(1)}%<br>
          Hour: ${prediction.hour}:00<br>
          Location: ${lat.toFixed(6)}, ${lon.toFixed(6)}
        `);
      
      // Add a circle to indicate the area of prediction
      const radius = 25000 + (prediction.probability * 75000); // Radius in meters, larger for higher probabilities
      L.circle([lat, lon], {
        radius: radius,
        color: prediction.result ? 'red' : 'green',
        fillColor: prediction.result ? 'red' : 'green',
        fillOpacity: 0.1,
        weight: 1
      }).addTo(markersLayerRef.current);
      
      // Pan to the prediction location and zoom to appropriate level
      leafletMapRef.current.setView([lat, lon], 6);
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
    
    // Check if location is over ocean
    if (!isOceanLocation(lat, lon)) {
      toast.error("Invalid location selected", {
        description: "Please select a valid ocean location for fishing predictions"
      });
      return;
    }
    
    onLocationSelect(lat, lon);
    
    if (mapLoaded && leafletMapRef.current) {
      // Clear existing markers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }
      
      // Add a marker at the searched location
      if (markersLayerRef.current) {
        L.marker([lat, lon], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(markersLayerRef.current)
          .bindTooltip(`Searched Ocean Location<br>${lat.toFixed(6)}, ${lon.toFixed(6)}`);
      }
      
      leafletMapRef.current.setView([lat, lon], 6);
      toast.success(`Map centered at ocean location: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
    }
  };
  
  const toggleMapView = () => {
    const newView = mapView === 'heatmap' ? 'markers' : 'heatmap';
    setMapView(newView);
    toast.info(`Map view changed to ${newView}`);
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
      
      <div className="absolute top-2 right-2 z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 bg-background/80 backdrop-blur-sm" onClick={toggleMapView}>
                {mapView === 'heatmap' ? (
                  <>
                    <Globe className="w-4 h-4 mr-1" />
                    <span className="sr-md:not-sr-only">Show Markers</span>
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 mr-1" />
                    <span className="sr-md:not-sr-only">Show Heatmap</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle between heatmap and marker view</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
                          
                          // Check if current location is over ocean
                          if (!isOceanLocation(latitude, longitude)) {
                            toast.error("Current location is not over ocean", {
                              description: "Please manually select a valid ocean location for fishing predictions"
                            });
                            return;
                          }
                          
                          setSearchLat(latitude.toFixed(6));
                          setSearchLon(longitude.toFixed(6));
                          onLocationSelect(latitude, longitude);
                          if (mapLoaded && leafletMapRef.current) {
                            leafletMapRef.current.setView([latitude, longitude], 6);
                          }
                          toast.success(`Using your ocean location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
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
