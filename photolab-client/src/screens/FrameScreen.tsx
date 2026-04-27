import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, LayoutTemplate } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useKiosk } from "../lib/KioskContext";

interface DBFrame {
  id: string;
  name: string;
  image_url: string;
  required_photos: number;
  layout_config: any;
  type: string;
}

export default function FrameScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = location.state as Record<string, any> | null;
  const { kiosk } = useKiosk();
  const [timeLeft, setTimeLeft] = useState(60);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [dbFrames, setDbFrames] = useState<DBFrame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: settings } = await supabase.from('settings').select('timer_frame_select').single();
        if (settings?.timer_frame_select) {
          setTimeLeft(settings.timer_frame_select);
        }
        const { data: frames } = await supabase.from('frames').select('*');
        if (frames && frames.length > 0) {
          const allowed = kiosk?.allowed_frames || [];
          const filteredItems = allowed.length > 0
            ? (frames as DBFrame[]).filter(f => allowed.includes(f.id))
            : (frames as DBFrame[]);
          setDbFrames(filteredItems);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else if (!loading) {
      const frameId = selectedFrame || (dbFrames.length > 0 ? dbFrames[0].id : null);
      if (frameId) handleConfirm(frameId);
    }
  }, [timeLeft, selectedFrame, dbFrames, loading]);

  const handleConfirm = (id?: string) => {
    const frameId = id || selectedFrame;
    if (frameId) {
      const frameData = dbFrames.find(f => f.id === frameId);
      navigate('/camera', {
        state: {
          ...incomingState,
          frameId,
          requiredPhotos: frameData?.required_photos || 3,
          layoutConfig: frameData?.layout_config,
          frameImageUrl: frameData?.image_url
        }
      });
    }
  };

  // Detect vertical mode
  const isVertical = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col justify-between p-8 animate-kiosk-in text-white overflow-hidden relative">

      {/* Top Header */}
      <div className="flex justify-between items-start z-10">
        <div>
          <h1 className="text-4xl font-extrabold flex items-center gap-3">
            <LayoutTemplate className="text-indigo-400" size={36} /> Choose Frame
          </h1>
          <p className="text-xl text-slate-400 mt-2">Pick a design for your printed photos</p>
        </div>

        {/* Timer */}
        <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-indigo-500 bg-slate-800 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
          <span className="text-3xl font-black text-white">{timeLeft}</span>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Sec</span>
        </div>
      </div>

      {/* Frame Selection Grid */}
      <div className={`flex-1 flex items-center ${isVertical ? 'flex-wrap justify-center gap-6 overflow-y-auto py-8' : 'justify-start overflow-auto gap-12 px-12 py-20 snap-x flex-row-portrait-fix'} no-scrollbar h-full md:h-auto`}>
        {loading ? (
          <div className="w-full text-center text-indigo-400 animate-pulse text-2xl font-bold">Loading Frames...</div>
        ) : dbFrames.length === 0 ? (
          <div className="w-full text-center text-slate-500 italic">No frames found. Please upload via dashboard.</div>
        ) : (
          dbFrames.map((frame) => (
            <div
              key={frame.id}
              onClick={() => setSelectedFrame(frame.id)}
              className={`cursor-pointer ${isVertical ? '' : 'snap-center'} shrink-0 ${isVertical ? 'w-[200px]' : 'w-[280px]'} rounded-3xl flex flex-col items-center p-3 transition-all duration-500 relative bg-slate-800 border-2
                ${selectedFrame === frame.id ? 'border-indigo-500 scale-110 shadow-[0_0_40px_rgba(99,102,241,0.4)] z-20' : 'border-white/5 opacity-70 hover:opacity-100 z-10'}
              `}
            >
              {selectedFrame === frame.id && (
                <div className="absolute -top-3 -right-3 bg-indigo-500 rounded-full p-1.5 shadow-lg animate-bounce z-30">
                  <CheckCircle2 size={20} className="text-white" />
                </div>
              )}

              {/* Frame Image — Cover Image with Black Layout Slot Previews overlayed */}
              <div className="w-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center p-0 relative">
                <div className="relative inline-block w-full h-full pointer-events-none">
                  <img
                    src={frame.image_url}
                    className="w-full h-auto z-0 relative block pointer-events-none"
                    alt="Frame"
                    draggable={false}
                  />

                  {/* Render black placeholders */}
                  {Array.isArray(frame.layout_config) && frame.layout_config.map((slot: any, index: number) => (
                    <div
                      key={index}
                      className="absolute bg-black shadow-lg z-10"
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                        width: `${slot.w}%`,
                        height: `${slot.h}%`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex justify-between items-center z-10">
        <button
          onClick={() => navigate('/')}
          className="text-slate-400 hover:text-white px-8 py-4 rounded-full bg-slate-800 border border-slate-700 transition-colors text-lg font-bold"
        >
          Cancel
        </button>

        <button
          disabled={!selectedFrame}
          onClick={() => handleConfirm()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-12 py-4 rounded-full shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xl font-bold uppercase tracking-wider flex items-center gap-3"
        >
          Continue to Camera
        </button>
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-1/2 bg-indigo-500/10 blur-[150px] pointer-events-none rounded-full"></div>
    </div>
  );
}
