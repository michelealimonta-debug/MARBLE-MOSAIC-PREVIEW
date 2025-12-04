import React, { useRef, useEffect, useState } from 'react';
import { Maximize2, X, ZoomIn } from 'lucide-react';

interface MosaicCanvasProps {
  imageSrc: string | null;
  widthCm: number;
  heightCm: number;
  showGrid: boolean;
  groutColor: string;
  onRenderComplete?: () => void;
}

// Simple Perlin Noise implementation for natural stone procedural generation
class Perlin {
    private p: number[];
    constructor() {
        this.p = new Array(512);
        const permutation = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
        190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,
        68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
        102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,
        173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
        223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,
        232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,
        49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,
        141,128,195,78,66,215,61,156,180];
        
        for (let i = 0; i < 256; i++) this.p[256 + i] = this.p[i] = permutation[i];
    }

    fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t: number, a: number, b: number) { return a + t * (b - a); }
    grad(hash: number, x: number, y: number, z: number) {
        const h = hash & 15;
        const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x: number, y: number, z: number) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        const u = this.fade(x), v = this.fade(y), w = this.fade(z);
        const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;

        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),
            this.grad(this.p[BA], x - 1, y, z)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
                this.grad(this.p[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
                this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
                    this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
    }
}

// Generatore texture ad alta frequenza per dettagli nitidi nello zoom
const createHighResStoneTexture = (size: number = 2048): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const perlin = new Perlin();
  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  // Scala del rumore
  const baseScale = 0.003;
  const detailScale = 0.02;
  const veinScale = 0.012;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;

      // 1. Base Marble Noise (Low Frequency clouds)
      const n1 = perlin.noise(x * baseScale, y * baseScale, 0);
      
      // 2. Grain Noise (High Frequency)
      const n2 = perlin.noise(x * detailScale, y * detailScale, 10);
      
      // 3. Veins (Domain Warping or Ridge Noise)
      const warpX = x * veinScale + n1 * 20;
      const warpY = y * veinScale + n1 * 20;
      let vein = Math.abs(perlin.noise(warpX, warpY, 5));
      vein = Math.pow(1 - vein, 3); // Sharpen the veins

      // Compose Colors (Travertine/Beige Palette)
      let r = 232 + n1 * 20 + n2 * 10;
      let g = 230 + n1 * 20 + n2 * 10;
      let b = 227 + n1 * 20 + n2 * 10;

      // Apply Veins
      const VEIN_THRESHOLD = 0.45;
      
      if (vein > VEIN_THRESHOLD) {
          const veinIntensity = (vein - VEIN_THRESHOLD) * 2.5; // 0 to 1
          const veinR = 100; 
          const veinG = 95;
          const veinB = 90;
          
          r = r * (1 - veinIntensity * 0.6) + veinR * veinIntensity * 0.6;
          g = g * (1 - veinIntensity * 0.6) + veinG * veinIntensity * 0.6;
          b = b * (1 - veinIntensity * 0.6) + veinB * veinIntensity * 0.6;
      }

      // Add Pitting (Small dots/holes)
      if (Math.random() > 0.998) {
          const depth = Math.random();
          r -= 60 * depth;
          g -= 60 * depth;
          b -= 60 * depth;
      }

      data[i] = Math.min(255, Math.max(0, r));
      data[i+1] = Math.min(255, Math.max(0, g));
      data[i+2] = Math.min(255, Math.max(0, b));
      data[i+3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
};

