import { useState, useEffect } from "react";
import { C, F }  from "../../constants/theme";
import Panel     from "./Panel";
import BarChart  from "../ui/BarChart";

const SERVERS = ["SERVER.20","SERVER.21","SERVER.22","SERVER.23","SERVER.24","SERVER.25"];
const ONLINE  = [0, 1, 3, 5];

function useFluctuate(base, range, interval) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    if (!base) return;
    const id = setInterval(() => {
      setVal(Math.round(base + (Math.random() - 0.5) * range));
    }, interval);
    return () => clearInterval(id);
  }, [base, range, interval]);
  return val;
}

function SignalMatrix({ flights }) {
  const total   = flights.length || 0;
  const anomaly = flights.filter(f => f.anomaly).length || 0;
  const p1 = useFluctuate(total - anomaly, 8,  1200);
  const sx = useFluctuate(anomaly,          2,  900);
  const na = useFluctuate(total,            10, 1500);
  const qa = useFluctuate(Math.round(total * 0.94), 6, 1100);

  const rows = [
    ["P1", p1, false],
    ["SX", sx, true],
    ["NA", na, false],
    ["QA", qa, false],
  ];

  return (
    <Panel title="SIGNAL MATRIX" style={{ flexShrink: 0 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: 4 }}>
        {rows.map(([key, val, hi]) => (
          <div key={key} style={{
            background: hi ? "rgba(0,212,255,0.14)" : "rgba(13,58,90,0.28)",
            padding: "3px 7px", display: "flex", justifyContent: "space-between",
            fontFamily: F, fontSize: 11,
          }}>
            <span style={{ color: C.dim, letterSpacing: 2 }}>{key}</span>
            <span style={{ color: hi ? C.cyan : C.text }}>{val}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export default function MainframeStatus({ barVals, flights }) {
  const safeFlights = flights || [];

  return (
    <>
      <Panel title="MAINFRAME STATUS">
        {SERVERS.map((s, i) => (
          <div key={s} style={{
            display: "flex", justifyContent: "space-between",
            padding: "2px 8px", fontSize: 9,
            borderBottom: `1px solid rgba(13,58,90,0.28)`, fontFamily: F,
          }}>
            <span style={{ color: C.dim, letterSpacing: 2 }}>MAINFRAME.{s}</span>
            <span style={{ color: ONLINE.includes(i) ? C.cyan : C.red, letterSpacing: 2 }}>
              {ONLINE.includes(i) ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
        ))}
      </Panel>

      <SignalMatrix flights={safeFlights} />

      <Panel title="SIGNAL POWER" style={{ flexShrink: 0 }}>
        <BarChart values={barVals} color={C.cyan} />
        <div style={{ display: "flex", justifyContent: "space-around", padding: "0 8px 3px" }}>
          {["128B","256B","512B"].map(l => (
            <span key={l} style={{ fontSize: 8, color: C.dim, letterSpacing: 2, fontFamily: F }}>{l}</span>
          ))}
        </div>
      </Panel>
    </>
  );
}