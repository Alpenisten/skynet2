import { useState, useEffect } from "react";
import { C, F } from "../../constants/theme";

const MESSAGES = [
  "CONTACT ACQUIRED", "TRANSPONDER ACTIVE", "POSITION UPDATE",
  "ALT CHANGE", "HEADING CHANGE", "CONTACT LOST",
  "SIGNAL WEAK", "ROUTE DEVIATION",
];

export default function ScrollLog({ flights }) {
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (!flights.length) return;

    const add = () => {
      const f = flights[Math.floor(Math.random() * flights.length)];
      const entry = {
        id:    Date.now(),
        call:  f.callsign,
        msg:   MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
        alert: f.anomaly,
        time:  new Date().toISOString().slice(11, 19),
      };
      setLog(prev => [entry, ...prev].slice(0, 20));
    };

    add();
    const id = setInterval(add, 1800);
    return () => clearInterval(id);
  }, [flights]);

  return (
    <div style={{ overflowY: "auto", flex: 1 }}>
      {log.map(e => (
        <div key={e.id} style={{
          padding: "2px 8px", borderBottom: `1px solid rgba(13,58,90,0.28)`,
          display: "flex", gap: 6, fontSize: 10, fontFamily: F,
        }}>
          <span style={{ color: "rgba(0,212,255,0.35)", flexShrink: 0, letterSpacing: 1 }}>{e.time}</span>
          <span style={{ color: e.alert ? C.orange : C.dim, fontWeight: 600, flexShrink: 0, letterSpacing: 2 }}>{e.call}</span>
          <span style={{ color: e.alert ? C.red : "rgba(0,212,255,0.45)", letterSpacing: 1 }}>{e.msg}</span>
        </div>
      ))}
    </div>
  );
}