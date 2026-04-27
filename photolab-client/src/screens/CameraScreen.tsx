import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Camera, XCircle, RotateCcw, Check, ArrowRight, Timer as TimerIcon } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function CameraScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = location.state as Record<string, any> | null;
  const state = location.state as { frameId?: string, requiredPhotos?: number, layoutConfig?: any, frameImageUrl?: string } | null;

  const requiredPhotos = state?.requiredPhotos || 3;
  const frameId = state?.frameId || "";
  const layoutConfig = state?.layoutConfig;
  const frameImageUrl = state?.frameImageUrl;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sessionTimeLeft, setSessionTimeLeft] = useState(300); // 5 mins default
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [capturedVideos, setCapturedVideos] = useState<string[]>([]);
  const [currentPreview, setCurrentPreview] = useState<string | null>(null);
  const [currentVideoPreview, setCurrentVideoPreview] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  const [maxRetakes, setMaxRetakes] = useState(1);
  const [retakeCount, setRetakeCount] = useState<Record<number, number>>({});

  // Sync Session Timer & Settings from Supabase
  useEffect(() => {
    async function fetchTimers() {
      const { data } = await supabase.from('settings').select('timer_session_limit, max_retake_limit').single();
      if (data) {
        if (data.timer_session_limit) setSessionTimeLeft(data.timer_session_limit);
        if (data.max_retake_limit !== undefined) setMaxRetakes(data.max_retake_limit);
      }
    }
    fetchTimers();
  }, []);

  // Global Session Countdown
  useEffect(() => {
    if (sessionTimeLeft > 0) {
      const timerId = setTimeout(() => setSessionTimeLeft(sessionTimeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      cancelSession();
    }
  }, [sessionTimeLeft]);

  // Start Camera
  useEffect(() => {
    async function setupCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
          audio: false
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera access failed:", err);
        setError("Could not access camera. Please ensure it is connected and permissions are granted.");
      }
    }

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCapture = () => {
    if (countdown !== null) return;
    let counter = 5;
    setCountdown(counter);
    const timer = setInterval(() => {
      counter -= 1;
      setCountdown(counter);
      if (counter === 0) {
        clearInterval(timer);
        takePhoto();
      }
    }, 1000);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

        // Start capturing 2s Boomerang clip
        startBoomerangCapture(imageDataUrl);
      }
    }
  };

  const startBoomerangCapture = (imgData: string) => {
    if (!stream) return;

    setIsRecording(true);
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) videoChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      setCurrentVideoPreview(videoUrl);
      setCurrentPreview(imgData);
      setIsRecording(false);
      setCountdown(null);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();

    // Stop after 2 seconds
    setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
    }, 2000);
  };

  const handleRetake = () => {
    const currentPhotoIndex = capturedImages.length;
    const currentRetakes = retakeCount[currentPhotoIndex] || 0;

    // maxRetakes === 0 means unlimited retakes
    if (maxRetakes > 0 && currentRetakes >= maxRetakes) return;

    setRetakeCount({
      ...retakeCount,
      [currentPhotoIndex]: currentRetakes + 1
    });

    setCurrentPreview(null);
    setCurrentVideoPreview(null);
    startCapture();
  };

  const handleKeepPhoto = () => {
    if (!currentPreview || !currentVideoPreview) return;
    const newPhotos = [...capturedImages, currentPreview];
    const newVideos = [...capturedVideos, currentVideoPreview];
    setCapturedImages(newPhotos);
    setCapturedVideos(newVideos);
    setCurrentPreview(null);
    setCurrentVideoPreview(null);

    if (newPhotos.length < requiredPhotos) {
      setTimeout(() => {
        startCapture();
      }, 500);
    } else {
      if (stream) stream.getTracks().forEach(track => track.stop());
      navigate('/filter', {
        state: {
          ...incomingState,
          capturedImages: newPhotos,
          capturedVideos: newVideos,
          frameId,
          layoutConfig,
          frameImageUrl
        }
      });
    }
  };

  const cancelSession = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    navigate('/');
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col relative overflow-hidden text-white">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 z-20 flex justify-between items-start pointer-events-none">
        <div>
          <h2 className="text-white text-xl font-bold drop-shadow-md">Photolab Kiosk</h2>
          <div className="mt-2 flex gap-2">
            {Array.from({ length: requiredPhotos }).map((_, i) => (
              <div key={i} className={`w-8 h-2 rounded-full backdrop-blur-md transition-colors ${i < capturedImages.length ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : i === capturedImages.length ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse' : 'bg-white/20 border border-white/10'}`}></div>
            ))}
          </div>
          <p className="text-white/80 text-sm font-semibold mt-2 drop-shadow-md">Photo {Math.min(capturedImages.length + 1, requiredPhotos)} of {requiredPhotos}</p>
        </div>

        {/* Global Timer */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-800/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
          <TimerIcon size={18} className={sessionTimeLeft < 30 ? "text-red-500 animate-pulse" : "text-indigo-400"} />
          <span className={`font-mono font-bold text-lg ${sessionTimeLeft < 30 ? "text-red-500" : "text-white"}`}>{Math.floor(sessionTimeLeft / 60)}:{(sessionTimeLeft % 60).toString().padStart(2, '0')}</span>
        </div>

        <button onClick={cancelSession} className="pointer-events-auto flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-100 px-4 py-2 rounded-full backdrop-blur-md border border-red-500/30 transition-colors">
          <XCircle size={20} /> Cancel
        </button>
      </div>

      {/* Viewfinder */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
        {error ? (
          <div className="text-red-400 text-center p-8 bg-red-500/10 rounded-2xl max-w-lg border border-red-500/20">
            <Camera size={48} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-white mb-2">Camera Error</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            {currentPreview && <div className="absolute inset-0 z-10 bg-black"><img src={currentPreview} alt="Captured" className="w-full h-full object-contain animate-fadeIn" /></div>}
            {currentVideoPreview && (
              <div className="absolute inset-0 z-10 bg-black">
                <video
                  src={currentVideoPreview}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain animate-fadeIn"
                />
              </div>
            )}
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transform -scale-x-100 ${currentPreview || currentVideoPreview ? 'opacity-0' : 'opacity-100'}`} />
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {isRecording && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 px-6 py-2 rounded-full flex items-center gap-3 opacity-20">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            <span className="font-bold uppercase tracking-widest text-[10px] text-white">Capture</span>
          </div>
        )}

        {countdown !== null && countdown > 0 && !currentPreview && !currentVideoPreview && (<div className="absolute inset-0 flex items-center justify-center z-30"><div className="text-[250px] font-bold text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-pulse">{countdown}</div>{countdown === 1 && <div className="absolute inset-0 bg-white opacity-0 animate-[flash_1s_ease-out_forwards]"></div>}</div>)}
      </div>

      {/* Controls */}
      <div className="h-40 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-20 flex items-center justify-center gap-8 relative px-12 pb-4">
        {currentPreview ? (
          <div className="flex w-full max-w-2xl justify-between items-center animate-fadeIn">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleRetake}
                disabled={maxRetakes > 0 && (retakeCount[capturedImages.length] || 0) >= maxRetakes}
                className={`flex items-center gap-3 px-8 py-5 rounded-full border border-white/10 transition-colors ${maxRetakes > 0 && (retakeCount[capturedImages.length] || 0) >= maxRetakes ? 'bg-white/5 text-slate-500 cursor-not-allowed opacity-50' : 'bg-white/5 text-slate-300 hover:text-white'}`}
              >
                <RotateCcw size={28} />
                <span className="text-xl font-bold tracking-wide">Retake</span>
              </button>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">
                Retake: {retakeCount[capturedImages.length] || 0} / {maxRetakes === 0 ? '∞' : maxRetakes}
              </p>
            </div>
            <button onClick={handleKeepPhoto} className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all transform hover:scale-105"><span className="text-xl font-bold tracking-wide uppercase">{capturedImages.length + 1 >= requiredPhotos ? "Finish Session" : "Keep & Next"}</span>{capturedImages.length + 1 >= requiredPhotos ? <Check size={28} /> : <ArrowRight size={28} />}</button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <button onClick={startCapture} disabled={countdown !== null} className={`group relative flex items-center justify-center w-24 h-24 rounded-full border-[6px] disabled:opacity-50 disabled:cursor-not-allowed ${countdown !== null ? 'border-indigo-500' : 'border-white hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]'}`}><div className={`absolute w-16 h-16 rounded-full transition-all ${countdown !== null ? 'bg-indigo-500' : 'bg-white group-hover:bg-slate-200'}`}></div></button>
            <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">Tap to Shoot</p>
          </div>
        )}
      </div>
      <style>{`@keyframes flash { 0% { opacity: 0; } 90% { opacity: 0; } 100% { opacity: 1; } }`}</style>
    </div>
  );
}
