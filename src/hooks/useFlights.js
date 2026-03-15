import { useState, useEffect } from "react";
import { generateMockFlights } from "../data/mockFlights";
import { threatLevel }         from "../lib/threatLevel";

// OpenSky avstängd tills vi har en server-side proxy
// Kör mock-data för att undvika 429-fel
const USE_LIVE = false;

export function useFlights() {
  const [flights,   setFlights]   = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const source = USE_LIVE ? "live" : "mock";

  useEffect(() => {
    const mock = generateMockFlights(160);
    setFlights(mock);
    setAnomalies(mock.filter(f => f.anomaly));
    setLoading(false);
  }, []);

  return { flights, anomalies, loading, source };
}