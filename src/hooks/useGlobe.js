import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";

export function useGlobe(mountRef) {
  const rendererRef   = useRef(null);
  const sceneRef      = useRef(null);
  const cameraRef     = useRef(null);
  const globeRef      = useRef(null);
  const animFrameRef  = useRef(null);

  // Mus-interaktion
  const isDragging    = useRef(false);
  const lastMouse     = useRef({ x: 0, y: 0 });
  const rotVelocity   = useRef({ x: 0, y: 0 });
  const currentZoom   = useRef(3.5);
  const targetZoom    = useRef(3.5);
  const autoRotate    = useRef(true);
  const resumeTimer   = useRef(null);

  const scheduleResume = useCallback(() => {
    autoRotate.current = false;
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      autoRotate.current = true;
    }, 4000);
  }, []);

  const onMouseDown = useCallback((e) => {
    isDragging.current  = true;
    lastMouse.current   = { x: e.clientX, y: e.clientY };
    rotVelocity.current = { x: 0, y: 0 };
    scheduleResume();
  }, [scheduleResume]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !globeRef.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    rotVelocity.current = { x: dy * 0.005, y: dx * 0.005 };
    globeRef.current.rotation.x += rotVelocity.current.x;
    globeRef.current.rotation.y += rotVelocity.current.y;
  }, []);

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const onWheel = useCallback((e) => {
    targetZoom.current = Math.max(1.5, Math.min(8, targetZoom.current + e.deltaY * 0.003));
    scheduleResume();
  }, [scheduleResume]);

  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    // Scene
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.z = currentZoom.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mount.appendChild(renderer.domElement);

    // Globe
    const globe = new THREE.Group();
    scene.add(globe);

    // Ljus
    scene.add(new THREE.AmbientLight(0x334466, 2));
    const sun = new THREE.DirectionalLight(0x6699ff, 1.2);
    sun.position.set(5, 3, 5);
    scene.add(sun);

    // Atmosfär
    const atmGeo = new THREE.SphereGeometry(1.06, 64, 64);
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x0044aa, transparent: true, opacity: 0.08,
      side: THREE.FrontSide, depthWrite: false,
    });
    globe.add(new THREE.Mesh(atmGeo, atmMat));

    sceneRef.current  = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    globeRef.current  = globe;

    // Animationsloop
    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      if (autoRotate.current && !isDragging.current) {
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
    animFrameRef.current = frame;

    // Resize
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
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [mountRef]);

  return {
    globeRef,
    cameraRef,
    targetZoom,
    scheduleResume,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel,
  };
}