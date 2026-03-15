import { useState } from "react";
import { C, F }     from "../../constants/theme";
import { threatLevel } from "../../lib/threatLevel";

const COLS = [
  { key: "threat",      label: "THREAT",   flex: 1 },
  { key: "callsign",    label: "CALLSIGN", flex: 1 },
  { key: "anomalyType", label: "TYPE",     flex: 2 },
  { key: "alt",         label: "ALT",      flex: 1 },
  { key: "speed",       label: "SPD",      flex: 1 },
];

export default function AnomalyTable({ anomalies, selectedFlight, onSelect }) {
  const [sortKey, setSortKey]   = useState("threat");
  const [sortAsc, setSortAsc]   = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  };

  const sorted = [...anomalies].sort((a, b) => {
    let av, bv;
    if (sortKey === "threat")   { av = threatLevel(a).rank; bv = threatLevel(b).rank; }
    else if (sortKey === "alt") { av = a.alt   || 0; bv = b.alt   || 0; }
    else if (sortKey === "speed") { av = a.speed || 0; bv = b.speed || 0; }
    else { av = (a[sortKey] || "").toString(); bv = (b[sortKey] || "").toString(); }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ?  1 : -1;
    return 0;
  });

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${C.border}`, background: C.panel }}>
      <div style={{ padding: "3px 8px", background: "rgba(255,80,0,0.07)", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, height: 28 }}>
        <span style={{ fontSize: 9, letterSpacing: 3, color: C.orange, fontWeight: 600, fontFamily: F }}>ANOMALY CONTACTS</span>
        <span style={{ fontSize: 9, letterSpacing: 2, color: C.orange, fontFamily: F }}>{anomalies.length} FLAGGED</span>
      </div>

      <div style={{ display: "flex", padding: "2px 8px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {COLS.map(col => (
          <div key={col.key} onClick={() => handleSort(col.key)}
            style={{ flex: col.flex, fontSize: 8, color: sortKey === col.key ? C.cyan : C.dim, letterSpacing: 2, fontFamily: F, cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 3 }}>
            {col.label}
            {sortKey === col.key && <span style={{ fontSize: 7 }}>{sortAsc ? "▲" : "▼"}</span>}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {sorted.map(f => {
          const tl  = threatLevel(f);
          const sel = selectedFlight?.id === f.id;
          const altM   = f.alt   ? Math.round(f.alt   * 0.3048).toLocaleString() : "—";
          const spdKmh = f.speed ? Math.round(f.speed * 1.852).toLocaleString()  : "—";
          return (
            <div key={f.id} onClick={() => onSelect(f)} style={{
              display: "flex", alignItems: "center", padding: "3px 8px",
              borderBottom: `1px solid rgba(13,58,90,0.28)`,
              background: sel ? tl.bg : "transparent",
              cursor: "pointer", transition: "background 0.2s",
            }}>
              <span style={{ flex: 1, fontSize: 9, color: tl.color, fontWeight: 700, letterSpacing: 1, fontFamily: F }}>{tl.code}</span>
              <span style={{ flex: 1, fontSize: 10, color: C.bright, letterSpacing: 1, fontFamily: F }}>{f.callsign}</span>
              <span style={{ flex: 2, fontSize: 9, color: C.orange, letterSpacing: 1, fontFamily: F }}>{f.anomalyType}</span>
              <span style={{ flex: 1, fontSize: 9, color: C.text, fontFamily: F }}>{altM}</span>
              <span style={{ flex: 1, fontSize: 9, color: C.text, fontFamily: F }}>{spdKmh}</span>
            </div>
          );
        })}
        {anomalies.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", fontSize: 9, color: C.dim, letterSpacing: 3, fontFamily: F }}>NO ANOMALIES DETECTED</div>
        )}
      </div>
    </div>
  );
}