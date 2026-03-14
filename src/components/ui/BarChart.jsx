import { C } from "../../constants/theme";

export default function BarChart({ values = [], color = C.cyan }) {
  const max = Math.max(...values, 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, padding: "4px 8px", height: 40 }}>
      {values.map((v, i) => (
        <div key={i} style={{
          flex: 1,
          height: `${(v / max) * 100}%`,
          background: color,
          opacity: 0.3 + (v / max) * 0.7,
          transition: "height 0.4s ease",
        }} />
      ))}
    </div>
  );
}