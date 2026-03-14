import { useRef, useEffect, useMemo } from "react";
import * as THREE                      from "three";
import { useGlobe }                    from "../../hooks/useGlobe";
import { createEarthTexture }          from "./EarthTexture";
import { C, F }                        from "../../constants/theme";

function latLonToVec3(lat, lon, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta)
  );
}

export default function GlobeRenderer({ flights, selectedFlight, onSelectFlight }) {
  const mountRef   = useRef(null);
  const dotsRef    = useRef([]);
  const { globeRef, onMouseDown, onMouseMove, onMouseUp, onWheel, targetZoom, scheduleResume } = useGlobe(mountRef);
  const [scanLine, setScanLine] = [useRef(0), null];

  // Bygg jordklotet en gång
  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;

    const texture  = createEarthTexture();
    const geo      = new THREE.SphereGeometry(1, 64, 64);
    const mat      = new THREE.MeshPhongMaterial({ map: texture, specular: new THREE.Color(0x113355), shininess: 18 });
    const sphere   = new THREE.Mesh(geo, mat);
    globe.add(sphere);

    return () => {
      globe.remove(sphere);
      geo.dispose(); mat.dispose();
    };
  }, [globeRef]);

  // Rita flygpunkter när flights ändras
  useEffect(() => {
    if (!globeRef.current) return;
    const globe = globeRef.current;

    // Rensa gamla dots
    dotsRef.current.forEach(({ mesh }) => {
      globe.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    dotsRef.current = [];

    flights.forEach(f => {
      const pos  = latLonToVec3(f.lat, f.lon, 1.012);
      const size = f.anomaly ? 0.014 : 0.008;
      const color = f.anomaly ? 0xff8c00 : 0x00d4ff;
      const geo  = new THREE.SphereGeometry(size, 6, 6);
      const mat  = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      mesh.userData = { flight: f };
      globe.add(mesh);
      dotsRef.current.push({ mesh, flight: f });
    });
  }, [flights, globeRef]);

  // Klick på dot
  const handleClick = (e) => {
    if (!mountRef.current || !globeRef.current) return;
    const rect   = mountRef.current.getBoundingClientRect();
    const mouse  = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width)  * 2 - 1,
      -((e.clientY - rect.top)  / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, globeRef.current.parent?.children[0] ?? new THREE.Camera());

    const meshes = dotsRef.current.map(d => d.mesh);
    const hits   = raycaster.intersectObjects(meshes);
    if (hits.length > 0) {
      onSelectFlight(hits[0].object.userData.flight);
      targetZoom.current = 2.2;
      scheduleResume();
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#020810", overflow: "hidden" }}>
      {flights.length === 0 && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(2,8,16,0.85)",
        }}>
          <span style={{ fontSize: 13, letterSpacing: 6, color: C.cyan, fontFamily: F }}>
            ACQUIRING SATELLITE LINK...
          </span>
        </div>
      )}

      {selectedFlight && (
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 10, background: "rgba(200,100,0,0.85)", border: `1px solid ${C.orange}`,
          padding: "4px 20px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 13, letterSpacing: 5, color: "#fff", fontWeight: 700, fontFamily: F }}>TRACKING</span>
          <span style={{ fontSize: 10, color: C.cyan, letterSpacing: 3, fontFamily: F }}>{selectedFlight.callsign}</span>
        </div>
      )}

      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", cursor: "crosshair" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        onClick={handleClick}
      />

      {/* Hörnmarkeringar */}
      {[["t","l"],["t","r"],["b","l"],["b","r"]].map(([v, h]) => (
        <div key={v+h} style={{
          position: "absolute", width: 18, height: 18, pointerEvents: "none",
          top: v === "t" ? 8 : undefined, bottom: v === "b" ? 8 : undefined,
          left: h === "l" ? 8 : undefined, right: h === "r" ? 8 : undefined,
          borderTop:    v === "t" ? "1px solid rgba(0,212,255,0.45)" : undefined,
          borderBottom: v === "b" ? "1px solid rgba(0,212,255,0.45)" : undefined,
          borderLeft:   h === "l" ? "1px solid rgba(0,212,255,0.45)" : undefined,
          borderRight:  h === "r" ? "1px solid rgba(0,212,255,0.45)" : undefined,
        }} />
      ))}

      <div style={{
        position: "absolute", bottom: 9, left: "50%", transform: "translateX(-50%)",
        fontSize: 8, color: "rgba(0,180,200,0.3)", letterSpacing: 3, whiteSpace: "nowrap", fontFamily: F,
      }}>
        DRAG · SCROLL TO ZOOM · CLICK CONTACT
      </div>
    </div>
  );
}
