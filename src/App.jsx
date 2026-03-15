import { useState, useEffect, useRef } from "react";
import "./App.css";

import { C, F }              from "./constants/theme";
import { useFlights }        from "./hooks/useFlights";
import { useFlightAnalysis } from "./hooks/useFlightAnalysis";
import { generatePTTOptions, encodeCustomTransmission } from "./lib/ptt";
import { transmitRadio } from "./lib/elevenlabs";

import GlobeRenderer   from "./components/globe/GlobeRenderer";
import Panel           from "./components/panels/Panel";
import AnomalyTable    from "./components/panels/AnomalyTable";
import ContactPanel    from "./components/panels/ContactPanel";
import DataStreamPanel from "./components/panels/DataStreamPanel";
import MainframeStatus from "./components/panels/MainframeStatus";
import BarChart        from "./components/ui/BarChart";



// ── Hooks ────────────────────────────────────────────────────────────────────

function useUTC() {
  const [utc, setUtc] = useState("");
  useEffect(() => {
    const tick = () => setUtc(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return utc;
}

function useBarVals() {
  const [vals, setVals] = useState(Array.from({ length: 12 }, () => Math.random()));
  useEffect(() => {
    const id = setInterval(() => {
      setVals(v => v.map(x => Math.max(0.05, Math.min(1, x + (Math.random() - 0.5) * 0.2))));
    }, 800);
    return () => clearInterval(id);
  }, []);
  return vals;
}

function useStats(flights) {
  const [stats, setStats] = useState({ p1: 0, sx: 0, na: 0, qa: 0 });
  useEffect(() => {
    if (!flights.length) return;
    setStats({
      p1: flights.filter(f => !f.anomaly).length,
      sx: flights.filter(f =>  f.anomaly).length,
      na: flights.length,
      qa: Math.round(flights.length * 0.94),
    });
  }, [flights]);
  return stats;
}

function useTicker(ms) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
  return tick;
}

const NAV_ITEMS = ["FILE","EDIT","VIEW","OPTIONS","SERVER","SEARCH","TOOLS"];

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { flights, anomalies, loading, source } = useFlights();
  const { analyze, getAnalysis, getPTTOptions, isAnalyzing } = useFlightAnalysis();
  const [selectedFlight, setSelectedFlight]     = useState(null);
  const [pttOpen, setPttOpen]                   = useState(false);
  const [pttOptions, setPttOptions]         = useState(null);
  const [pttSelected, setPttSelected]       = useState(null);
  const [pttCustom, setPttCustom]           = useState("");
  const [pttEncoded, setPttEncoded]         = useState(null);
  const [pttEncoding, setPttEncoding]       = useState(false);
  const [pttDebug, setPttDebug]             = useState(null);
  const [pttTransmitting, setPttTransmitting] = useState(false);
  const [pttPhase, setPttPhase]               = useState(null); // "atc" | "pilot" | null
  const pttRef = useRef(null);
  
  useEffect(() => {
    if (!pttOpen) return;
    const handleOutsideClick = (e) => {
      if (pttRef.current && !pttRef.current.contains(e.target)) {
        setPttOpen(false);
        setPttOptions(null);
      }
    };
    setTimeout(() => document.addEventListener("mousedown", handleOutsideClick), 0);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [pttOpen]);

  const utc     = useUTC();
  const barVals = useBarVals();
  const stats   = useStats(flights);
  const tick    = useTicker(800);

  const selectFlight = (flight) => setSelectedFlight(flight);
  const closeFlight  = () => setSelectedFlight(null);
  const openPTT = () => {
    if (!selectedFlight) return;
    if (!getAnalysis(selectedFlight.id)) return;
    setPttOpen(true);
    setPttSelected(null);
    setPttEncoded(null);
    setPttDebug(null);
  };

  const handleEncode = async () => {
    if (!pttCustom.trim() || !selectedFlight) return;
    setPttEncoding(true);
    const result = await encodeCustomTransmission(selectedFlight, pttCustom);
    if (result) {
      setPttEncoded(result);
      setPttDebug(result);
    }
    setPttEncoding(false);
  };

  const handleTransmit = async () => {
    if (pttTransmitting) return;
    let atcText   = null;
    let pilotText = null;
    if (pttSelected !== null) {
      const options = getPTTOptions(selectedFlight?.id);
      const opt     = options?.[pttSelected];
      atcText   = opt?.atc;
      pilotText = opt?.pilot;
    } else if (pttEncoded) {
      atcText   = pttEncoded.atc;
      pilotText = pttEncoded.pilot;
    }
    if (!atcText || !pilotText) return;
    setPttTransmitting(true);
    await transmitRadio(
      atcText,
      pilotText,
      () => setPttPhase("atc"),
      () => setPttPhase("pilot"),
      () => { setPttTransmitting(false); setPttPhase(null); }
    );
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: C.bg, color: C.text, fontFamily: F, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <h1>DETTA ÄR ETT TEST 123</h1>
      {/* TOP MENU BAR */}
      <div style={{ height: 32, flexShrink: 0, display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}`, background: "#020810" }}>
        <div style={{ padding: "0 16px", fontSize: 13, letterSpacing: 6, color: C.cyan, fontWeight: 700, fontFamily: F, borderRight: `1px solid ${C.border}`, height: "100%", display: "flex", alignItems: "center" }}>
          ◈ SKYNET II
        </div>
        {NAV_ITEMS.map(item => (
          <div key={item} style={{ padding: "0 14px", height: "100%", display: "flex", alignItems: "center", fontSize: 11, letterSpacing: 2, color: C.dim, cursor: "pointer", borderRight: `1px solid ${C.border}` }}
            onMouseEnter={e => e.currentTarget.style.color = C.cyan}
            onMouseLeave={e => e.currentTarget.style.color = C.dim}
          >
            {item}
          </div>
        ))}
        <div
          onClick={openPTT}
          style={{
            padding: "0 16px", height: "100%", display: "flex", alignItems: "center",
            gap: 6, fontSize: 11, letterSpacing: 2,
            color: selectedFlight && getAnalysis(selectedFlight?.id) && !isAnalyzing ? C.orange : C.dim,
            cursor: selectedFlight && getAnalysis(selectedFlight?.id) && !isAnalyzing ? "pointer" : "not-allowed",
            border: `1px solid ${selectedFlight && getAnalysis(selectedFlight?.id) && !isAnalyzing ? C.orange : C.dim}`,
            background: pttOpen ? "rgba(255,140,0,0.25)" : "rgba(255,140,0,0.08)",
            marginLeft: 4, transition: "all 0.2s",
            opacity: selectedFlight && getAnalysis(selectedFlight?.id) && !isAnalyzing ? 1 : 0.35,
          }}>
          <span style={{ fontSize: 9 }}>▶</span> PTT
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 16px", fontSize: 11, letterSpacing: 4, color: "rgba(0,180,200,0.4)" }}>REGIS SURVEILLANCE</div>
        <div style={{ padding: "0 16px", fontSize: 11, letterSpacing: 2, color: C.orange, borderLeft: `1px solid ${C.border}` }}>{utc} UTC</div>
        <div style={{ padding: "0 12px", fontSize: 11, letterSpacing: 2, color: source === "live" ? C.green : C.dim, borderLeft: `1px solid ${C.border}` }}>
          {source === "live" ? "● LIVE" : "○ SIM"}
        </div>
      </div>

      {/* PTT SLIDING PANEL — overlay */}
      {pttOpen && (
        <div ref={pttRef} style={{
          position: "absolute", top: 32, left: 0, right: 0, zIndex: 100,
          background: "#030b15", borderBottom: `1px solid ${C.orange}`,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "6px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ color: C.orange, fontSize: 9 }}>◆</span>
              <span style={{ fontSize: 11, letterSpacing: 4, color: C.orange, fontWeight: 700, fontFamily: F }}>SELECT TRANSMISSION</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 9, letterSpacing: 3, color: C.dim, fontFamily: F }}>
                  {selectedFlight?.callsign} — CHOOSE ACTION OR COMPOSE CUSTOM
                </span>
                {pttTransmitting && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, animation: "pulse-opacity 0.8s ease-in-out infinite" }}/>
                    <span style={{ fontSize: 9, color: C.green, letterSpacing: 2, fontFamily: F }}>
                      {pttPhase === "atc" ? "SKYNET II CONTROL TRANSMITTING" : "PILOT RESPONDING"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div onClick={() => { setPttOpen(false); setPttOptions(null); }} style={{ cursor: "pointer", color: C.dim, fontSize: 14, fontFamily: F }}>✕</div>
          </div>

          <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
            {(getPTTOptions(selectedFlight?.id) || [{ display: "LOADING OPTIONS..." }, { display: "" }, { display: "" }]).map((opt, i) => (
              <div key={i}
                onClick={() => {
                  if (opt?.display) {
                    setPttSelected(i);
                    setPttEncoded(null);
                    setPttDebug(opt);
                  }
                }}
                style={{
                  flex: 1, border: `1px solid ${pttSelected === i ? C.orange : C.border}`,
                  padding: "12px 14px", cursor: opt ? "pointer" : "default",
                  background: pttSelected === i ? "rgba(255,140,0,0.08)" : "rgba(0,212,255,0.03)",
                  transition: "all 0.2s",
                }}>
                <div style={{ fontSize: 8, color: pttSelected === i ? C.orange : C.dim, letterSpacing: 3, fontFamily: F, marginBottom: 8 }}>OPTION {i + 1}</div>
                <div style={{ fontSize: 10, color: pttSelected === i ? C.bright : C.text, fontFamily: F, lineHeight: 1.6, letterSpacing: 1 }}>
                  {opt?.display || "—"}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 16px 12px" }}>
            <span style={{ fontSize: 9, color: C.dim, letterSpacing: 3, fontFamily: F, flexShrink: 0 }}>CUSTOM:</span>
            <input
              value={pttCustom}
              onChange={e => { setPttCustom(e.target.value); setPttSelected(null); setPttEncoded(null); }}
              placeholder="TYPE CUSTOM ACTION..."
              style={{
                flex: 1, background: "transparent", border: `1px solid ${C.border}`,
                color: C.bright, fontSize: 10, padding: "6px 10px", fontFamily: F,
                letterSpacing: 1, outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = C.cyan}
              onBlur={e  => e.target.style.borderColor = C.border}
            />
            <button
              onClick={handleEncode}
              disabled={!pttCustom.trim() || pttEncoding}
              style={{
                background: "transparent",
                border: `1px solid ${pttCustom.trim() ? C.cyan : C.dim}`,
                color: pttCustom.trim() ? C.cyan : C.dim,
                fontSize: 9, letterSpacing: 4, padding: "6px 16px",
                fontFamily: F, cursor: pttCustom.trim() ? "pointer" : "not-allowed",
                opacity: pttCustom.trim() ? 1 : 0.4,
              }}>
              {pttEncoding ? "ENCODING..." : "ENCODE"}
            </button>
            <button
              onClick={handleTransmit}
              disabled={(pttSelected === null && !pttEncoded) || pttTransmitting}
              style={{
                background: "transparent",
                border: `1px solid ${(pttSelected !== null || pttEncoded) && !pttTransmitting ? C.green : C.dim}`,
                color: (pttSelected !== null || pttEncoded) && !pttTransmitting ? C.green : C.dim,
                fontSize: 9, letterSpacing: 4, padding: "6px 16px",
                fontFamily: F,
                cursor: (pttSelected !== null || pttEncoded) && !pttTransmitting ? "pointer" : "not-allowed",
                opacity: (pttSelected !== null || pttEncoded) ? 1 : 0.4,
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}>
              {pttTransmitting
                ? pttPhase === "atc" ? "ATC..." : "PILOT..."
                : "▶▶ TRANSMIT"}
            </button>
          </div>
        </div>
      )}


      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", gap: 1 }}>

        {/* LEFT COLUMN */}
        <div style={{ width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <Panel title="CONTACT ROSTER" style={{ flex: 1 }}>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {flights.slice(0, 30).map((f, i) => {
                const isScanning = (tick + i) % 15 === 0;
                return (
                  <div key={f.id} onClick={() => selectFlight(f)} style={{
                    display: "flex", padding: "2px 8px", fontSize: 9,
                    borderBottom: "1px solid rgba(13,58,90,0.28)", cursor: "pointer", gap: 6,
                    background: selectedFlight?.id === f.id
                      ? "rgba(0,212,255,0.06)"
                      : isScanning ? "rgba(0,212,255,0.04)" : "transparent",
                    transition: "background 0.3s",
                  }}>
                    <span style={{ fontSize: 8, color: f.anomaly ? C.orange : C.dim, fontFamily: F, flexShrink: 0, letterSpacing: 1 }}>{f.anomaly ? "ALERT" : "OK"}</span>
                    <span style={{ flex: 2, color: f.anomaly ? C.orange : C.bright, letterSpacing: 1, fontFamily: F }}>{f.callsign}</span>
                    <span style={{ flex: 1, color: C.dim, fontSize: 8, fontFamily: F }}>{f.alt ? Math.round(f.alt * 0.3048).toLocaleString() : "—"}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
          <DataStreamPanel flights={flights} />
        </div>

        {/* CENTER COLUMN */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, overflow: "hidden" }}>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <GlobeRenderer flights={flights} selectedFlight={selectedFlight} onSelectFlight={selectFlight} />
          </div>
          <div style={{ height: 260, flexShrink: 0, display: "flex", gap: 1 }}>
            <AnomalyTable
              anomalies={anomalies}
              selectedFlight={selectedFlight}
              onSelect={selectFlight}
            />
            <div style={{ flex: 1, border: `1px solid ${C.border}`, background: C.panel, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "3px 8px", background: "rgba(255,80,0,0.07)", borderBottom: `1px solid ${C.border}`, flexShrink: 0, height: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 9, letterSpacing: 3, color: C.orange, fontWeight: 600, fontFamily: F }}>AI BRIEFING</span>
                {isAnalyzing && (
                  <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: C.orange,
                        animation: `pulse-opacity 1.2s ease-in-out ${i * 0.3}s infinite`,
                      }}/>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, padding: "6px 8px", overflowY: "auto" }}>
                {!selectedFlight ? (
                  <div style={{ fontSize: 9, color: C.dim, letterSpacing: 2, fontFamily: F, lineHeight: 2.2 }}>
                    SELECT A CONTACT<br />TO GENERATE<br />BRIEFING
                  </div>
                ) : isAnalyzing ? (
                  <div style={{ padding: "8px 0" }}>
                    {["SITUATION","ASSESSMENT","ACTION REQUIRED"].map((section, si) => (
                      <div key={si} style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 8, color: C.orange, letterSpacing: 3, fontFamily: F, fontWeight: 700, marginBottom: 6 }}>
                          {section}
                        </div>
                        {[80, 65, 90].slice(0, si === 1 ? 3 : 2).map((w, i) => (
                          <div key={i} style={{
                            height: 7, borderRadius: 2, marginBottom: 5,
                            width: `${w}%`,
                            background: "rgba(0,212,255,0.08)",
                            position: "relative", overflow: "hidden",
                          }}>
                            <div style={{
                              position: "absolute", top: 0, bottom: 0, width: "40%",
                              background: `linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent)`,
                              animation: `shimmer 1.5s ease-in-out ${i * 0.2 + si * 0.4}s infinite`,
                            }}/>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : getAnalysis(selectedFlight?.id) ? (
                  <div style={{ fontSize: 9, lineHeight: 1.8, fontFamily: F }}>
                    {getAnalysis(selectedFlight.id).split("\n").map((line, i) => {
                      const upper  = line.trim().toUpperCase();
                      const isHead = upper.startsWith("SITUATION") || upper.startsWith("ASSESSMENT") || upper.startsWith("ACTION");
                      if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
                      if (isHead) {
                        const colonIdx = line.indexOf(":");
                        const heading  = colonIdx > -1 ? line.slice(0, colonIdx).toUpperCase() : upper;
                        const body     = colonIdx > -1 ? line.slice(colonIdx + 1).trim() : "";
                        return (
                          <div key={i} style={{ marginTop: 10 }}>
                            <div style={{ color: C.orange, fontWeight: 700, letterSpacing: 3, fontFamily: F, marginBottom: 3 }}>
                              {heading}
                            </div>
                            {body && (
                              <div style={{ color: C.cyan, letterSpacing: 1, fontFamily: F }}>
                                {body.toUpperCase()}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div key={i} style={{ color: C.cyan, letterSpacing: 1, fontFamily: F }}>
                          {upper}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <button onClick={() => analyze(selectedFlight)} style={{
                    background: "rgba(255,140,0,0.08)", border: `1px solid ${C.orange}`,
                    color: C.orange, fontSize: 9, letterSpacing: 3, padding: "5px 12px",
                    fontFamily: F, cursor: "pointer", width: "100%",
                  }}>
                    RUN AI ANALYSIS
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ width: 230, flexShrink: 0, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column", gap: 1,
            transform: selectedFlight ? "translateX(-105%)" : "translateX(0)",
            transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            overflowY: "auto",
          }}>
            <Panel title="DATA STREAM" style={{ height: 52, flexShrink: 0 }}>
              <div style={{ padding: "3px 7px", fontSize: 8, color: C.dim, letterSpacing: 1, lineHeight: 1.6, fontFamily: F }}>
                <span style={{ color: C.orange }}>MW</span>
                <span style={{ color: C.cyan }}>GUV4WVL</span>
                Q6USAH4RYGASV4Z
              </div>
            </Panel>
            <Panel title="SYSTEM STATUS" style={{ flexShrink: 0 }}>
              <div style={{ padding: "4px 8px", fontSize: 9, fontFamily: F }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ color: C.dim, letterSpacing: 2 }}>SURVEILLANCE</span>
                  <span style={{ color: C.green, letterSpacing: 2 }}>ACTIVE</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ color: C.dim, letterSpacing: 2 }}>DATA LINK</span>
                  <span style={{ color: loading ? C.orange : C.green, letterSpacing: 2 }}>{loading ? "SYNCING" : "ONLINE"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ color: C.dim, letterSpacing: 2 }}>CONTACTS</span>
                  <span style={{ color: C.bright, letterSpacing: 2 }}>{flights.length}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.dim, letterSpacing: 2 }}>ANOMALIES</span>
                  <span style={{ color: C.orange, letterSpacing: 2 }}>{anomalies.length}</span>
                </div>
              </div>
            </Panel>
            <MainframeStatus flights={flights} barVals={barVals} />
            <div style={{ flex: 1, border: `1px solid ${C.border}`, background: "#020810", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 18 }}>
              <div style={{ fontSize: 34, opacity: 0.08, color: C.cyan }}>◎</div>
              <div style={{ fontSize: 9, color: "rgba(0,140,170,0.22)", letterSpacing: 3, textAlign: "center", lineHeight: 2.2, fontFamily: F }}>
                CLICK A CONTACT<br />ON THE GLOBE OR<br />ANOMALY LIST TO<br />BEGIN INTERROGATION
              </div>
            </div>
          </div>

          <div style={{
            position: "absolute", inset: 0,
            transform: selectedFlight ? "translateX(0)" : "translateX(105%)",
            transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            overflowY: "auto",
          }}>
            <ContactPanel
              flight={selectedFlight}
              barVals={barVals}
              analysis={getAnalysis(selectedFlight?.id)}
              isAnalyzing={isAnalyzing}
              onAnalyze={() => analyze(selectedFlight)}
              onClose={closeFlight}
            />
          </div>
        </div>

      </div>
    </div>
  );
}