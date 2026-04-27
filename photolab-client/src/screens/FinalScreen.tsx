import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Printer, RefreshCcw, Download } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useKiosk } from "../lib/KioskContext";
import { QRCodeSVG } from "qrcode.react";
// @ts-ignore
import gifshot from "gifshot";

export default function FinalScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { kiosk } = useKiosk();
  const state = location.state as {
    capturedImages?: string[];
    frameId?: string;
    filter?: string;
    layoutConfig?: any[];
    frameImageUrl?: string;
    packageId?: string;
    voucherId?: string;
    finalPrice?: number;
    paymentMethod?: string;
    midtransOrderId?: string;
    midtransAmount?: string;
  } | null;

  const capturedImages = state?.capturedImages || [];
  // Robust layoutConfig retrieval
  const getLayoutConfig = () => {
    let cfg = state?.layoutConfig;
    if (typeof cfg === 'string') {
      try { cfg = JSON.parse(cfg); } catch (e) { cfg = []; }
    }
    if (Array.isArray(cfg) && cfg.length > 0) return cfg;
    return [
      { id: 1, x: 10, y: 10, w: 80, h: 25 },
      { id: 2, x: 10, y: 37, w: 80, h: 25 },
      { id: 3, x: 10, y: 64, w: 80, h: 25 }
    ];
  };

  const layoutConfig = getLayoutConfig();
  const frameImageUrl = state?.frameImageUrl;
  const filterClass = state?.filter || "";

  const [saving, setSaving] = useState(false);
  const uploadStartedRef = useRef(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // URLs for UI and DB

  const [qrBaseUrl, setQrBaseUrl] = useState<string>("");

  // Print & QR State
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const [printFinished, setPrintFinished] = useState(false);
  const [animIndex, setAnimIndex] = useState(0);

  // 1. Fetch QR Base URL
  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('settings').select('qr_base_url').single();
      if (data?.qr_base_url) {
        setQrBaseUrl(data.qr_base_url);
      } else {
        setQrBaseUrl('http://localhost:3000'); // Fallback
      }
    }
    fetchSettings();
  }, []);

  // 2. Animated Preview Loop
  useEffect(() => {
    if (capturedImages.length > 1) {
      const interval = setInterval(() => {
        setAnimIndex((prev) => (prev + 1) % capturedImages.length);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [capturedImages]);

  // Apply CSS filter class to a canvas's ImageData (pixel-level, 100% reliable in Electron)
  const applyFilterToCanvas = (canvas: HTMLCanvasElement, cls: string) => {
    if (!cls || cls === 'none') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const parts = cls.split(' ');

    for (const part of parts) {
      if (part === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = data[i + 1] = data[i + 2] = g;
        }
      } else if (part === 'sepia') {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
      } else if (part.startsWith('brightness-')) {
        const factor = parseInt(part.split('-')[1]) / 100;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * factor);
          data[i + 1] = Math.min(255, data[i + 1] * factor);
          data[i + 2] = Math.min(255, data[i + 2] * factor);
        }
      } else if (part.startsWith('contrast-')) {
        const factor = parseInt(part.split('-')[1]) / 100;
        const intercept = 128 * (1 - factor);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, data[i] * factor + intercept));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor + intercept));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor + intercept));
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  // Helper to load an image from URL/Blob as a Promise
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
    });
  };

  // Improved Composition Logic: Sequential and Robust
  const compositeImages = async (): Promise<Blob | null> => {
    if (!frameImageUrl) {
      console.error('[compositeImages] No frameImageUrl');
      return null;
    }

    try {
      // 1. Load the frame image first to get dimensions
      let frameImg: HTMLImageElement;
      let frameBlobUrl: string | undefined;
      try {
        console.log('[compositeImages] Fetching frame:', frameImageUrl);
        const frameResp = await fetch(frameImageUrl);
        if (!frameResp.ok) throw new Error(`Fetch failed: ${frameResp.status}`);
        const blob = await frameResp.blob();
        frameBlobUrl = URL.createObjectURL(blob);
        frameImg = await loadImage(frameBlobUrl);
      } catch (err) {
        console.error('[compositeImages] Frame load failed:', err);
        return null;
      }

      const canvas = document.createElement('canvas');
      canvas.width = frameImg.width || 1200; // Fallback width
      canvas.height = frameImg.height || 1800; // Fallback height
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (frameBlobUrl) URL.revokeObjectURL(frameBlobUrl);
        return null;
      }

      console.log('[compositeImages] Canvas initialized:', canvas.width, 'x', canvas.height);

      // Step 1: Background - Solid White
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Step 2: Draw the Frame FIRST as background (frame PNG is opaque, not transparent)
      ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      console.log('[compositeImages] Frame drawn as background');
      if (frameBlobUrl) URL.revokeObjectURL(frameBlobUrl);

      // Step 3: Draw Photos ON TOP of the frame in their slots
      for (let i = 0; i < layoutConfig.length; i++) {
        const slot = layoutConfig[i];
        const photoUrl = capturedImages[i];
        if (!photoUrl) {
          console.warn(`[compositeImages] Slot ${i} has no photo url`);
          continue;
        }

        try {
          const img = await loadImage(photoUrl);
          
          const x = (slot.x / 100) * canvas.width;
          const y = (slot.y / 100) * canvas.height;
          const w = (slot.w / 100) * canvas.width;
          const h = (slot.h / 100) * canvas.height;

          // Cover-crop: scale photo to fill slot, then clip to slot bounds
          const imgAspect = img.width / img.height;
          const slotAspect = w / h;
          let drawW, drawH, drawX, drawY;

          if (imgAspect > slotAspect) {
            drawH = h;
            drawW = h * imgAspect;
            drawX = x - (drawW - w) / 2;
            drawY = y;
          } else {
            drawW = w;
            drawH = w / imgAspect;
            drawX = x;
            drawY = y - (drawH - h) / 2;
          }

          // Clip to slot rectangle so photo doesn't bleed outside
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
          ctx.restore();
          
          console.log(`[compositeImages] Photo ${i} drawn ON TOP at [${x}, ${y}, ${w}, ${h}]`);
        } catch (err) {
          console.error(`[compositeImages] Failed to load/draw photo ${i}:`, err);
        }
      }

      // Step 4: Apply Global Filter
      if (filterClass && filterClass !== 'none') {
        console.log('[compositeImages] Applying filter:', filterClass);
        applyFilterToCanvas(canvas, filterClass);
      }

      // Step 5: Convert to Blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          console.log('[compositeImages] Blob created:', blob ? blob.size : 'NULL');
          resolve(blob);
        }, 'image/png', 0.95);
      });

    } catch (err) {
      console.error('[compositeImages] Unexpected error:', err);
      return null;
    }
  };

  const createGif = async (): Promise<Blob | null> => {
    return new Promise(async (resolve) => {
      if (capturedImages.length === 0) return resolve(null);

      // Apply filter to each image before creating GIF
      const filteredImages: string[] = [];
      for (const imgUrl of capturedImages) {
        const filtered = await new Promise<string>((res) => {
          const img = new Image();
          img.src = imgUrl; // data URI - no CORS needed
          img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tCtx = tempCanvas.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(img, 0, 0);
              if (filterClass) applyFilterToCanvas(tempCanvas, filterClass);
              res(tempCanvas.toDataURL('image/jpeg', 0.85));
            } else {
              res(imgUrl);
            }
          };
          img.onerror = () => res(imgUrl);
        });
        filteredImages.push(filtered);
      }

      gifshot.createGIF({
        images: filteredImages,
        gifWidth: 600,
        gifHeight: 800,
        interval: 0.5,
      }, (obj: any) => {
        if (!obj.error) {
          const image = obj.image;
          // Convert base64 to blob
          fetch(image)
            .then(res => res.blob())
            .then(blob => resolve(blob))
            .catch(() => resolve(null));
        } else {
          resolve(null);
        }
      });
    });
  };

  // Create a composited video collage: frame + 3 boomerang videos in slots
  const createVideoCollage = async (): Promise<Blob | null> => {
    const capturedVideos: string[] = (state as any)?.capturedVideos || [];
    if (!frameImageUrl || capturedVideos.length === 0) {
      console.log('[videoCollage] No frame or no videos:', { frameImageUrl: !!frameImageUrl, videos: capturedVideos.length });
      return null;
    }

    try {
      // 1. Load frame image
      const frameResp = await fetch(frameImageUrl);
      if (!frameResp.ok) throw new Error(`Frame fetch: ${frameResp.status}`);
      const frameBlob = await frameResp.blob();
      const frameBlobUrl = URL.createObjectURL(frameBlob);
      const frameImg = await loadImage(frameBlobUrl);

      // Preload static images for fallback during WebM loops
      const staticImages: (HTMLImageElement | null)[] = [];
      for (let i = 0; i < capturedVideos.length; i++) {
        if (capturedImages[i]) {
          try {
            const img = await loadImage(capturedImages[i]);
            staticImages.push(img);
          } catch(e) {
            staticImages.push(null);
          }
        } else {
          staticImages.push(null);
        }
      }

      // 2. Set up a smaller canvas for video (performance)
      const scale = Math.min(1, 900 / frameImg.width);
      const cW = Math.round(frameImg.width * scale);
      const cH = Math.round(frameImg.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = cW;
      canvas.height = cH;
      const ctx = canvas.getContext('2d')!;
      if (!ctx) { URL.revokeObjectURL(frameBlobUrl); return null; }

      console.log('[videoCollage] Canvas:', cW, 'x', cH, 'scale:', scale);

      // 3. Create offscreen <video> elements for each boomerang
      const videoElements: HTMLVideoElement[] = [];
      for (let i = 0; i < capturedVideos.length; i++) {
        const videoUrl = capturedVideos[i];
        if (!videoUrl) continue;
        try {
          const resp = await fetch(videoUrl);
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const video = document.createElement('video');
          video.src = blobUrl;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          // Wait for video to be ready and force the first frame to decode
          await new Promise<void>((res) => {
            let handled = false;
            const onReady = () => {
              if (handled) return;
              handled = true;
              video.onloadeddata = null;
              video.onseeked = null;
              video.onerror = null;
              res();
            };
            
            video.onloadeddata = () => {
              // Force decode of a frame so canvas has pixels immediately
              if (video.duration >= 0.1) {
                video.currentTime = 0.01;
              } else {
                onReady();
              }
            };
            
            video.onseeked = () => onReady();
            video.onerror = () => onReady();
            video.load();
          });
          videoElements.push(video);
          console.log(`[videoCollage] Video ${i} loaded: ${video.videoWidth}x${video.videoHeight}`);
        } catch (err) {
          console.error(`[videoCollage] Failed to load video ${i}:`, err);
        }
      }

      if (videoElements.length === 0) {
        URL.revokeObjectURL(frameBlobUrl);
        return null;
      }

      // 4. Start all videos playing
      await Promise.all(videoElements.map(v => v.play().catch(() => {})));

      // 5. Set up MediaRecorder on canvas stream
      const stream = canvas.captureStream(24);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // 6. Animation render loop
      let animating = true;
      const renderFrame = () => {
        if (!animating) return;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cW, cH);

        // Draw frame as background
        ctx.drawImage(frameImg, 0, 0, cW, cH);

        // Draw each video into its slot
        for (let i = 0; i < Math.min(layoutConfig.length, videoElements.length); i++) {
          const slot = layoutConfig[i];
          const video = videoElements[i];
          const staticFallback = staticImages[i];
          
          let drawSource: CanvasImageSource | null = null;
          let srcW = 0, srcH = 0;

          // Use video if it's painted and ready, otherwise use static fallback
          if (video && video.readyState >= 2) {
             drawSource = video;
             srcW = video.videoWidth;
             srcH = video.videoHeight;
          } else if (staticFallback) {
             drawSource = staticFallback;
             srcW = staticFallback.width;
             srcH = staticFallback.height;
          }

          if (!drawSource) continue;

          const x = (slot.x / 100) * cW;
          const y = (slot.y / 100) * cH;
          const w = (slot.w / 100) * cW;
          const h = (slot.h / 100) * cH;

          // Cover-crop
          const vAspect = srcW / srcH;
          const sAspect = w / h;
          let dw, dh, dx, dy;

          if (vAspect > sAspect) {
            dh = h; dw = h * vAspect;
            dx = x - (dw - w) / 2; dy = y;
          } else {
            dw = w; dh = w / vAspect;
            dx = x; dy = y - (dh - h) / 2;
          }

          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.drawImage(drawSource, dx, dy, dw, dh);
          ctx.restore();
        }

        // Apply filter to the entire frame
        if (filterClass && filterClass !== 'none') {
          applyFilterToCanvas(canvas, filterClass);
        }

        requestAnimationFrame(renderFrame);
      };

      // 7. Record for 4 seconds then stop
      return new Promise<Blob | null>((resolve) => {
        recorder.onstop = () => {
          animating = false;
          videoElements.forEach(v => { v.pause(); v.src = ''; });
          URL.revokeObjectURL(frameBlobUrl);

          const finalBlob = new Blob(chunks, { type: 'video/webm' });
          console.log('[videoCollage] Recording complete:', finalBlob.size, 'bytes');
          resolve(finalBlob);
        };

        // Start rendering FIRST so videos draw their initial frames
        // We render a few warmup frames synchronusly before starting the recorder.
        renderFrame();
        renderFrame();
        renderFrame();

        // Wait 500ms for videos to actually render, THEN start recording
        setTimeout(() => {
          recorder.start(100);
          console.log('[videoCollage] Recording started (after warmup)');

          // Stop after 4 seconds of actual recording
          setTimeout(() => {
            if (recorder.state === 'recording') {
              recorder.stop();
            }
          }, 4000);
        }, 500);
      });

    } catch (err) {
      console.error('[videoCollage] Error:', err);
      return null;
    }
  };

  // Upload & DB Recording Logic
  useEffect(() => {
    async function recordTransaction() {
      // Guard: Don't run if already saving, already saved, or if photos are missing
      if (uploadStartedRef.current || saving || transactionId || capturedImages.length === 0) {
        console.log('[FinalScreen] Skipping recordTransaction:', { started: uploadStartedRef.current, saving, hasTx: !!transactionId, photos: capturedImages.length });
        return;
      }
      
      uploadStartedRef.current = true;
      console.log('[FinalScreen] Recording transaction for', capturedImages.length, 'photos');
      setSaving(true);

      try {
        const txTimestamp = Date.now();
        const randId = Math.random().toString(36).substring(7);
        const filePrefix = `${txTimestamp}_${randId}`;

        // 1. Composite and Upload Photo Strip (sessions/collage/)
        const photoBlob = await compositeImages();
        console.log('[FinalScreen] compositeImages result:', photoBlob ? `${photoBlob.size} bytes` : 'null');
        let finalPhotoUrl = '';
        if (photoBlob) {
          const photoName = `sessions/collage/${filePrefix}.png`;
          const { data, error: uploadError } = await supabase.storage.from('photos').upload(photoName, photoBlob, { contentType: 'image/png' });
          if (data) {
            const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(photoName);
            finalPhotoUrl = publicUrl;
            console.log('[FinalScreen] Collage uploaded:', publicUrl);
          } else {
            console.error('[FinalScreen] Collage upload error:', uploadError);
            // Fall back to frame URL only as last resort
            finalPhotoUrl = frameImageUrl || '';
          }
        } else {
          console.error('[FinalScreen] compositeImages returned null - using frameImageUrl fallback');
          finalPhotoUrl = frameImageUrl || '';
        }

        // 2. Upload Original Images (sessions/originals/)
        let originalUrls: string[] = [];
        for (let i = 0; i < capturedImages.length; i++) {
          try {
            const res = await fetch(capturedImages[i]);
            const blob = await res.blob();
            const origName = `sessions/originals/${filePrefix}_${i}.jpg`;
            const { data } = await supabase.storage.from('photos').upload(origName, blob, { contentType: 'image/jpeg' });
            if (data) {
              const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(origName);
              originalUrls.push(publicUrl);
            }
          } catch (e) { console.error("Failed to upload orig photo", i, e); }
        }

        // 3. Upload Animated GIF (sessions/gifs/)
        let gifUrl = "";
        const gifBlob = await createGif();
        if (gifBlob) {
          const gifName = `sessions/gifs/${filePrefix}.gif`;
          const { data } = await supabase.storage.from('photos').upload(gifName, gifBlob, { contentType: 'image/gif' });
          if (data) {
            const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(gifName);
            gifUrl = publicUrl;
          }
        }

        // 4. Create & Upload Video Collage (sessions/videos/)
        let finalVideoUrl = "";
        try {
          console.log('[FinalScreen] Creating video collage...');
          const videoBlob = await createVideoCollage();
          if (videoBlob) {
            const videoName = `sessions/videos/${filePrefix}.webm`;
            const { data } = await supabase.storage.from('photos').upload(videoName, videoBlob, { contentType: 'video/webm' });
            if (data) {
              const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(videoName);
              finalVideoUrl = publicUrl;
              console.log('[FinalScreen] Video collage uploaded:', publicUrl);
            }
          } else {
            console.warn('[FinalScreen] Video collage returned null, uploading last raw video as fallback');
            // Fallback: upload last raw video
            const capturedVideos = (state as any)?.capturedVideos || [];
            const lastVideoBlobUrl = capturedVideos[capturedVideos.length - 1];
            if (lastVideoBlobUrl) {
              const response = await fetch(lastVideoBlobUrl);
              const rawBlob = await response.blob();
              const videoName = `sessions/videos/${filePrefix}.webm`;
              const { data } = await supabase.storage.from('photos').upload(videoName, rawBlob, { contentType: 'video/webm' });
              if (data) {
                const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(videoName);
                finalVideoUrl = publicUrl;
              }
            }
          }
        } catch (e) { console.error("Video collage upload failed:", e); }

        // 5. Record Transaction in DB
        const { data: tr } = await supabase.from('transactions').insert({
          kiosk_id: kiosk?.kioskId || null,
          package_id: state?.packageId,
          voucher_id: state?.voucherId,
          amount: state?.finalPrice || 0,
          status: 'success',
          photo_url: finalPhotoUrl,
          original_urls: originalUrls.length > 0 ? originalUrls : null,
          gif_url: gifUrl || null,
          video_url: finalVideoUrl || null,
          payment_method: state?.paymentMethod || 'MANUAL',
          midtrans_order_id: state?.midtransOrderId || null,
        }).select().single();

        if (tr) {
          setTransactionId(tr.id);
          // Mark voucher used
          if (state?.voucherId) {
            await supabase.from('vouchers').update({
              is_used: true,
              used_at: new Date().toISOString()
            }).eq('id', state.voucherId);
          }
        }
      } catch (err) {
        console.error("Failed to record transaction:", err);
      } finally {
        setSaving(false);
      }
    }

    recordTransaction();
  }, [state, transactionId, saving, frameImageUrl, filterClass, kiosk?.kioskId, capturedImages]);

  const handlePrint = () => {
    setPrinting(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setPrintProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setPrinting(false);
        setPrintFinished(true);
      }
    }, 80);
  };
  const downloadUrl = transactionId ? `${qrBaseUrl}/download/${transactionId}` : '';
  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col md:flex-row overflow-hidden relative font-sans animate-kiosk-in text-white final-split-container">

      {/* Left: Animated Preview */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full relative flex items-center justify-center p-8 bg-black/40 final-split-left">
        <h2 className="absolute top-12 left-12 text-3xl font-bold text-slate-400">Animated GIF</h2>
        <div className="relative group">
          <div className="w-[450px] h-[450px] p-6 bg-white/5 backdrop-blur-xl border-4 border-indigo-500/30 rounded-[3rem] shadow-2xl overflow-hidden flex items-center justify-center">
            {capturedImages.length > 0 ? (
              <img src={capturedImages[animIndex]} className={`w-full h-full object-cover rounded-2xl ${filterClass}`} alt="GIF Anim" />
            ) : (
              <div className="w-full h-full bg-slate-800 animate-pulse rounded-2xl"></div>
            )}
            <div className="absolute inset-x-0 bottom-8 flex justify-center">
              <div className="bg-indigo-600/80 backdrop-blur-md px-6 py-2 rounded-full text-xs font-black tracking-[0.2em] uppercase border border-indigo-400">
                Looping Preview
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Printed Frame & Actions */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full p-8 md:p-16 flex flex-col items-center justify-center bg-slate-900 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] z-10 final-split-right">

        <div className="w-full max-w-lg mb-8 text-center md:text-left">
          <h1 className="text-4xl font-extrabold mb-2 text-white">Printed Frame</h1>
          <p className="text-slate-400 font-medium tracking-wide">Take a look at your physical copy</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center w-full max-w-4xl justify-center">

          <div className="flex flex-col items-center">
            <div className="relative w-[300px] shadow-2xl bg-white overflow-hidden rounded-md border-4 border-white/10 flex items-center justify-center p-0">
              <div className="relative inline-block w-full h-full">
                {frameImageUrl && (
                  <img src={frameImageUrl} className="w-full h-auto z-0 relative block" alt="Frame" />
                )}
                {layoutConfig.map((slot: any, index: number) => (
                  <div key={index} className="absolute overflow-hidden bg-black z-10"
                    style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${slot.w}%`, height: `${slot.h}%` }}>
                    {capturedImages[index] && (
                      <img src={capturedImages[index]} className={`w-full h-full object-cover scale-[1.01] ${filterClass}`} alt={`Shot`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="flex flex-col gap-6 w-72 items-center">

            {!printFinished ? (
              <button
                onClick={handlePrint}
                disabled={printing || saving || !transactionId}
                className={`w-full py-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all shadow-xl ${printing || saving || !transactionId
                  ? 'bg-slate-800 border-2 border-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 hover:scale-105 active:scale-95'
                  }`}
              >
                {saving && !transactionId ? (
                  <>
                    <div className="w-10 h-10 border-4 border-indigo-400 border-t-white rounded-full animate-spin"></div>
                    <span className="font-black text-sm uppercase tracking-widest">Saving Cloud Data...</span>
                  </>
                ) : printing ? (
                  <>
                    <div className="w-10 h-10 border-4 border-indigo-400 border-t-white rounded-full animate-spin"></div>
                    <span className="font-black text-sm uppercase tracking-widest">Printing {printProgress}%</span>
                  </>
                ) : (
                  <>
                    <Printer size={36} />
                    <span className="font-black text-lg uppercase tracking-widest">Print Photos</span>
                  </>
                )}
              </button>
            ) : (
              // Digital Copy QR Code
              <div className="bg-white p-6 rounded-3xl shadow-xl flex flex-col items-center animate-kiosk-in w-full">
                <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100 w-full flex items-center justify-center">
                  <QRCodeSVG
                    value={downloadUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    bgColor="#f8fafc"
                    fgColor="#0f172a"
                  />
                </div>
                <div className="flex items-center gap-2 text-indigo-600 font-bold mb-1">
                  <Download size={18} /> Digital Copy
                </div>
                <p className="text-xs text-slate-500 font-medium text-center leading-relaxed">
                  Scan QR code with your phone to download your photos, GIFs, and videos.
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              disabled={printing || saving}
              className="w-full py-6 rounded-2xl bg-slate-800/80 backdrop-blur-md border-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 flex flex-col items-center justify-center gap-2 transition-all font-black text-xs uppercase tracking-widest disabled:opacity-50 mt-auto shadow-lg"
            >
              <RefreshCcw size={20} />
              <span>Finish Session</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
