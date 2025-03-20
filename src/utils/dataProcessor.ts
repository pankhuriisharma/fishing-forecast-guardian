import { DataPoint, FishingData, ChartData, ActivityCount } from "../types";
import { v4 as uuidv4 } from "uuid";

export const processCSVFile = (fileContent: string): FishingData[] => {
  const rows = fileContent.split("\n");
  const headers = rows[0].toLowerCase().split(",");
  
  // Find indexes of required columns
  const latIndex = headers.findIndex(h => h.includes("lat"));
  const lonIndex = headers.findIndex(h => h.includes("lon") || h.includes("lng"));
  const timeIndex = headers.findIndex(h => h.includes("time") || h.includes("date"));
  
  if (latIndex === -1 || lonIndex === -1) {
    throw new Error("CSV file must contain latitude and longitude columns");
  }

  const data: FishingData[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue;
    
    const values = rows[i].split(",");
    const lat = parseFloat(values[latIndex]);
    const lon = parseFloat(values[lonIndex]);
    
    // Skip invalid coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      continue;
    }
    
    let hour = 12; // Default hour
    
    if (timeIndex !== -1) {
      try {
        const timeStr = values[timeIndex];
        const date = new Date(timeStr);
        if (!isNaN(date.getTime())) {
          hour = date.getHours();
        }
      } catch (e) {
        // If time parsing fails, keep default hour
      }
    }
    
    // Simulate illegal flag with 70% legal, 30% illegal
    const illegal = Math.random() > 0.7 ? 1 : 0;
    
    data.push({
      lat,
      lon,
      hour,
      illegal
    });
  }
  
  return data;
};

export const generateMockData = (count: number = 100): FishingData[] => {
  const data: FishingData[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random coordinates
    const lat = (Math.random() * 170) - 85; // -85 to 85
    const lon = (Math.random() * 360) - 180; // -180 to 180
    
    // Random hour (0-23)
    const hour = Math.floor(Math.random() * 24);
    
    // 70% legal, 30% illegal
    const illegal = Math.random() > 0.7 ? 1 : 0;
    
    data.push({ lat, lon, hour, illegal });
  }
  
  return data;
};

export const prepareTrainingData = (data: FishingData[]): { X: number[][], y: number[] } => {
  const X = data.map(point => [point.lat, point.lon, point.hour]);
  const y = data.map(point => point.illegal);
  
  return { X, y };
};

export const calculateHourlyActivity = (data: FishingData[]): ChartData[] => {
  const hourlyCount = new Array(24).fill(0);
  const hourlyIllegal = new Array(24).fill(0);
  
  data.forEach(point => {
    hourlyCount[point.hour]++;
    if (point.illegal === 1) {
      hourlyIllegal[point.hour]++;
    }
  });
  
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    illegal: hourlyCount[hour] ? (hourlyIllegal[hour] / hourlyCount[hour]) * 100 : 0
  }));
};

export const calculateActivityDistribution = (data: FishingData[]): ActivityCount[] => {
  const legalCount = data.filter(point => point.illegal === 0).length;
  const illegalCount = data.filter(point => point.illegal === 1).length;
  
  return [
    { Illegal: 0, Count: legalCount },
    { Illegal: 1, Count: illegalCount }
  ];
};

export const dataToGeoJSON = (data: FishingData[]) => {
  return {
    type: "FeatureCollection",
    features: data.map(point => ({
      type: "Feature",
      properties: {
        hour: point.hour,
        illegal: point.illegal
      },
      geometry: {
        type: "Point",
        coordinates: [point.lon, point.lat]
      }
    }))
  };
};

export const splitData = (data: FishingData[], trainRatio: number = 0.8): {
  train: FishingData[];
  test: FishingData[];
} => {
  // Shuffle the data
  const shuffled = [...data].sort(() => 0.5 - Math.random());
  
  const trainSize = Math.floor(data.length * trainRatio);
  const trainData = shuffled.slice(0, trainSize);
  const testData = shuffled.slice(trainSize);
  
  return { train: trainData, test: testData };
};
