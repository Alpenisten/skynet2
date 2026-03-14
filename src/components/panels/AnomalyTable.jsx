import { C, F }      from "../../constants/theme";
import { threatLevel } from "../../lib/threatLevel";

export default function AnomalyTable({ anomalies, selectedFlight, onSelect, utc, isAnalyzing, onAnalyze }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${C.border}`, background: C.panel }}>
      <div style={{ padding: "3px 8px", background: "rgba(255,80,0,0.07)", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 9, letterSpacing: 3, color: C.orange, fontWeight: 600, fontFamily: F }}>ANOMALY CONTACTS</span>
        <span style={{ fontSize: 9, letterSpacing: 2, color: C.dim, fontFamily: F }}>{anomalies.length} FLAGGED</span>
      </div>

      <div style={{ display: "flex", padding: "2px 8px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {["THREAT","CALLSIGN","TYPE","ALT (FT)","SPD (KT)","HDG","TIME"].map(h => (
          <span key={h} style={{ flex: h === "TYPE" ? 2 : 1, fontSize: 8, color: C.dim, letterSpacing: 2, fontFamily: F }}>{h}</span>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {anomalies.map(f => {
          const tl       = threatLevel(f);
          const selected = selectedFlight?.id === f.id;
          return (
            <div key={f.id}
              onClick={() => onSelect(f)}
              style={{
                display: "flex", alignItems: "center", padding: "3px 8px",
                borderBottom: `1px solid rgba(13,58,90,0.28)`,
                background: selected ? tl.bg : "transparent",
                cursor: "pointer", transition: "background 0.2s",
              }}
            >
              <span style={{ flex: 1, fontSize: 9, color: tl.color, fontWeight: 700, letterSpacing: 1, fontFamily: F }}>{tl.code}</span>
              <span style={{ flex: 1, fontSize: 10, color: C.bright, letterSpacing: 1, fontFamily: F }}>{f.callsign}</span>
              <span style={{ flex: 2, fontSize: 9, color: C.orange, letterSpacing: 1, fontFamily: F }}>{f.anomalyType}</span>
              <span style={{ flex: 1, fontSize: 9, color: C.text, fontFamily: F }}>{f.alt?.toLocaleString()}</span>
              <span style={{ flex: 1, fontSize: 9, color: C.text, fontFamily: F }}>{f.speed}</span>
              <span style={{ flex: 1, fontSize: 9, color: C.text, fontFamily: F }}>{f.heading}°</span>
              <span style={{ flex: 1, fontSize: 8, color: C.dim, fontFamily: F }}>{utc}</span>
            </div>
          );
        })}
        {anomalies.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", fontSize: 9, color: C.dim, letterSpacing: 3, fontFamily: F }}>
            NO ANOMALIES DETECTED
          </div>
        )}
      </div>

      {selectedFlight && (
        <div style={{ padding: "4px 8px", borderTop: `1px solid ${C.border}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            style={{
              background: "rgba(255,140,0,0.15)", border: `1px solid ${C.orange}`,
              color: C.orange, fontSize: 9, letterSpacing: 3, padding: "3px 12px",
              fontFamily: F, cursor: isAnalyzing ? "wait" : "pointer",
            }}
          >
            {isAnalyzing ? "ANALYZING..." : "RUN AI ANALYSIS"}
          </button>
        </div>
      )}
    </div>
  );
}