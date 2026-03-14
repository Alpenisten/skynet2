import { C, F }   from "../../constants/theme";
import Panel       from "./Panel";
import WaveForm    from "../ui/WaveForm";
import ScrollLog   from "../ui/ScrollLog";

export default function DataStreamPanel({ flights }) {
  return (
    <div style={{
      height: 260, flexShrink: 0, display: "flex", flexDirection: "column",
      border: `1px solid ${C.border}`, background: "#050f1a", overflow: "hidden",
    }}>
      <div style={{
        padding: "3px 8px", background: "rgba(0,180,255,0.05)",
        borderBottom: `1px solid ${C.border}`, flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, letterSpacing: 3, color: C.cyan, fontWeight: 600, fontFamily: F }}>
          DATA STREAM MATRIX
        </span>
      </div>
      <div style={{ flexShrink: 0, padding: "2px 0" }}>
        <WaveForm />
      </div>
      <div style={{ padding: "2px 8px", fontSize: 9, color: C.dim, letterSpacing: 2, fontFamily: F, flexShrink: 0 }}>
        <div>↑ UPLOAD DATA RATE</div>
        <div>↓ DOWNLOAD DATA RATE</div>
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        <ScrollLog flights={flights} />
      </div>
    </div>
  );
}