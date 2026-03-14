// ── COLORS ───────────────────────────────────────────────────────────────────
export const C = {
  bg:      "#040c18",
  panel:   "#050e1c",
  border:  "#0d3a5a",
  cyan:    "#00d4ff",
  orange:  "#ff8c00",
  red:     "#ff2a2a",
  green:   "#00ff88",
  dim:     "#1a4a6a",
  text:    "#7ab8cc",
  bright:  "#c8e8f0",
};

// ── FONT ─────────────────────────────────────────────────────────────────────
export const F = "'Orbitron','Courier New',monospace";

// ── GOOGLE FONT LOADER ───────────────────────────────────────────────────────
// Körs en gång när filen importeras
if (typeof document !== "undefined") {
  const link = document.createElement("link");
  link.rel  = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&display=swap";
  document.head.appendChild(link);
}