import { F } from "../../constants/theme";

const WIDE_BODY    = ["B77W","B772","B773","B744","B748","A388","A359","A35K","B789","B788","B78X"];
const JUMBO        = ["B744","B748","A388"];
const REGIONAL     = ["E190","E195","E170","CRJ9","CRJ7","AT76","AT75","DH8D"];

function Widebody({ isJumbo }) {
  return (
    <svg width="90" height="52" viewBox="0 0 90 52" style={{ opacity: 0.22, filter: "drop-shadow(0 0 6px #00d4ff)" }}>
      <ellipse cx="45" cy="26" rx="38" ry="5.5" fill="#00d4ff"/>
      <path d="M38,24 L8,16 L6,20 L38,28 Z"   fill="#00aacc"/>
      <path d="M52,24 L82,16 L84,20 L52,28 Z"  fill="#00aacc"/>
      <path d="M10,25 L2,21 L2,23 L10,27 Z"    fill="#007799"/>
      <path d="M10,25 L2,29 L2,27 L10,27 Z"    fill="#007799"/>
      <ellipse cx="22" cy="15" rx="6" ry="2.5" fill="#005577"/>
      <ellipse cx="68" cy="15" rx="6" ry="2.5" fill="#005577"/>
      {!isJumbo && <>
        <ellipse cx="28" cy="18" rx="5" ry="2" fill="#005577"/>
        <ellipse cx="62" cy="18" rx="5" ry="2" fill="#005577"/>
      </>}
    </svg>
  );
}

function Narrowbody() {
  return (
    <svg width="90" height="48" viewBox="0 0 90 48" style={{ opacity: 0.22, filter: "drop-shadow(0 0 6px #00d4ff)" }}>
      <ellipse cx="45" cy="24" rx="38" ry="4"  fill="#00d4ff"/>
      <path d="M40,22 L14,14 L12,18 L40,26 Z"  fill="#00aacc"/>
      <path d="M50,22 L76,14 L78,18 L50,26 Z"  fill="#00aacc"/>
      <path d="M10,23 L3,20 L3,22 L10,25 Z"    fill="#007799"/>
      <path d="M10,23 L3,26 L3,24 L10,25 Z"    fill="#007799"/>
      <ellipse cx="26" cy="14" rx="5" ry="2"   fill="#005577"/>
      <ellipse cx="64" cy="14" rx="5" ry="2"   fill="#005577"/>
    </svg>
  );
}

function Regional() {
  return (
    <svg width="80" height="44" viewBox="0 0 80 44" style={{ opacity: 0.22, filter: "drop-shadow(0 0 6px #00d4ff)" }}>
      <ellipse cx="40" cy="22" rx="32" ry="3.5" fill="#00d4ff"/>
      <path d="M36,20 L16,14 L15,17 L36,23 Z"  fill="#00aacc"/>
      <path d="M44,20 L64,14 L65,17 L44,23 Z"  fill="#00aacc"/>
      <path d="M10,21 L4,19 L4,21 L10,23 Z"    fill="#007799"/>
      <path d="M10,21 L4,23 L4,21 L10,23 Z"    fill="#007799"/>
      <ellipse cx="24" cy="14" rx="4" ry="1.8" fill="#005577"/>
      <ellipse cx="56" cy="14" rx="4" ry="1.8" fill="#005577"/>
    </svg>
  );
}

export default function AircraftSilhouette({ equipment, loading }) {
  const code    = (equipment || "").toUpperCase();
  const isWide  = WIDE_BODY.includes(code);
  const isJumbo = JUMBO.includes(code);
  const isReg   = REGIONAL.includes(code);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, height: "100%" }}>
      {isWide ? <Widebody isJumbo={isJumbo} /> : isReg ? <Regional /> : <Narrowbody />}
      <div style={{ fontSize: 9, color: "rgba(0,130,160,0.5)", letterSpacing: 3, fontFamily: F }}>
        {loading ? "ACQUIRING VISUAL..." : code ? `${code} · NO PHOTO ON FILE` : "NO IMAGE ON FILE"}
      </div>
    </div>
  );
}