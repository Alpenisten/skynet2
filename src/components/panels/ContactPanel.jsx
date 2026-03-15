import { useState, useEffect }                          from "react";
import { C, F }                                         from "../../constants/theme";
import { lookupAirport, lookupAirline, lookupAircraft } from "../../lib/opensky";
import { threatLevel }                                  from "../../lib/threatLevel";
import AircraftSilhouette                               from "../ui/AircraftSilhouette";
import BarChart                                         from "../ui/BarChart";
import Panel                                            from "./Panel";

// Hämtar flygplansfoto från Planespotters.net via ICAO24
async function fetchPlanePhoto(icao24) {
  if (!icao24 || icao24.length < 6) return null;
  try {
    const res  = await fetch(`https://api.planespotters.net/pub/photos/hex/${icao24}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.photos?.[0]?.thumbnail_large?.src || json?.photos?.[0]?.thumbnail?.src || null;
  } catch {
    return null;
  }
}

function useFlicker(base, interval) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    if (!base) return;
    const id = setInterval(() => {
      setVal(base + Math.floor((Math.random() - 0.5) * 6));
    }, interval);
    return () => clearInterval(id);
  }, [base, interval]);
  return val;
}

function DataRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 8px", borderBottom: "1px solid rgba(13,58,90,0.2)", fontFamily: F }}>
      <span style={{ fontSize: 8, color: C.dim, letterSpacing: 2 }}>{label.toUpperCase()}</span>
      <span style={{ fontSize: 9, color: color || C.bright, letterSpacing: 1 }}>{value ? value.toString().toUpperCase() : "—"}</span>
    </div>
  );
}

function BigStat({ label, value, color }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 4px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(13,58,90,0.4)" }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: color || C.cyan, fontFamily: F, letterSpacing: 1 }}>{value || "—"}</span>
      <span style={{ fontSize: 7, color: C.dim, letterSpacing: 2, fontFamily: F, marginTop: 2 }}>{label}</span>
    </div>
  );
}

function SectionHeader({ title }) {
  return (
    <div style={{ padding: "4px 8px 2px", background: "rgba(0,0,0,0.2)", borderBottom: `1px solid rgba(13,58,90,0.4)`, marginTop: 2 }}>
      <span style={{ fontSize: 8, color: C.cyan, letterSpacing: 3, fontFamily: F, fontWeight: 600 }}>{title.toUpperCase()}</span>
    </div>
  );
}

// Flygplansbild — försöker Planespotters först, faller tillbaka på silhuett
function AircraftImage({ icao24, equipment }) {
  const [photoUrl,    setPhotoUrl]    = useState(null);
  const [photoLoading, setPhotoLoading] = useState(true);
  const [photoError,  setPhotoError]  = useState(false);

  useEffect(() => {
    setPhotoUrl(null);
    setPhotoLoading(true);
    setPhotoError(false);
    fetchPlanePhoto(icao24).then(url => {
      setPhotoUrl(url);
      setPhotoLoading(false);
      if (!url) setPhotoError(true);
    });
  }, [icao24]);

  if (photoLoading) {
    return (
      <div style={{ height: 110, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 8, color: C.dim, letterSpacing: 3, fontFamily: F }}>ACQUIRING VISUAL...</span>
      </div>
    );
  }

  if (photoUrl && !photoError) {
    return (
      <div style={{ height: 110, borderBottom: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <img
          src={photoUrl}
          alt="aircraft"
          style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
          onError={() => setPhotoError(true)}
        />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(2,8,16,0.8))",
          height: 30,
        }}/>
        <div style={{ position: "absolute", bottom: 4, right: 6, fontSize: 7, color: "rgba(255,255,255,0.3)", fontFamily: F, letterSpacing: 1 }}>
          © PLANESPOTTERS.NET
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: 110, borderBottom: `1px solid ${C.border}` }}>
      <AircraftSilhouette equipment={equipment} />
    </div>
  );
}

export default function ContactPanel({ flight, barVals, analysis, isAnalyzing, onAnalyze, onClose }) {
  const tl       = flight ? threatLevel(flight) : { color: "#00d4ff", bg: "transparent", code: "", label: "" };
  const airline  = flight ? lookupAirline(flight.callsign)  : null;
  const aircraft = flight ? lookupAircraft(flight.equipment) : null;
  const altM     = useFlicker(flight?.alt   ? Math.round(flight.alt   * 0.3048) : null, 1700);
  const spdKmh   = useFlicker(flight?.speed ? Math.round(flight.speed * 1.852)  : null, 2300);
  const flightLevel = altM ? `FL${String(Math.round(altM / 30.48)).padStart(3, "0")}` : "—";

  // Early return EFTER alla hooks
  if (!flight) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.panel }}>

      <div style={{ padding: "5px 8px", background: tl.bg, borderBottom: `1px solid ${tl.color}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span style={{ fontSize: 14, color: tl.color, fontWeight: 700, letterSpacing: 3, fontFamily: F }}>{flight.callsign}</span>
          <span style={{ fontSize: 8, color: tl.color, letterSpacing: 2, fontFamily: F, opacity: 0.8 }}>{tl.code}</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: `1px solid ${C.dim}`, color: C.dim, cursor: "pointer", fontSize: 12, lineHeight: 1, padding: "2px 6px", fontFamily: F }}>✕</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1 }}>

        <AircraftImage icao24={flight.icao24} equipment={flight.equipment} />

        {flight.anomaly && (
          <div style={{ margin: "6px 6px 2px", padding: "6px 10px", background: "rgba(255,100,0,0.12)", border: `1px solid rgba(255,140,0,0.4)` }}>
            <div style={{ fontSize: 8, color: C.orange, letterSpacing: 3, fontFamily: F, fontWeight: 700, marginBottom: 4 }}>⚠ ANOMALY DETECTED</div>
            <div style={{ fontSize: 9, color: C.bright, fontFamily: F, letterSpacing: 2 }}>{flight.anomalyType?.toUpperCase()}</div>
          </div>
        )}

        <SectionHeader title="CONTACT IDENTIFICATION" />
        <DataRow label="AIRLINE"  value={airline} />
        <DataRow label="AIRCRAFT" value={aircraft || flight.equipment} />
        <DataRow label="SQUAWK"   value={flight.squawk} color={flight.squawk === "7700" ? C.red : C.bright} />
        <DataRow label="ICAO24"   value={flight.icao24} color={C.dim} />

        <SectionHeader title="FLIGHT DATA" />
        <div style={{ display: "flex", gap: 2, padding: 4 }}>
          <BigStat label="ALTITUDE (M)"  value={altM?.toLocaleString()}    color={tl.color} />
          <BigStat label="FLIGHT LEVEL"  value={flightLevel}               color={C.cyan} />
        </div>
        <div style={{ display: "flex", gap: 2, padding: "0 4px 4px" }}>
          <BigStat label="SPEED (KM/H)"  value={spdKmh?.toLocaleString()}  color={tl.color} />
          <BigStat label="HEADING"       value={flight.heading ? `${flight.heading}°` : "—"} color={C.cyan} />
        </div>

        <SectionHeader title="POSITION DATA" />
        <DataRow label="LAT"         value={flight.lat?.toFixed(4)} />
        <DataRow label="LON"         value={flight.lon?.toFixed(4)} />
        <DataRow label="ORIGIN"      value={lookupAirport(flight.origin)} />
        <DataRow label="DESTINATION" value={lookupAirport(flight.destination)} />

        {flight.anomaly && (
          <div style={{ margin: "4px 4px 0", padding: "4px 8px", background: "rgba(255,100,0,0.1)", border: `1px solid rgba(255,140,0,0.3)` }}>
            <div style={{ fontSize: 8, color: C.orange, letterSpacing: 3, fontFamily: F, marginBottom: 2 }}>⚠ ANOMALY DETECTED</div>
            <div style={{ fontSize: 9, color: C.bright, fontFamily: F }}>{flight.anomalyType}</div>
          </div>
        )}

        <SectionHeader title="TRANSPONDER SIGNAL" />
        <BarChart values={barVals} color={tl.color} />

        

      </div>
    </div>
  );
}