import * as THREE from "three";

export function createEarthTexture() {
  const cv  = document.createElement("canvas");
  cv.width  = 2048;
  cv.height = 1024;
  const ctx = cv.getContext("2d");

  // Bakgrund
  const og = ctx.createRadialGradient(1024, 512, 100, 1024, 512, 900);
  og.addColorStop(0, "#020d1f");
  og.addColorStop(1, "#000508");
  ctx.fillStyle = og;
  ctx.fillRect(0, 0, 2048, 1024);

  const toXY = (lon, lat) => [((lon + 180) / 360) * 2048, ((90 - lat) / 180) * 1024];

  const land = (pts, glow = false) => {
    ctx.beginPath();
    pts.forEach(([lon, lat], i) => {
      const [x, y] = toXY(lon, lat);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.closePath();
    if (glow) { ctx.shadowColor = "#00aaff"; ctx.shadowBlur = 14; }
    const lg = ctx.createLinearGradient(0, 0, 0, 1024);
    lg.addColorStop(0, "#0a2040");
    lg.addColorStop(1, "#061428");
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = "#1a6a9a";
    ctx.lineWidth   = 1.5;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  };

  // Kontinenter
  land([[-10,36],[30,36],[40,45],[35,50],[28,55],[25,60],[30,65],[20,70],[10,72],[0,68],[-5,60],[-10,50],[-10,36]], true);
  land([[5,57],[8,58],[5,62],[5,68],[15,70],[28,72],[30,68],[25,65],[20,60],[15,58],[10,57],[5,57]]);
  land([[-6,50],[-3,50],[2,51],[0,53],[-2,56],[-5,58],[-8,56],[-6,52],[-6,50]]);
  land([[-18,15],[-18,5],[-10,-5],[0,-10],[10,-35],[20,-35],[35,-28],[40,-15],[50,12],[45,12],[42,15],[38,20],[30,30],[25,37],[10,38],[0,32],[-5,25],[-18,15]], true);
  land([[-170,72],[-140,72],[-100,75],[-80,73],[-65,65],[-55,50],[-55,45],[-68,44],[-72,42],[-75,35],[-80,28],[-88,20],[-90,18],[-95,20],[-100,25],[-110,28],[-120,32],[-125,38],[-130,55],[-140,60],[-155,60],[-165,65],[-170,72]], true);
  land([[-55,76],[-20,76],[-18,72],[-25,68],[-40,65],[-50,68],[-55,73],[-55,76]]);
  land([[-80,12],[-75,12],[-60,10],[-50,5],[-35,-5],[-35,-15],[-40,-25],[-50,-35],[-55,-55],[-70,-55],[-75,-50],[-78,-40],[-80,-30],[-80,-15],[-78,-5],[-80,5],[-80,12]], true);
  land([[30,38],[40,38],[55,25],[65,25],[75,20],[80,15],[90,22],[100,20],[105,15],[110,5],[120,20],[130,35],[140,40],[145,45],[140,55],[130,60],[120,70],[100,75],[80,73],[60,70],[50,65],[40,60],[35,55],[30,45],[30,38]], true);
  land([[115,-22],[125,-16],[135,-15],[145,-18],[152,-25],[150,-38],[143,-39],[130,-34],[115,-34],[112,-26],[115,-22]], true);

  // Stadsljus
  [[0,51],[2,48],[13,52],[4,52],[37,55],[28,41],[-74,40],[-87,41],[-118,34],[-122,37],[103,1],[114,22],[121,31],[139,35],[126,37],[77,28],[72,18],[88,22],[28,-26],[31,30],[55,25],[44,33]]
    .forEach(([lon, lat]) => {
      const [x, y] = toXY(lon, lat);
      const r = ctx.createRadialGradient(x, y, 0, x, y, 18);
      r.addColorStop(0, "rgba(80,180,255,0.55)");
      r.addColorStop(0.3, "rgba(40,120,200,0.18)");
      r.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = r;
      ctx.fillRect(x - 18, y - 18, 36, 36);
    });

  // Koordinatgrid
  ctx.strokeStyle = "rgba(0,140,190,0.18)";
  ctx.lineWidth   = 0.6;
  for (let lat = -80; lat <= 80; lat += 20) {
    const [, y] = toXY(0, lat);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke();
  }
  for (let lon = -180; lon <= 180; lon += 20) {
    const [x] = toXY(lon, 0);
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke();
  }

  return new THREE.CanvasTexture(cv);
}