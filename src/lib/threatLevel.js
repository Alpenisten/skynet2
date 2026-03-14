export function threatLevel(flight) {
  if (!flight.anomaly) {
    return { label:"ROUTINE", code:"RTN", color:"#00d4ff", bg:"rgba(0,212,255,0.08)", rank:0 };
  }
  const t = flight.anomalyType || "";
  if (t.includes("7700") || t.includes("EMERGENCY")) {
    return { label:"DELTA", code:"DELTA-4", color:"#ff2a2a", bg:"rgba(255,42,42,0.18)", rank:4 };
  }
  if (t.includes("RESTRICTED") || t.includes("NO TRANSPONDER")) {
    return { label:"CHARLIE", code:"CHARLIE-3", color:"#ff5500", bg:"rgba(255,85,0,0.15)", rank:3 };
  }
  if (t.includes("CIRCLING") || t.includes("HEADING") || t.includes("LOW ALT")) {
    return { label:"BRAVO", code:"BRAVO-2", color:"#ff8c00", bg:"rgba(255,140,0,0.12)", rank:2 };
  }
  return { label:"ALPHA", code:"ALPHA-1", color:"#ffcc00", bg:"rgba(255,204,0,0.1)", rank:1 };
}