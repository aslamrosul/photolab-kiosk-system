import { useNavigate } from "react-router-dom";
import { Camera, Sparkles } from "lucide-react";

export default function IdleScreen() {
  const navigate = useNavigate();
  const bgImage = localStorage.getItem('theme_idle_bg');
  const logoUrl = localStorage.getItem('theme_brand_logo');

  return (
    <div
      onClick={() => navigate('/package')}
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden cursor-pointer group"
      style={{ backgroundColor: 'var(--theme-bg, #010103)' }}
    >
      {/* Custom Theme Background / Cinematic Elements */}
      <div className="absolute inset-0 z-0">
        {bgImage ? (
          <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen" style={{ backgroundImage: `url(${bgImage})` }}></div>
        ) : (
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.03] mix-blend-overlay"></div>
        )}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] animate-[pulse_8s_infinite] opacity-30" style={{ backgroundColor: 'var(--theme-accent, #4f46e5)' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] animate-[pulse_10s_infinite] opacity-30" style={{ backgroundColor: 'var(--theme-accent, #d946ef)', animationDelay: '2s' }}></div>

        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-[0.03] mix-blend-overlay"></div>

        {/* Moving Light Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/20 to-transparent animate-[scan-y_4s_linear_infinite]"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-violet-500/20 to-transparent animate-[scan-y_6s_linear_infinite]" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center space-y-12 animate-kiosk-in">
        <div className="relative">
          {/* Glowing Aura */}
          <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 opacity-20 blur-[80px] rounded-full group-hover:opacity-40 transition-opacity duration-1000"></div>

          <div className="relative flex items-center justify-center w-48 h-48 bg-slate-900/40 backdrop-blur-3xl rounded-full border border-white/10 shadow-[0_0_80px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform duration-700 ease-out">
            <Camera size={80} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            <Sparkles size={36} className="absolute -top-2 -right-2 text-indigo-400 animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-8xl font-[900] text-white tracking-[-0.04em] leading-[0.9] drop-shadow-2xl">
            CAPTURE<br />
            <span className="text-transparent bg-clip-text animate-gradient-x" style={{ backgroundImage: 'linear-gradient(to right, #e2e8f0, var(--theme-accent, #818cf8), #e2e8f0)' }}>
              THE MAGIC
            </span>
          </h1>
          <p className="text-2xl text-slate-400 font-medium tracking-tight max-w-xl mx-auto opacity-80 decoration-indigo-500/30">
            The premium photobooth experience for your most iconic moments.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="relative px-12 py-5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md overflow-hidden group-hover:bg-white/10 transition-all duration-500 group-active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
            <span className="text-xl font-black uppercase tracking-[0.3em] text-white/80 group-hover:text-white transition-colors">
              Tap Screen to Begin
            </span>
          </div>
          <div className="flex gap-4">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 animate-ping" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

      {/* Brand Watermark */}
      <div className="absolute bottom-12 text-[10px] font-black uppercase tracking-[0.5em] text-white/30 flex items-center justify-center">
        {logoUrl ? (
          <img src={logoUrl} alt="Brand Logo" className="h-8 object-contain" />
        ) : (
          "POWERED BY SNAPMANNER CLOUD"
        )}
      </div>

      <style>{`
        @keyframes scan-y {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-move 5s ease infinite;
        }
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}
