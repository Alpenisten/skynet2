import * as THREE from "three";

let cachedTexture = null;

export function createEarthTexture() {
  if (cachedTexture) return cachedTexture;

  const loader  = new THREE.TextureLoader();
  const texture = loader.load(
    "https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74117/world.200408.3x5400x2700.jpg",
    () => { cachedTexture = texture; },
    undefined,
    () => {
      // Fallback om NASA-servern blockerar — canvas-textur
      cachedTexture = buildCanvasTexture();
    }
  );
  return texture;
}

function buildCanvasTexture() {
  const cv  = document.createElement("canvas");
  cv.width  = 2048; cv.height = 1024;
  const ctx = cv.getContext("2d");
  const og  = ctx.createRadialGradient(1024, 512, 100, 1024, 512, 900);
  og.addColorStop(0, "#020d1f"); og.addColorStop(1, "#000508");
  ctx.fillStyle = og; ctx.fillRect(0, 0, 2048, 1024);

  const toXY = (lon, lat) => [((lon + 180) / 360) * 2048, ((90 - lat) / 180) * 1024];
  const land = (pts) => {
    ctx.beginPath();
    pts.forEach(([lon, lat], i) => { const [x, y] = toXY(lon, lat); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.closePath();
    ctx.fillStyle = "#0a2040"; ctx.fill();
    ctx.strokeStyle = "#1a6a9a"; ctx.lineWidth = 1.5; ctx.stroke();
  };
  land([[-10,36],[30,36],[40,45],[35,50],[28,55],[25,60],[30,65],[20,70],[10,72],[0,68],[-5,60],[-10,50],[-10,36]]);
  land([[-18,15],[-18,5],[-10,-5],[0,-10],[10,-35],[20,-35],[35,-28],[40,-15],[50,12],[45,12],[42,15],[38,20],[30,30],[25,37],[10,38],[0,32],[-5,25],[-18,15]]);
  land([[-170,72],[-140,72],[-100,75],[-80,73],[-65,65],[-55,50],[-55,45],[-68,44],[-72,42],[-75,35],[-80,28],[-88,20],[-90,18],[-95,20],[-100,25],[-110,28],[-120,32],[-125,38],[-130,55],[-140,60],[-155,60],[-165,65],[-170,72]]);
  land([[-80,12],[-75,12],[-60,10],[-50,5],[-35,-5],[-35,-15],[-40,-25],[-50,-35],[-55,-55],[-70,-55],[-75,-50],[-78,-40],[-80,-30],[-80,-15],[-78,-5],[-80,5],[-80,12]]);
  land([[30,38],[40,38],[55,25],[65,25],[75,20],[80,15],[90,22],[100,20],[105,15],[110,5],[120,20],[130,35],[140,40],[145,45],[140,55],[130,60],[120,70],[100,75],[80,73],[60,70],[50,65],[40,60],[35,55],[30,45],[30,38]]);
  land([[115,-22],[125,-16],[135,-15],[145,-18],[152,-25],[150,-38],[143,-39],[130,-34],[115,-34],[112,-26],[115,-22]]);

  ctx.strokeStyle = "rgba(0,140,190,0.18)"; ctx.lineWidth = 0.6;
  for (let lat = -80; lat <= 80; lat += 20) { const [, y] = toXY(0, lat); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2048, y); ctx.stroke(); }
  for (let lon = -180; lon <= 180; lon += 20) { const [x] = toXY(lon, 0); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1024); ctx.stroke(); }

  return new THREE.CanvasTexture(cv);
}