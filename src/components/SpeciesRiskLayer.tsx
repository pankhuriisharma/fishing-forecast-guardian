
import { useEffect } from "react";
import L, { LatLngTuple } from "leaflet";

interface SpeciesRiskLayerProps {
  map: L.Map | null;
  show: boolean;
}

const dummyHabitats = [
  {
    name: "Hawksbill Turtle Migration",
    color: "#fbbf24",
    polygon: [
      [0, -30],
      [10, -35],
      [15, -28],
      [12, -15],
      [5, -20],
      [0, -30],
    ]
  },
  {
    name: "Giant Manta Ray Zone",
    color: "#6ee7b7",
    polygon: [
      [-15, 100],
      [-6, 105],
      [-7, 113],
      [-19, 110],
      [-15, 100]
    ]
  },
  {
    name: "Blue Whale Breeding Area",
    color: "#818cf8",
    polygon: [
      [36, -122],
      [40, -125],
      [41, -120],
      [38, -117],
      [36, -122]
    ]
  }
];

let layerGroup: L.LayerGroup | null = null;

const SpeciesRiskLayer = ({ map, show }: SpeciesRiskLayerProps) => {
  useEffect(() => {
    if (!map) return;
    if (layerGroup) {
      map.removeLayer(layerGroup);
      layerGroup = null;
    }
    if (show) {
      layerGroup = L.layerGroup(
        dummyHabitats.map(habitat =>
          L.polygon(
            habitat.polygon.map(
              p => [p[0], p[1]] as LatLngTuple
            ),
            {
              color: habitat.color,
              fillOpacity: 0.2,
              weight: 2,
              dashArray: "6 6"
            }
          )
            .bindTooltip(`<b>${habitat.name}</b>`, { sticky: true })
        )
      ).addTo(map);
    }
    return () => {
      if (layerGroup && map) {
        map.removeLayer(layerGroup);
        layerGroup = null;
      }
    };
  }, [map, show]);
  return null;
};

export default SpeciesRiskLayer;

