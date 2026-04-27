import { Routes, Route } from "react-router-dom";
import IdleScreen from "./screens/IdleScreen";
import PackageScreen from "./screens/PackageScreen";
import PaymentScreen from "./screens/PaymentScreen";
import FrameScreen from "./screens/FrameScreen";
import CameraScreen from "./screens/CameraScreen";
import FilterScreen from "./screens/FilterScreen";
import FinalScreen from "./screens/FinalScreen";
import SetupScreen from "./screens/SetupScreen";
import { supabase } from "./lib/supabase";
import { KioskProvider, useKiosk } from "./lib/KioskContext";
import { useEffect, useState } from "react";

function AppContent() {
  const { kiosk, isLoading, isRegistered } = useKiosk();
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Load Custom Theming Global Variables
  useEffect(() => {
    async function loadTheme() {
      try {
        const { data } = await supabase.from('settings').select('*').single();
        if (data) {
          const root = document.documentElement;
          if (data.theme_bg_color) root.style.setProperty('--theme-bg', data.theme_bg_color);
          if (data.theme_accent_color) root.style.setProperty('--theme-accent', data.theme_accent_color);

          if (data.idle_bg_image) localStorage.setItem('theme_idle_bg', data.idle_bg_image);
          if (data.brand_logo_url) localStorage.setItem('theme_brand_logo', data.brand_logo_url);
        }
      } catch (e) {
        console.error("Theme fetch failed", e);
      } finally {
        setThemeLoaded(true);
      }
    }
    loadTheme();
  }, []);

  // Heartbeat: update last_seen for THIS kiosk
  useEffect(() => {
    if (!kiosk?.kioskId) return;

    const heartbeat = async () => {
      try {
        await supabase.from('kiosks').update({
          last_seen: new Date().toISOString()
        } as any).eq('id', kiosk.kioskId);
      } catch (e) {
        console.error("Heartbeat failed", e);
      }
    };

    heartbeat();
    const interval = setInterval(heartbeat, 30000);
    return () => clearInterval(interval);
  }, [kiosk?.kioskId]);

  if (isLoading || !themeLoaded) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg, #0f172a)' }}>
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--theme-accent, #6366f1)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  if (!isRegistered) {
    return <SetupScreen />;
  }

  return (
    <div className={`w-screen h-screen overflow-hidden ${kiosk?.orientation === 'portrait' ? 'layout-portrait' : 'layout-landscape'}`}>
      <Routes>
        <Route path="/" element={<IdleScreen />} />
        <Route path="/package" element={<PackageScreen />} />
        <Route path="/payment" element={<PaymentScreen />} />
        <Route path="/frame" element={<FrameScreen />} />
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/filter" element={<FilterScreen />} />
        <Route path="/final" element={<FinalScreen />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <KioskProvider>
      <AppContent />
    </KioskProvider>
  );
}

export default App;
