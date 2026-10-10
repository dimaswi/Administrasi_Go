import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebcamCaptureProps {
  onCapture: (base64Image: string) => void;
  onRetake?: () => void;
  title?: string;
  initialPhoto?: string | null;
}

export function WebcamCapture({
  onCapture,
  onRetake,
  title = "Verifikasi Wajah AI",
  initialPhoto = null,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(initialPhoto);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);

  // Start Camera
  const startCamera = useCallback(async () => {
    setIsLoadingCamera(true);
    setCameraError(null);

    // Stop existing stream if any
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser Anda tidak mendukung akses kamera langsung.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Gagal memulai kamera:", err);
      let msg = "Tidak dapat mengakses kamera. Pastikan izin kamera telah diizinkan.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Izin akses kamera ditolak oleh pengguna/browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Perangkat kamera tidak ditemukan di komputer/laptop ini.";
      } else if (err.name === "NotReadableError") {
        msg = "Kamera sedang digunakan oleh aplikasi lain.";
      }
      setCameraError(msg);
    } finally {
      setIsLoadingCamera(false);
    }
  }, []);

  useEffect(() => {
    if (!photo) {
      startCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [photo]);

  // Capture Photo
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setPhoto(dataUrl);
    onCapture(dataUrl);

    // Stop stream to save battery and resource
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  // Retake Photo
  const handleRetake = () => {
    setPhoto(null);
    if (onRetake) onRetake();
    startCamera();
  };



  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full aspect-[4/3] max-w-md rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-xl flex items-center justify-center">
        {photo ? (
          // Review Photo
          <div className="relative w-full h-full">
            <img
              src={photo}
              alt="Hasil Selfie"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 shadow">
              <Check className="w-3.5 h-3.5" /> Foto Siap Digunakan
            </div>
          </div>
        ) : cameraError ? (
          // Camera Error Fallback View
          <div className="p-6 text-center flex flex-col items-center justify-center text-slate-300 space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-rose-300">Kamera Tidak Tersedia</p>
              <p className="text-xs text-slate-400 max-w-[250px]">{cameraError}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2 w-full max-w-[200px]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Coba Lagi
              </Button>
            </div>
          </div>
        ) : (
          // Live Webcam View
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform ${
                isMirrored ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* AI Face Oval Guide */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div className="w-44 h-56 border-2 border-dashed border-emerald-400/70 rounded-[50%] animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center">
                <span className="text-[10px] text-emerald-300/80 font-medium bg-slate-900/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Posisikan Wajah di Sini
                </span>
              </div>
            </div>

            {/* AI Status Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Verifikasi Wajah AI Aktif</span>
            </div>

            {/* Mirror Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMirrored(!isMirrored)}
              className="absolute top-3 right-3 bg-slate-900/70 hover:bg-slate-800 text-white text-[11px] px-2 py-1 rounded-md backdrop-blur-sm border border-slate-700/50 transition-colors"
              title="Cerminkan Kamera"
            >
              {isMirrored ? 'Mode Normal' : 'Mode Cermin'}
            </button>
          </>
        )}
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Action Controls */}
      <div className="mt-3 flex items-center justify-center gap-2 w-full">
        {photo ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetake}
            className="text-xs text-slate-700 hover:text-slate-900 border-slate-300"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Ambil Ulang Foto
          </Button>
        ) : (
          !cameraError && (
            <Button
              type="button"
              onClick={handleCapture}
              disabled={isLoadingCamera}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-5 py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Ambil Foto Selfie
            </Button>
          )
        )}
      </div>
    </div>
  );
}