const MosaicCanvas: React.FC<MosaicCanvasProps> = ({ 
    imageSrc, 
    widthCm, 
    heightCm, 
    showGrid, 
    groutColor,
    onRenderComplete 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lensCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [qualityLabel, setQualityLabel] = useState<string>("");
  const [qualityColor, setQualityColor] = useState<string>("text-stone-500");
  
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const LENS_SIZE = 240; 
  const ZOOM_FACTOR = 4;
  
  const stoneTextureRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
      if (!stoneTextureRef.current) {
          setTimeout(() => {
             stoneTextureRef.current = createHighResStoneTexture();
          }, 0);
      }
  }, []);

  useEffect(() => {
    const totalTiles = widthCm * heightCm;
    if (totalTiles < 3000) {
      setQualityLabel("Definition: Low / Artistic Effect");
      setQualityColor("text-amber-700");
    } else if (totalTiles < 15000) {
      setQualityLabel("Definition: Medium (Balanced)");
      setQualityColor("text-stone-600");
    } else {
      setQualityLabel("Definition: High (Detailed)");
      setQualityColor("text-emerald-700");
    }
  }, [widthCm, heightCm]);

  // Robust Hash function for noise that doesn't produce geometric artifacts on large integers
  const hash = (x: number, y: number) => {
    let h = 0x811c9dc5;
    h ^= x;
    h = Math.imul(h, 0x01000193);
    h ^= y;
    h = Math.imul(h, 0x01000193);
    return (h >>> 0) / 4294967296;
  };

  // Rendering Principale
  useEffect(() => {
    const renderTimeout = setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageSrc) {
            if (onRenderComplete) onRenderComplete();
            return;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
             if (onRenderComplete) onRenderComplete();
             return;
        }

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc;

        img.onload = () => {
          const tilesX = Math.floor(widthCm);
          const tilesY = Math.floor(heightCm);
          
          if (tilesX <= 0 || tilesY <= 0) {
              if (onRenderComplete) onRenderComplete();
              return;
          }

          const RENDER_SCALE = 20; 
          canvas.width = tilesX * RENDER_SCALE;
          canvas.height = tilesY * RENDER_SCALE;

          const offCanvas = document.createElement('canvas');
          offCanvas.width = tilesX;
          offCanvas.height = tilesY;
          const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
          if (!offCtx) {
              if (onRenderComplete) onRenderComplete();
              return;
          }

          const imgAspect = img.width / img.height;
          const canvasAspect = tilesX / tilesY;
          let renderX, renderY, renderW, renderH;

          if (imgAspect > canvasAspect) {
            renderH = tilesY;
            renderW = tilesY * imgAspect;
            renderX = (tilesX - renderW) / 2;
            renderY = 0;
          } else {
            renderW = tilesX;
            renderH = tilesX / imgAspect;
            renderX = 0;
            renderY = (tilesY - renderH) / 2;
          }

          offCtx.drawImage(img, renderX, renderY, renderW, renderH);
          const imageData = offCtx.getImageData(0, 0, tilesX, tilesY);
          const data = imageData.data;

          // SFONDO FUGA (Grout) - Updated with prop
          ctx.fillStyle = groutColor; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const stoneTex = stoneTextureRef.current;
          
          if (stoneTex) {
            const totalPixels = tilesX * tilesY;
            const simplifiedMode = totalPixels > 50000; 

            const gap = 1.5;
            const baseTileSize = RENDER_SCALE - gap;
            const cornerRadius = 2.5;

            for (let y = 0; y < tilesY; y++) {
                for (let x = 0; x < tilesX; x++) {
                    const i = (y * tilesX + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];

                    if (a < 20) continue;

                    let posX = x * RENDER_SCALE + (gap / 2);
                    let posY = y * RENDER_SCALE + (gap / 2);
                    let currentTileW = baseTileSize;
                    let currentTileH = baseTileSize;

                    if (!simplifiedMode) {
                        // NEW JITTER LOGIC:
                        // Using unique seeds for X, Y, W, H to avoid correlation
                        const seedX = hash(x, y);
                        const seedY = hash(y + 1000, x); // distinct seed
                        const seedW = hash(x * 123, y * 456);
                        const seedH = hash(y * 789, x * 321);

                        // Increased positional jitter to break grid lines completely
                        // +/- 2.5px on 20px grid is huge, but necessary for organic feel
                        const jX = (seedX - 0.5) * 3.5; 
                        const jY = (seedY - 0.5) * 3.5;

                        // Size jitter to avoid "perfect squares" pattern
                        const jW = (seedW - 0.5) * 2.0;
                        const jH = (seedH - 0.5) * 2.0;

                        posX += jX;
                        posY += jY;
                        currentTileW += jW;
                        currentTileH += jH;
                    }

                    // --- 1. FISICA DELLA LUCE (TILT) ---
                    const tileSeed = hash(x * 99, y * 99); 
                    const tiltFactor = 0.85 + (tileSeed * 0.3); 

                    const rBase = r * tiltFactor;
                    const gBase = g * tiltFactor;
                    const bBase = b * tiltFactor;
                    
                    ctx.fillStyle = `rgb(${rBase},${gBase},${bBase})`;

                    ctx.beginPath();
                    if (simplifiedMode) {
                        ctx.rect(posX, posY, currentTileW, currentTileH);
                    } else {
                        ctx.roundRect(posX, posY, currentTileW, currentTileH, cornerRadius);
                    }
                    ctx.fill();

                    // --- 2. TEXTURE MATERICA (OVERLAY) ---
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.globalAlpha = 0.75; 
                    
                    const tX = Math.floor(hash(x, y) * (stoneTex.width - currentTileW));
                    const tY = Math.floor(hash(y, x) * (stoneTex.height - currentTileH));
                    
                    ctx.drawImage(stoneTex, tX, tY, currentTileW, currentTileH, posX, posY, currentTileW, currentTileH);

                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1.0;

                    if (!simplifiedMode) {
                        // --- 3. VOLUME 3D (CHICLET EFFECT) ---
                        const shadowGrad = ctx.createLinearGradient(posX, posY, posX + currentTileW, posY + currentTileH);
                        shadowGrad.addColorStop(0.4, 'rgba(0,0,0,0)');
                        shadowGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
                        
                        ctx.fillStyle = shadowGrad;
                        ctx.beginPath();
                        ctx.roundRect(posX, posY, currentTileW, currentTileH, cornerRadius);
                        ctx.fill();

                        const lightGrad = ctx.createLinearGradient(posX, posY, posX + currentTileW/2, posY + currentTileH/2);
                        lightGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
                        lightGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
                        
                        ctx.fillStyle = lightGrad;
                        ctx.beginPath();
                        ctx.roundRect(posX, posY, currentTileW, currentTileH, cornerRadius);
                        ctx.fill();

                        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }
            }
          }
          
          if (onRenderComplete) {
              onRenderComplete();
          }
        };
    }, 50);

    return () => clearTimeout(renderTimeout);

  }, [imageSrc, widthCm, heightCm, showGrid, groutColor, onRenderComplete]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !imageSrc || isFullscreen) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
    drawLens(x, y);
  };

  const drawLens = (x: number, y: number) => {
    const mainCanvas = canvasRef.current;
    const lensCanvas = lensCanvasRef.current;
    if (!mainCanvas || !lensCanvas) return;

    const ctx = lensCanvas.getContext('2d');
    if (!ctx) return;

    lensCanvas.width = LENS_SIZE;
    lensCanvas.height = LENS_SIZE;

    // Reset e forma lente
    ctx.clearRect(0, 0, LENS_SIZE, LENS_SIZE);
    ctx.beginPath();
    ctx.arc(LENS_SIZE / 2, LENS_SIZE / 2, LENS_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    
    // Sfondo lente - Match grout color for consistency
    ctx.fillStyle = groutColor;
    ctx.fillRect(0, 0, LENS_SIZE, LENS_SIZE);

    const scaleX = mainCanvas.width / mainCanvas.clientWidth;
    const scaleY = mainCanvas.height / mainCanvas.clientHeight;

    const sourceX = x * scaleX;
    const sourceY = y * scaleY;
    
    const canvasPixelRatio = mainCanvas.width / mainCanvas.getBoundingClientRect().width;
    
    const lensViewWidth = LENS_SIZE / ZOOM_FACTOR * canvasPixelRatio;
    const lensViewHeight = LENS_SIZE / ZOOM_FACTOR * canvasPixelRatio;
    
    const startX = sourceX - (lensViewWidth / 2);
    const startY = sourceY - (lensViewHeight / 2);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(
      mainCanvas,
      startX, startY, lensViewWidth, lensViewHeight, 
      0, 0, LENS_SIZE, LENS_SIZE
    );

    const grad = ctx.createRadialGradient(LENS_SIZE/2, LENS_SIZE/2, LENS_SIZE/2 * 0.7, LENS_SIZE/2, LENS_SIZE/2, LENS_SIZE/2);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const toggleFullscreen = () => {
      if (imageSrc) {
          setIsFullscreen(!isFullscreen);
          setIsHovering(false);
      }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {isFullscreen && <div className="w-full h-96 bg-transparent" />}

      <div 
        className={`
           transition-all duration-300 ease-in-out
           ${isFullscreen 
              ? 'fixed inset-0 z-[100] bg-stone-950 flex items-center justify-center p-4' 
              : 'relative max-w-full group cursor-crosshair'
            }
        `}
        onClick={!isFullscreen ? toggleFullscreen : undefined}
        onMouseEnter={() => !isFullscreen && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
      >
         
         {!imageSrc && !isFullscreen && (
             <div className="w-full h-64 flex items-center justify-center bg-stone-100 text-stone-400 font-serif cursor-default border-4 border-white shadow-2xl">
                 Mosaic preview
             </div>
         )}
         
         <canvas 
            ref={canvasRef} 
            className={`
                block transition-all duration-300
                ${isFullscreen 
                    ? 'max-w-full max-h-[90vh] object-contain shadow-2xl' 
                    : 'max-w-full h-auto shadow-2xl border-4 border-white bg-white'
                }
            `} 
         />
         
         {isFullscreen && (
            <div className="absolute top-4 right-4 z-[101]">
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                    className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all border border-white/10"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
         )}

         {imageSrc && isHovering && !isFullscreen && (
          <div 
            className="pointer-events-none absolute z-50 rounded-full border-4 border-stone-200 shadow-2xl overflow-hidden bg-stone-900"
            style={{
              width: `${LENS_SIZE}px`,
              height: `${LENS_SIZE}px`,
              left: mousePos.x - LENS_SIZE / 2,
              top: mousePos.y - LENS_SIZE / 2,
            }}
          >
            <canvas ref={lensCanvasRef} className="w-full h-full object-cover" />
          </div>
         )}

         {imageSrc && !isFullscreen && (
             <div className="absolute bottom-4 right-4 bg-white/90 p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                 <Maximize2 className="w-5 h-5 text-stone-700" />
             </div>
         )}
      </div>
      
      {imageSrc && !isFullscreen && (
        <>
            <div className={`mt-4 font-medium text-sm tracking-wide ${qualityColor} uppercase`}>
            {qualityLabel}
            </div>
            
            <div className="mt-2 flex flex-col items-center gap-1">
                <p className="text-xs text-stone-400 text-center max-w-md hidden md:block">
                    Hover to magnify detail • Click to expand
                </p>
                <p className="text-xs text-stone-400 text-center max-w-md md:hidden flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" /> Tap image to zoom
                </p>
            </div>
        </>
      )}
    </div>
  );
};

export default MosaicCanvas;