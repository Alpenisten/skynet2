import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useGlobe } from "../../hooks/useGlobe";
import { C, F } from "../../constants/theme";

function latLonToVec3(lat, lon, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

function getTargetQuat(lat, lon) {
  const phi   = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;

  // Flygplanets position på enhetssfären
  const dotPos = new THREE.Vector3(
    -Math.sin(phi) * Math.cos(theta),
     Math.cos(phi),
     Math.sin(phi) * Math.sin(theta)
  ).normalize();

  // Vi vill rotera globen så dotPos hamnar vid +Z (mot kameran)
  // setFromUnitVectors(from, to) — rotera FROM dotPos TO +Z
  const toCamera = new THREE.Vector3(0, 0, 1);
  const baseQuat = new THREE.Quaternion().setFromUnitVectors(dotPos, toCamera);

  // Nu är punkten centrerad men nordpolen kan vara roterad
  // Hitta vart nordpolen (+Y) hamnar efter baseQuat
  const northAfter = new THREE.Vector3(0, 1, 0).applyQuaternion(baseQuat);

  // Projicera på XY-planet (ignorera Z) för att hitta roll-vinkeln
  const angle = Math.atan2(northAfter.x, northAfter.y);

  // Korrigera roll runt Z-axeln så nord pekar uppåt
  const rollFix = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1), angle
  );

  // Applicera roll-korrektionen EFTER basrotationen
  return rollFix.multiply(baseQuat);
}

