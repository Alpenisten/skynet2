import { useRef, useEffect } from "react";
import { C } from "../../constants/theme";

export default function WaveForm() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let t = 0;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      [
        { amp: 12, freq: 0.08, speed: 0.07, y: h * 0.25, color: C.cyan,   alpha: 0.7 },
        { amp: 8,  freq: 0.12, speed: 0.11, y: h * 0.50, color: C.orange, alpha: 0.5 },
        { amp: 6,  freq: 0.06, speed: 0.05, y: h * 0.75, color: C.cyan,   alpha: 0.3 },
      ].forEach(({ amp, freq, speed, y, color, alpha }) => {
        ctx.beginPath();
        ctx.strokeStyle   = color;
        ctx.globalAlpha   = alpha;
        ctx.lineWidth     = 1;
        for (let x = 0; x < w; x++) {
          const val = amp * Math.sin(freq * x + t * speed * 10);
          x === 0 ? ctx.moveTo(x, y + val) : ctx.lineTo(x, y + val);
        }
        ctx.stroke();
      });

      ctx.globalAlpha = 1;
      t++;
    };

    const id = setInterval(draw, 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return <canvas ref={ref} style={{ width: "100%", height: 60, display: "block" }} />;
}