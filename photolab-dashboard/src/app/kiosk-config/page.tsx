"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Timer, Clock, RefreshCw, Save, Loader2, CheckCircle, Settings2,
  Palette, Image, Upload
} from "lucide-react";

export default function KioskConfigPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // Timers
  const [config, setConfig] = useState({
    timer_frame_select: 60,
    timer_session_limit: 300,
    max_retake_limit: 1,
  });

  // Theming
  const [themeBg, setThemeBg] = useState("#020617");
  const [themeAccent, setThemeAccent] = useState("#4f46e5");
  const [idleBgImage, setIdleBgImage] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('*').single();
      if (data) {
        setConfig({
          timer_frame_select: (data as any).timer_frame_select ?? 60,
          timer_session_limit: (data as any).timer_session_limit ?? 300,
          max_retake_limit: (data as any).max_retake_limit ?? 1,
        });
        setThemeBg(data.theme_bg_color || "#020617");
        setThemeAccent(data.theme_accent_color || "#4f46e5");
        setIdleBgImage(data.idle_bg_image || "");
        setBrandLogoUrl(data.brand_logo_url || "");
      }
      setInitialLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    const { error } = await supabase.from('settings').update({
      timer_frame_select: config.timer_frame_select,
      timer_session_limit: config.timer_session_limit,
      max_retake_limit: config.max_retake_limit,
      theme_bg_color: themeBg,
      theme_accent_color: themeAccent,
      idle_bg_image: idleBgImage || null,
      brand_logo_url: brandLogoUrl || null,
    } as any).eq('id', 1);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-2";
  const helpTextClass = "text-xs text-gray-400 mt-1.5";

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kiosk Engine Control</h1>
        <p className="text-sm text-gray-500 mt-1">Configure timers, appearance, and session rules for all booth machines.</p>
      </div>

      {/* Success Banner */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100 animate-fade-in sticky top-4 z-50 shadow-lg">
          <CheckCircle size={20} />
          <span className="font-medium">Kiosk configuration saved!</span>
        </div>
      )}

      {/* ========== SECTION 1: Appearance ========== */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-5">
        <h2 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Palette size={18} className="text-indigo-500" /> Kiosk Appearance
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Background Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeBg}
                onChange={(e) => setThemeBg(e.target.value)}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-1"
              />
              <input type="text" className={inputClass} value={themeBg} onChange={(e) => setThemeBg(e.target.value)} placeholder="#020617" />
            </div>
            <p className={helpTextClass}>Main background color for all kiosk screens.</p>
          </div>

          <div>
            <label className={labelClass}>Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeAccent}
                onChange={(e) => setThemeAccent(e.target.value)}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer p-1"
              />
              <input type="text" className={inputClass} value={themeAccent} onChange={(e) => setThemeAccent(e.target.value)} placeholder="#4f46e5" />
            </div>
            <p className={helpTextClass}>Buttons, highlights, and interactive elements.</p>
          </div>
        </div>

        <div>
          <label className={labelClass}>Idle Screen Background Image</label>
          <div className="flex items-center gap-3">
            <Image size={18} className="text-gray-400 shrink-0" />
            <input type="text" className={inputClass} value={idleBgImage} onChange={(e) => setIdleBgImage(e.target.value)} placeholder="https://example.com/bg-image.jpg" />
          </div>
          <p className={helpTextClass}>Full URL to background image shown on the idle/home screen.</p>
          {idleBgImage && (
            <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 h-24 bg-gray-50">
              <img src={idleBgImage} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Brand Logo URL</label>
          <div className="flex items-center gap-3">
            <Upload size={18} className="text-gray-400 shrink-0" />
            <input type="text" className={inputClass} value={brandLogoUrl} onChange={(e) => setBrandLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
          </div>
          <p className={helpTextClass}>Logo displayed on the kiosk idle screen.</p>
          {brandLogoUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img src={brandLogoUrl} alt="Logo Preview" className="h-12 w-auto object-contain rounded-lg border border-gray-200 bg-white p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
        </div>

        {/* Live Preview */}
        <div className="p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-3">Live Preview</p>
          <div className="w-full h-24 rounded-lg flex items-center justify-center gap-4 overflow-hidden relative" style={{ backgroundColor: themeBg }}>
            {idleBgImage && <img src={idleBgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" onError={(e) => (e.currentTarget.style.display = 'none')} />}
            {brandLogoUrl && <img src={brandLogoUrl} alt="" className="h-8 w-auto object-contain relative z-10" onError={(e) => (e.currentTarget.style.display = 'none')} />}
            <div className="px-4 py-2 rounded-full text-xs font-bold text-white relative z-10" style={{ backgroundColor: themeAccent }}>
              Start Session
            </div>
          </div>
        </div>
      </div>

      {/* ========== SECTION 2: Timers & Limits ========== */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm space-y-7">
        <div className="flex items-start gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-xl">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg shrink-0 mt-0.5">
            <Settings2 size={24} />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 text-sm">Real-time Engine Sync</h3>
            <p className="text-xs text-indigo-700 mt-1">
              Changes made here will affect all active Photobooth applications on their next session start.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Frame Select Timer */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
              <Clock size={16} className="text-indigo-500" /> Frame Selection Timer (Seconds)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={config.timer_frame_select}
                onChange={(e) => setConfig({...config, timer_frame_select: parseInt(e.target.value) || 0})}
                className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono text-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                min={10} max={300}
              />
              <p className="text-xs text-gray-500 leading-relaxed">
                Duration allowed for customers to pick their desired photo template/frame.<br/>
                <span className="font-semibold text-gray-700">Recommended: 60s.</span> If timeout occurs, kiosk auto-selects default frame.
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-gray-100"></div>

          {/* Session Limit Timer */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
              <Timer size={16} className="text-indigo-500" /> Total Session Time Limit (Seconds)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={config.timer_session_limit}
                onChange={(e) => setConfig({...config, timer_session_limit: parseInt(e.target.value) || 0})}
                className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono text-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                min={60} max={1200}
              />
              <div className="text-xs text-gray-500 leading-relaxed">
                Maximum time allowed inside the booth (Taking photos + Editing filter).<br/>
                <span className="font-semibold text-orange-600 block mt-1">({Math.floor(config.timer_session_limit / 60)} Minutes {config.timer_session_limit % 60} Seconds)</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gray-100"></div>

          {/* Retake Limit */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
              <RefreshCw size={16} className="text-indigo-500" /> Maximum Retakes Per Pose
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={config.max_retake_limit}
                onChange={(e) => setConfig({...config, max_retake_limit: parseInt(e.target.value) || 0})}
                className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-xl text-center font-mono text-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                min={0} max={5}
              />
              <p className="text-xs text-gray-500 leading-relaxed">
                How many times a customer can press &quot;Retake&quot; for a single photo slot.<br/>
                <span className="font-semibold text-gray-700">Set to 0 for unlimited retakes.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== SAVE BUTTON ========== */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-gray-900 text-white w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all disabled:bg-gray-300 shadow-md text-sm sticky bottom-6"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
        Apply Engine Config to All Kiosks
      </button>
    </div>
  );
}
