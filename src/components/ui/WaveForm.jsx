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
      ctx.clearRect(0, 0, 80, 80);
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth   = 1;

      [
        { amp: 12, freq: 0.08, speed: 0.07, y: 20, color: C.cyan,   alpha: 0.7 },
        { amp: 8,  freq: 0.12, speed: 0.11, y: 40, color: C.orange, alpha: 0.5 },
        { amp: 6,  freq: 0.06, speed: 0.05, y: 60, color: C.cyan,   alpha: 0.3 },
      ].forEach(({ amp, freq, speed, y, color, alpha }) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha;
        for (let x = 0; x < 80; x++) {
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

  return <canvas ref={ref} width={80} height={80} style={{ width: 80, height: 80 }} />;
}