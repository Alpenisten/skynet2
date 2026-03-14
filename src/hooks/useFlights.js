import { useState, useEffect, useCallback } from "react";
import { fetchOpenSkyFlights }              from "../lib/opensky";
import { generateMockFlights }              from "../data/mockFlights";
import { threatLevel }                      from "../lib/threatLevel";

const POLL_INTERVAL_MS = 15000; // 15 sekunder

function detectAnomalies(flights) {
  return flights.map(f => {
    if (f.anomaly) return f;
    let anomaly     = false;
    let anomalyType = null;

    if (f.squawk === "7700") {
      anomaly = true; anomalyType = "SQUAWK 7700";
    } else if (!f.onGround && f.alt > 0 && f.alt < 3000 && f.speed > 350) {
      anomaly = true; anomalyType = "LOW ALT HIGH SPEED";
    } else if (f.speed > 600) {
      anomaly = true; anomalyType = "SPEED ANOMALY";
    }

    return { ...f, anomaly, anomalyType };
  });
}

export function useFlights() {
  const [flights,   setFlights]   = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [source,    setSource]    = useState("mock"); // "live" | "mock"

  const loadFlights = useCallback(async () => {
    const live = await fetchOpenSkyFlights();

    if (live && live.length > 0) {
      const withAnomalies = detectAnomalies(live);
      setFlights(withAnomalies);
      setAnomalies(withAnomalies.filter(f => f.anomaly));
      setSource("live");
    } else {
      // OpenSky misslyckades — använd mockdata som fallback
      const mock = generateMockFlights(160);
      setFlights(mock);
      setAnomalies(mock.filter(f => f.anomaly));
      setSource("mock");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadFlights();
    const interval = setInterval(loadFlights, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadFlights]);

  return { flights, anomalies, loading, source };
}