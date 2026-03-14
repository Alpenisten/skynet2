import { C, F }             from "../../constants/theme";
import { lookupAirport, lookupAirline, lookupAircraft } from "../../lib/opensky";
import { threatLevel }       from "../../lib/threatLevel";
import AircraftSilhouette    from "../ui/AircraftSilhouette";
import BarChart              from "../ui/BarChart";
import Panel                 from "./Panel";

function Row({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 8px", fontSize: 9, borderBottom: "1px solid rgba(13,58,90,0.2)", fontFamily: F }}>
      <span style={{ color: C.dim, letterSpacing: 2 }}>{label}</span>
      <span style={{ color: color || C.bright, letterSpacing: 1 }}>{value || "—"}</span>
    </div>
  );
}

export default function ContactPanel({ flight, barVals, analysis, isAnalyzing, onAnalyze, onClose }) {
  if (!flight) return null;
  const tl      = threatLevel(flight);
  const airline = lookupAirline(flight.callsign);
  const aircraft = lookupAircraft(flight.equipment);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={{ padding: "4px 8px", background: tl.bg, borderBottom: `1px solid ${tl.color}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: tl.color, fontWeight: 700, letterSpacing: 3, fontFamily: F }}>{tl.code}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>
        <div style={{ height: 80, borderBottom: `1px solid ${C.border}` }}>
          <AircraftSilhouette equipment={flight.equipment} />
        </div>

        <Row label="CALLSIGN"    value={flight.callsign} color={C.cyan} />
        <Row label="AIRLINE"     value={airline} />
        <Row label="AIRCRAFT"    value={aircraft || flight.equipment} />
        <Row label="ORIGIN"      value={lookupAirport(flight.origin)} />
        <Row label="DESTINATION" value={lookupAirport(flight.destination)} />
        <Row label="ALTITUDE"    value={flight.alt ? `${flight.alt.toLocaleString()} FT` : null} />
        <Row label="SPEED"       value={flight.speed ? `${flight.speed} KT` : null} />
        <Row label="HEADING"     value={flight.heading ? `${flight.heading}°` : null} />
        <Row label="SQUAWK"      value={flight.squawk} color={flight.squawk === "7700" ? C.red : C.bright} />
        <Row label="ICAO24"      value={flight.icao24} color={C.dim} />

        {flight.anomaly && (
          <div style={{ padding: "4px 8px", background: "rgba(255,100,0,0.1)", margin: "4px", border: `1px solid rgba(255,140,0,0.3)` }}>
            <div style={{ fontSize: 8, color: C.orange, letterSpacing: 3, fontFamily: F, marginBottom: 2 }}>ANOMALY DETECTED</div>
            <div style={{ fontSize: 9, color: C.bright, fontFamily: F }}>{flight.anomalyType}</div>
          </div>
        )}

        <Panel title="SIGNAL POWER" style={{ margin: 4, flexShrink: 0 }}>
          <BarChart values={barVals} color={tl.color} />
        </Panel>

        <div style={{ padding: "4px 8px" }}>
          <div style={{ fontSize: 8, color: C.dim, letterSpacing: 3, fontFamily: F, marginBottom: 4 }}>AI BRIEFING</div>
          {isAnalyzing ? (
            <div style={{ fontSize: 9, color: C.orange, letterSpacing: 2, fontFamily: F }}>ANALYZING CONTACT...</div>
          ) : analysis ? (
            <div style={{ fontSize: 9, color: C.text, lineHeight: 1.6, fontFamily: F, whiteSpace: "pre-wrap" }}>{analysis}</div>
          ) : (
            <button onClick={onAnalyze} style={{
              background: "rgba(0,212,255,0.08)", border: `1px solid ${C.cyan}`,
              color: C.cyan, fontSize: 9, letterSpacing: 3, padding: "4px 12px",
              fontFamily: F, cursor: "pointer", width: "100%",
            }}>
              RUN AI ANALYSIS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}