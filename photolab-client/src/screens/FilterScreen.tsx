import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sparkles, Check, ArrowRight } from "lucide-react";

const FILTERS = [
  { id: 'none', name: 'Original', class: '' },
  { id: 'grayscale', name: 'B&W', class: 'grayscale' },
  { id: 'sepia', name: 'Vintage', class: 'sepia' },
  { id: 'contrast', name: 'Drama', class: 'contrast-125' },
  { id: 'brightness', name: 'Bright', class: 'brightness-125' },
  { id: 'blur-soft', name: 'Dreamy', class: 'blur-[1px] brightness-110' },
];

export default function FilterScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = location.state as Record<string, any> | null;
  const state = location.state as { 
    capturedImages?: string[], 
    capturedVideos?: string[],
    frameId?: string, 
    layoutConfig?: any, 
    frameImageUrl?: string 
  } | null;
  const capturedImages = state?.capturedImages || [];
  const capturedVideos = state?.capturedVideos || [];
  const frameId = state?.frameId || "";
  const layoutConfig = state?.layoutConfig;
  const frameImageUrl = state?.frameImageUrl;

  const [selectedFilter, setSelectedFilter] = useState('none');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-scroll through captured images to preview filter on all
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % capturedImages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [capturedImages.length]);

  const handleConfirm = () => {
    navigate('/final', { 
      state: { 
        ...incomingState,
        capturedImages, 
        capturedVideos,
        frameId, 
        layoutConfig,
        frameImageUrl,
        filter: FILTERS.find(f => f.id === selectedFilter)?.class 
      } 
    });
  };

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-white animate-kiosk-in overflow-hidden">
      
      <div className="w-full flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <Sparkles className="text-indigo-400" size={36} /> Post Effects
          </h1>
          <p className="text-xl text-slate-400 mt-2">Choose a look for your photos</p>
        </div>
      </div>

      <div className="flex-1 w-full flex gap-12 flex-row-portrait-fix items-center justify-center max-w-6xl">
        {/* Preview Area */}
        <div className="w-1/2 w-1-2-portrait-fix aspect-[3/4] max-h-[600px] bg-black rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white/10 group">
          <img 
            src={capturedImages[currentImageIndex]} 
            className={`w-full h-full object-cover transition-all duration-500 ${FILTERS.find(f => f.id === selectedFilter)?.class}`}
            alt="Filter Preview"
          />
          <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold border border-white/20">
             Preview: Photo {currentImageIndex + 1}
          </div>
        </div>

        {/* Filter Selection Grid */}
        <div className="w-1/2 w-1-2-portrait-fix grid grid-cols-2 gap-4">
          {FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id)}
              className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                selectedFilter === filter.id 
                ? 'bg-indigo-600 border-indigo-400 shadow-lg scale-105' 
                : 'bg-slate-800 border-slate-700 hover:border-slate-500'
              }`}
            >
              <div className={`w-24 h-24 rounded-2xl bg-slate-700 overflow-hidden border border-white/10 ${filter.class}`}>
                <img src={capturedImages[0]} className="w-full h-full object-cover" alt={filter.name} />
              </div>
              <span className="font-bold text-lg">{filter.name}</span>
              {selectedFilter === filter.id && <Check size={20} className="text-white" />}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full flex justify-between items-center mt-12">
        <button 
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white px-8 py-4 rounded-full bg-slate-800 border border-slate-700 transition-colors text-lg font-bold"
        >
          Cancel
        </button>

        <button 
          onClick={handleConfirm}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-full shadow-lg shadow-indigo-600/30 transition-all text-xl font-bold uppercase tracking-wider flex items-center gap-3"
        >
          Apply & Finalize <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
