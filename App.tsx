import React, { useState, ChangeEvent, useRef, useCallback } from 'react';
import MosaicCanvas from './components/MosaicCanvas';
import { Upload, Grid3X3, Layers, Loader2, Play, Palette } from 'lucide-react';

const App: React.FC = () => {
  // Image State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  
  // Input State (what the user types)
  const [widthCm, setWidthCm] = useState<number>(100);
  const [heightCm, setHeightCm] = useState<number>(150);
  
  // Grout State
  const [groutColor, setGroutColor] = useState<string>('#262624');
  
  // Applied State (what is actually rendered)
  const [appliedConfig, setAppliedConfig] = useState<{width: number, height: number}>({ width: 100, height: 150 });

  // Grid State
  const [showGrid, setShowGrid] = useState<boolean>(true);
  
  // Rendering State
  const [isRendering, setIsRendering] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const GROUT_OPTIONS = [
    { name: 'Charcoal', value: '#262624', class: 'bg-[#262624]' },
    { name: 'Cement', value: '#78716c', class: 'bg-[#78716c]' },
    { name: 'Sand', value: '#d6d3d1', class: 'bg-[#d6d3d1]' },
    { name: 'White', value: '#f5f5f4', class: 'bg-[#f5f5f4]' },
  ];

  // Handle Image Upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          // When uploading a new image, we automatically trigger a render
          setIsRendering(true);
          // Sync applied config with current inputs just in case
          setAppliedConfig({ width: widthCm, height: heightCm });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    setIsRendering(true);
    // Slight timeout to ensure state update propagates to the loader UI before
    // MosaicCanvas receives the new props and starts the heavy useEffect
    setTimeout(() => {
        setAppliedConfig({ width: widthCm, height: heightCm });
    }, 10);
  };

  const onRenderComplete = useCallback(() => {
    setIsRendering(false);
  }, []);

  return (
    // Changed min-h-screen to min-h-full to avoid scrollbar issues inside Wix iframe
    <div className="w-full min-h-full font-sans text-stone-800 pb-12 bg-[#f5f5f4]">
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-8">
            
            <div className="space-y-3">
              <h1 className="text-3xl font-serif text-stone-900 leading-tight">
                Transform your image into a Mosaic
              </h1>
              <p className="text-stone-600 leading-relaxed text-sm">
                Upload a photograph and preview how it would live as a mosaic artwork. Each tile represents a 1×1 cm tessera – adjust the size to explore the balance between abstraction and detail.
              </p>
            </div>

            {/* Step 1: Upload */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100">
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
                1. Your Image
              </label>
              
              <div 
                onClick={() => !isRendering && fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed border-stone-300 rounded-lg h-28 flex flex-col items-center justify-center hover:bg-stone-50 transition-colors group ${isRendering ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Upload className="w-6 h-6 text-stone-400 mb-2 group-hover:text-stone-600" />
                <span className="text-sm text-stone-500 font-medium">Click to upload (JPG, PNG)</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload} 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Step 2: Dimensions & Details */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-stone-100 opacity-90 relative">
               <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">
                2. Configuration
              </label>
              
              <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-stone-600 mb-1">Width (cm)</label>
                      <input 
                        type="number" 
                        value={widthCm} 
                        onChange={(e) => setWidthCm(Number(e.target.value))}
                        min="20" max="1000"
                        disabled={isRendering}
                        className="w-full px-3 py-2 border border-stone-200 rounded-md text-stone-900 font-serif focus:outline-none focus:border-stone-500 disabled:bg-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-stone-600 mb-1">Height (cm)</label>
                      <input 
                        type="number" 
                        value={heightCm} 
                        onChange={(e) => setHeightCm(Number(e.target.value))}
                        min="20" max="1000"
                        disabled={isRendering}
                        className="w-full px-3 py-2 border border-stone-200 rounded-md text-stone-900 font-serif focus:outline-none focus:border-stone-500 disabled:bg-stone-100"
                      />
                    </div>
                  </div>

                  {/* Grout Color Selection */}
                  <div>
                      <label className="flex items-center gap-2 text-sm text-stone-600 mb-2">
                          <Palette className="w-3 h-3" />
                          Grout Color
                      </label>
                      <div className="flex gap-3">
                          {GROUT_OPTIONS.map((color) => (
                              <button
                                  key={color.value}
                                  onClick={() => {
                                      setGroutColor(color.value);
                                      // Optional: Trigger re-render immediately for color change as it's fast
                                      // Or keep it manual. Let's make it manual to avoid lagging on huge grids,
                                      // but user might expect immediate feedback. 
                                      // Since background fill is fast, let's keep it manual for consistency with "Generate" button philosophy,
                                      // OR users typically expect color changes to be instant. 
                                      // Given the "Generate" button text says "Update Preview", we stick to manual update.
                                  }}
                                  disabled={isRendering}
                                  className={`
                                      w-8 h-8 rounded-full border shadow-sm transition-all relative
                                      ${color.class}
                                      ${groutColor === color.value 
                                          ? 'ring-2 ring-offset-2 ring-stone-800 scale-110 border-stone-400' 
                                          : 'border-stone-200 hover:scale-105'
                                      }
                                  `}
                                  title={color.name}
                              />
                          ))}
                      </div>
                  </div>
              </div>

               {/* Grid Toggle */}
               <div className="mt-5 flex items-center justify-between">
                <button 
                  onClick={() => setShowGrid(!showGrid)}
                  disabled={isRendering}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${showGrid ? 'bg-stone-100 border-stone-300 text-stone-800' : 'bg-transparent border-stone-200 text-stone-400'}`}
                >
                  <Grid3X3 className="w-3 h-3" />
                  {showGrid ? 'Grid: ON' : 'Grid: OFF'}
                </button>
              </div>

              {/* Generate Button */}
              <div className="mt-6 border-t border-stone-100 pt-4">
                  <button
                    onClick={handleGenerate}
                    disabled={isRendering || !imageSrc}
                    className={`
                        w-full flex items-center justify-center gap-2 py-3 rounded-md text-white font-medium shadow-md transition-all
                        ${isRendering || !imageSrc 
                            ? 'bg-stone-400 cursor-not-allowed' 
                            : 'bg-stone-800 hover:bg-stone-700 hover:shadow-lg'
                        }
                    `}
                  >
                    {isRendering ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing Mosaic...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 fill-current" />
                            Update Preview
                        </>
                    )}
                  </button>
                  <p className="text-xs text-stone-400 mt-2 text-center">
                      Click to apply changes
                  </p>
              </div>
            </div>

            {/* Technical Specs */}
            {imageSrc && (
                 <div className="bg-stone-900 text-stone-300 p-5 rounded-xl text-sm font-light">
                    <div className="flex items-center gap-2 mb-3 text-white font-medium">
                        <Layers className="w-4 h-4" />
                        <span>Technical Specifications</span>
                    </div>
                    <ul className="space-y-1">
                        <li className="flex justify-between border-b border-stone-800 pb-1 mb-1">
                            <span>Dimensions:</span>
                            <span className="text-white">{appliedConfig.width} x {appliedConfig.height} cm</span>
                        </li>
                        <li className="flex justify-between border-b border-stone-800 pb-1 mb-1">
                            <span>Total Tiles:</span>
                            <span className="text-white">{(appliedConfig.width * appliedConfig.height).toLocaleString()} pcs</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Tile Size:</span>
                            <span className="text-white">10 x 10 mm</span>
                        </li>
                    </ul>
                 </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-7">
            <div className="sticky top-4">
                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4 text-center">
                    Live Mosaic Preview
                </h3>
                
                <div className="relative">
                    <MosaicCanvas 
                        imageSrc={imageSrc} 
                        widthCm={appliedConfig.width} 
                        heightCm={appliedConfig.height}
                        showGrid={showGrid}
                        groutColor={groutColor}
                        onRenderComplete={onRenderComplete}
                    />
                    
                    {/* Loading Overlay */}
                    {isRendering && imageSrc && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                            <div className="bg-white p-4 rounded-full shadow-xl">
                                <Loader2 className="w-8 h-8 text-stone-800 animate-spin" />
                            </div>
                            <span className="mt-3 text-stone-800 font-medium text-sm bg-white/80 px-3 py-1 rounded-full shadow-sm">
                                Simulating stone textures...
                            </span>
                        </div>
                    )}
                </div>

                 {imageSrc && (
                    <p className="mt-4 text-xs text-stone-500 text-center italic leading-relaxed max-w-lg mx-auto">
                        Note: The preview simulates the mosaic effect. The smaller the artwork, the more the image becomes an artistic, pixel-like interpretation.
                    </p>
                )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;