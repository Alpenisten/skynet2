import { C, F } from "../../constants/theme";

export default function Panel({ title, children, style = {} }) {
  return (
    <div style={{
      border: `1px solid ${C.border}`,
      background: C.panel,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      ...style,
    }}>
      {title && (
        <div style={{
          padding: "3px 8px",
          background: "rgba(0,180,255,0.05)",
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 9, letterSpacing: 3, color: C.cyan, fontWeight: 600, fontFamily: F }}>
            {title}
          </span>
        </div>
      )}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}