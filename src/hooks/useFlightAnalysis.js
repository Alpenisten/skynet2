import { useState, useCallback } from "react";
import { analyzeFlightWithAI }   from "../lib/deepseek";

export function useFlightAnalysis() {
  const [analysis,    setAnalysis]    = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback(async (flight) => {
    if (!flight) return;
    if (analysis[flight.id]) return; // redan analyserad

    setIsAnalyzing(true);
    const result = await analyzeFlightWithAI(flight);
    setAnalysis(prev => ({ ...prev, [flight.id]: result }));
    setIsAnalyzing(false);
  }, [analysis]);

  const getAnalysis = useCallback((flightId) => {
    return analysis[flightId] || null;
  }, [analysis]);

  return { analyze, getAnalysis, isAnalyzing };
}