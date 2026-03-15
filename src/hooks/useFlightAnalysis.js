import { useState, useCallback } from "react";
import { analyzeFlightWithAI }   from "../lib/deepseek";
import { generatePTTOptions }    from "../lib/ptt";

export function useFlightAnalysis() {
  const [analysis,    setAnalysis]    = useState({});
  const [pttOptions,  setPttOptions]  = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback(async (flight) => {
    if (!flight) return;
    if (analysis[flight.id]) return;
    setIsAnalyzing(true);
    try {
      const briefing = await analyzeFlightWithAI(flight);
      setAnalysis(prev => ({ ...prev, [flight.id]: briefing }));
      const options = await generatePTTOptions(flight, briefing);
      setPttOptions(prev => ({ ...prev, [flight.id]: options }));
    } catch (err) {
      console.error("Analysis failed:", err);
    }
    setIsAnalyzing(false);
  }, [analysis]);

  const getAnalysis   = useCallback((id) => id ? analysis[id]   || null : null, [analysis]);
  const getPTTOptions = useCallback((id) => id ? pttOptions[id] || null : null, [pttOptions]);

  return { analyze, getAnalysis, getPTTOptions, isAnalyzing };
}