import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

export function useGlobe(mountRef) {
  const rendererRef  = useRef(null);
  const sceneRef     = useRef(null);
  const cameraRef    = useRef(null);
  const globeRef     = useRef(null);

  const isDragging   = useRef(false);
  const lastMouse    = useRef({ x: 0, y: 0 });
  const rotVelocity  = useRef({ x: 0, y: 0 });
  const currentZoom  = useRef(3.5);
  const targetZoom   = useRef(3.5);
  const autoRotate   = useRef(true);   // false = rotation stoppad
  const resumeTimer  = useRef(null);

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeTimer.current);
    // Återuppta BARA om autoRotate inte är låst av selectedFlight
    resumeTimer.current = setTimeout(() => {
      if (autoRotate.current !== "locked") autoRotate.current = true;
    }, 4000);
  }, []);

  const onMouseDown = useCallback((e) => {
    isDragging.current  = true;
    lastMouse.current   = { x: e.clientX, y: e.clientY };
    rotVelocity.current = { x: 0, y: 0 };
  }, []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !globeRef.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current   = { x: e.clientX, y: e.clientY };
    rotVelocity.current = { x: dy * 0.005, y: dx * 0.005 };
    globeRef.current.rotation.x += rotVelocity.current.x;
    globeRef.current.rotation.y += rotVelocity.current.y;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onWheel = useCallback((e) => {
    targetZoom.current = Math.max(1.5, Math.min(8, targetZoom.current + e.deltaY * 0.003));
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = currentZoom.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    sceneRef.current    = scene;
    cameraRef.current   = camera;
    rendererRef.current = renderer;
    globeRef.current    = globe;

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);

      // Rotera bara om autoRotate är true (inte false och inte "locked")
      if (autoRotate.current === true && !isDragging.current) {
        globe.rotation.y += 0.0008;
      }

      if (!isDragging.current) {
        rotVelocity.current.x *= 0.92;
        rotVelocity.current.y *= 0.92;
        globe.rotation.x += rotVelocity.current.x;
        globe.rotation.y += rotVelocity.current.y;
      }

      currentZoom.current += (targetZoom.current - currentZoom.current) * 0.08;
      camera.position.z = currentZoom.current;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [mountRef]);

  return {
    globeRef, cameraRef, rendererRef,
    targetZoom, autoRotate, scheduleResume,
    onMouseDown, onMouseMove, onMouseUp, onWheel,
  };
}