// Skapar en canvas-overlay med inner shadow + outer glow
// som ligger ovanpå Three.js-canvasen som en HTML-div
function GlobeOverlay() {
  return (
    <div style={{
      position: "absolute", inset: 0,
      pointerEvents: "none", zIndex: 5,
      background: `
        radial-gradient(ellipse at 85% 50%,
          rgba(0,0,0,0) 30%,
          rgba(0,5,20,0.55) 65%,
          rgba(0,0,10,0.85) 100%
        )
      `,
    }}>
      {/* Yttre backlit glow — vänster kant */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse at -5% 50%,
            rgba(0,180,255,0.22) 0%,
            rgba(0,100,200,0.10) 30%,
            rgba(0,0,0,0) 60%
          )
        `,
      }}/>
    </div>
  );
}

export default function GlobeRenderer({ flights, selectedFlight, onSelectFlight }) {
  const mountRef = useRef(null);
  const dotsRef  = useRef([]);

  const {
    globeRef, cameraRef, autoRotate,
    targetZoom, scheduleResume,
    onMouseDown, onMouseMove, onMouseUp, onWheel,
  } = useGlobe(mountRef);

  // ── Jordklot + textur ────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const globe  = globeRef.current;
    const loader = new THREE.TextureLoader();

    loader.load("/earth.jpg", (texture) => {

      // Ren textur utan tint
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshPhongMaterial({
          map:       texture,
          specular:  new THREE.Color(0x111111),
          shininess: 8,
        })
      );
      sphere.userData.isEarth = true;
      globe.add(sphere);

      // Koordinatgrid — dubbelt så tätt (var 10:e grad istället för 20:e)
      const gridCanvas  = document.createElement("canvas");
      gridCanvas.width  = 2048;
      gridCanvas.height = 1024;
      const gCtx        = gridCanvas.getContext("2d");
      const toXY        = (lon, lat) => [((lon + 180) / 360) * 2048, ((90 - lat) / 180) * 1024];

      gCtx.strokeStyle = "rgba(0,180,220,0.20)";
      gCtx.lineWidth   = 0.6;
      for (let lat = -80; lat <= 80; lat += 10) {
        const [, y] = toXY(0, lat);
        gCtx.beginPath(); gCtx.moveTo(0, y); gCtx.lineTo(2048, y); gCtx.stroke();
      }
      for (let lon = -180; lon <= 180; lon += 10) {
        const [x] = toXY(lon, 0);
        gCtx.beginPath(); gCtx.moveTo(x, 0); gCtx.lineTo(x, 1024); gCtx.stroke();
      }
      // Ekvatorn tydligare
      gCtx.strokeStyle = "rgba(0,220,255,0.40)";
      gCtx.lineWidth   = 1.0;
      const [, eqY] = toXY(0, 0);
      gCtx.beginPath(); gCtx.moveTo(0, eqY); gCtx.lineTo(2048, eqY); gCtx.stroke();

      const gridMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.003, 64, 64),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(gridCanvas),
          transparent: true, depthWrite: false,
        })
      );
      gridMesh.userData.isEarth = true;
      globe.add(gridMesh);

      // Tunn cyan atmosfärhinna längs kanten
      const atm = new THREE.Mesh(
        new THREE.SphereGeometry(1.025, 64, 64),
        new THREE.MeshPhongMaterial({
          color: 0x0088ff, transparent: true,
          opacity: 0.08, side: THREE.FrontSide, depthWrite: false,
        })
      );
      atm.userData.isEarth = true;
      globe.add(atm);
    });

    return () => {
      globe.children
        .filter(c => c.userData.isEarth)
        .forEach(c => { globe.remove(c); c.geometry?.dispose(); c.material?.dispose(); });
    };
  }, [globeRef]);

  // ── Ljussättning — ingen gradient på texturen ────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const scene = globeRef.current.parent;
    if (!scene) return;

    // Svagt ambient så natt-sidan inte är helt svart
    const ambient = new THREE.AmbientLight(0x223355, 1.2);
    ambient.userData.isSkynetLight = true;
    scene.add(ambient);

    // Huvudljus från höger — sol-liknande
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(4, 2, 3);
    sun.userData.isSkynetLight = true;
    scene.add(sun);

    return () => {
      scene.children
        .filter(c => c.userData.isSkynetLight)
        .forEach(c => scene.remove(c));
    };
  }, [globeRef]);

  // ── Flygpunkter ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;
    dotsRef.current.forEach(({ mesh }) => {
      globe.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose();
    });
    dotsRef.current = [];

    flights.forEach(f => {
      const pos  = latLonToVec3(f.lat, f.lon, 1.012);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(f.anomaly ? 0.014 : 0.008, 6, 6),
        new THREE.MeshBasicMaterial({ color: f.anomaly ? 0xff8c00 : 0x00d4ff })
      );
      mesh.position.copy(pos);
      mesh.userData = { flight: f };
      globe.add(mesh);
      dotsRef.current.push({ mesh });
    });
  }, [flights, globeRef]);

  // ── Centrera + stoppa rotation vid valt flygplan ─────────────────────────
useEffect(() => {
    if (!globeRef.current) return;
    if (selectedFlight) {
      autoRotate.current = "locked";
      const globe  = globeRef.current;
      const target = getTargetQuat(selectedFlight.lat, selectedFlight.lon);
      const from   = globe.quaternion.clone();

      // Verifiera — vart hamnar flygplanspunkten efter rotation?
      const phi   = (90 - selectedFlight.lat) * Math.PI / 180;
      const theta = (selectedFlight.lon + 180) * Math.PI / 180;
      const dotPos = new THREE.Vector3(
        -Math.sin(phi) * Math.cos(theta),
         Math.cos(phi),
         Math.sin(phi) * Math.sin(theta)
      );
      const rotated = dotPos.clone().applyQuaternion(target);
      
      let start = null;
      const anim = (ts) => {
        if (!start) start = ts;
        const t    = Math.min((ts - start) / 1000, 1);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        globe.quaternion.slerpQuaternions(from, target, ease);
        if (t < 1) requestAnimationFrame(anim);
      };
      requestAnimationFrame(anim);
      targetZoom.current = 2.2;
    } else {
      autoRotate.current = true;
      targetZoom.current = 3.5;
    }
  }, [selectedFlight, globeRef, autoRotate, targetZoom]);

  // ── Klick ────────────────────────────────────────────────────────────────
  const handleClick = (e) => {
    if (!mountRef.current || !globeRef.current || !cameraRef.current) return;
    const rect  = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);
    const hits = raycaster.intersectObjects(dotsRef.current.map(d => d.mesh), false);
    if (hits.length > 0) {
      const f = hits[0].object.userData.flight;
      onSelectFlight(f);
    } else {
      onSelectFlight(null);
      autoRotate.current = true;
      targetZoom.current = 3.5;
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#010610", overflow: "hidden" }}>

      {/* Three.js canvas */}
      <div ref={mountRef}
        style={{ width: "100%", height: "100%", cursor: "crosshair" }}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onWheel={onWheel} onClick={handleClick}
      />

      {/* HTML-overlay: inner shadow + backlit glow som CSS */}
      <GlobeOverlay />

      {flights.length === 0 && (
        <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(2,8,16,0.85)" }}>
          <span style={{ fontSize: 13, letterSpacing: 6, color: C.cyan, fontFamily: F }}>ACQUIRING SATELLITE LINK...</span>
        </div>
      )}

      {selectedFlight && (
        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "rgba(200,100,0,0.85)", border: `1px solid ${C.orange}`, padding: "4px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, letterSpacing: 5, color: "#fff", fontWeight: 700, fontFamily: F }}>TRACKING</span>
          <span style={{ fontSize: 10, color: C.cyan, letterSpacing: 3, fontFamily: F }}>{selectedFlight.callsign}</span>
        </div>
      )}

      {[["t","l"],["t","r"],["b","l"],["b","r"]].map(([v,h]) => (
        <div key={v+h} style={{
          position: "absolute", width: 18, height: 18, pointerEvents: "none", zIndex: 6,
          top: v==="t"?8:undefined, bottom: v==="b"?8:undefined,
          left: h==="l"?8:undefined, right: h==="r"?8:undefined,
          borderTop:    v==="t"?"1px solid rgba(0,212,255,0.45)":undefined,
          borderBottom: v==="b"?"1px solid rgba(0,212,255,0.45)":undefined,
          borderLeft:   h==="l"?"1px solid rgba(0,212,255,0.45)":undefined,
          borderRight:  h==="r"?"1px solid rgba(0,212,255,0.45)":undefined,
        }}/>
      ))}

      <div style={{ position: "absolute", bottom: 9, left: "50%", transform: "translateX(-50%)", fontSize: 8, color: "rgba(0,180,200,0.3)", letterSpacing: 3, whiteSpace: "nowrap", fontFamily: F, zIndex: 6 }}>
        DRAG · SCROLL TO ZOOM · CLICK CONTACT
      </div>
    </div>
  );
}