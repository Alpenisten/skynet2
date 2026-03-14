import { C, F } from "../../constants/theme";
import Panel     from "./Panel";
import BarChart  from "../ui/BarChart";

const SERVERS  = ["SERVER.20","SERVER.21","SERVER.22","SERVER.23","SERVER.24","SERVER.25"];
const ONLINE   = [0, 1, 3, 5];
const SIGNALS  = [["P1", false], ["SX", true], ["NA", false], ["QA", false]];

export default function MainframeStatus({ stats = {}, barVals = [] }) {
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

      <Panel title="SIGNAL MATRIX" style={{ flexShrink: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: 4 }}>
          {SIGNALS.map(([key, highlight]) => (
            <div key={key} style={{
              background: highlight ? "rgba(0,212,255,0.14)" : "rgba(13,58,90,0.28)",
              padding: "3px 7px", display: "flex", justifyContent: "space-between",
              fontFamily: F, fontSize: 11,
            }}>
              <span style={{ color: C.dim, letterSpacing: 2 }}>{key}</span>
              <span style={{ color: highlight ? C.cyan : C.text }}>{stats[key.toLowerCase()] ?? "—"}</span>
            </div>
          ))}
        </div>
      </Panel>

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