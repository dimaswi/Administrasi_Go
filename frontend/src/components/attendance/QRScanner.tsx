import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, SwitchCamera, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScan: (scannedText: string) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScan,
  onCancel,
  isProcessing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const isScannedRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(isProcessing);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanned, setIsScanned] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Cleanly stop all active video tracks
  const stopStream = useCallback(() => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Safe handler when QR code is detected
  const handleFoundCode = useCallback((rawData: string) => {
    isScannedRef.current = true;
    setIsScanned(true);
    setScanResult(rawData);

    if (navigator.vibrate) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {}
    }

    onScan(rawData);
  }, [onScan]);

  // Start camera with multi-tier progressive fallback
  const startCamera = useCallback(async () => {
    stopStream();
    setCameraError(null);
    setIsScanned(false);
    isScannedRef.current = false;
    setScanResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCamera(false);
      setCameraError('Browser ini tidak mendukung akses kamera langsung (getUserMedia). Pastikan Anda membuka web lewat HTTPS.');
      return;
    }

    // Try multiple constraint variations so it works on laptops, external webcams, and mobile devices
    const attempts: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: facingMode,
        },
        audio: false,
      },
      {
        video: {
          facingMode: facingMode === 'environment' ? 'user' : 'environment',
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let acquiredStream: MediaStream | null = null;
    let lastErr: any = null;

    for (const constraint of attempts) {
      try {
        acquiredStream = await navigator.mediaDevices.getUserMedia(constraint);
        if (acquiredStream) break;
      } catch (err: any) {
        lastErr = err;
        // User explicitly denied permission -> don't spam prompt
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          break;
        }
      }
    }

    if (!acquiredStream) {
      setHasCamera(false);
      if (lastErr?.name === 'NotAllowedError' || lastErr?.name === 'PermissionDeniedError') {
        setCameraError('Izin akses kamera ditolak. Harap klik ikon gembok/izin di address bar browser dan pilih "Izinkan" untuk kamera.');
      } else if (lastErr?.name === 'NotFoundError' || lastErr?.name === 'DevicesNotFoundError') {
        setCameraError('Perangkat kamera tidak ditemukan pada perangkat ini.');
      } else if (lastErr?.name === 'NotReadableError') {
        setCameraError('Kamera sedang digunakan aplikasi lain. Tutup aplikasi yang sedang memakai kamera dan coba lagi.');
      } else {
        setCameraError('Tidak dapat membuka kamera. Pastikan kamera terpasang dan izin kamera diaktifkan.');
      }
      return;
    }

    activeStreamRef.current = acquiredStream;
    setHasCamera(true);
    setCameraError(null);

    // Safely attach stream to video element
    const attachVideo = () => {
      const video = videoRef.current;
      if (!video) {
        setTimeout(attachVideo, 60);
        return;
      }
      video.srcObject = acquiredStream;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('muted', 'true');
      video.muted = true;
      video.play().catch((e) => console.warn('Non-fatal video play warning:', e));
    };

    attachVideo();
  }, [facingMode, stopStream]);

  // Launch camera on mount / facingMode change
  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  // QR Scanning Loop using native BarcodeDetector if available, falling back to jsQR
  const scanLoop = useCallback(async () => {
    if (isScannedRef.current || isProcessingRef.current) return;

    const video = videoRef.current;
    if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      // 1. Try Native BarcodeDetector (Chrome / Edge / Android)
      let foundNative = false;
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            const rawData = barcodes[0].rawValue.trim();
            if (rawData.length > 0) {
              foundNative = true;
              handleFoundCode(rawData);
              return;
            }
          }
        } catch {
          // ignore and fallback to jsQR
        }
      }

      // 2. Fallback to jsQR canvas processing
      if (!foundNative) {
        const canvas = canvasRef.current;
        if (canvas) {
          const width = video.videoWidth;
          const height = video.videoHeight;
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const imageData = ctx.getImageData(0, 0, width, height);

            const decodeFn = typeof jsQR === 'function' ? jsQR : (jsQR as any)?.default;
            if (typeof decodeFn === 'function') {
              try {
                const code = decodeFn(imageData.data, imageData.width, imageData.height, {
                  inversionAttempts: 'attemptBoth',
                });
                if (code && code.data && code.data.trim().length > 0) {
                  handleFoundCode(code.data.trim());
                  return;
                }
              } catch (decodeErr) {
                console.warn('Decode error:', decodeErr);
              }
            }
          }
        }
      }
    }

    animFrameId.current = requestAnimationFrame(scanLoop);
  }, [handleFoundCode]);

  // Video data ready listener
  const handleVideoLoadedData = () => {
    if (!isScannedRef.current && !isProcessingRef.current) {
      animFrameId.current = requestAnimationFrame(scanLoop);
    }
  };

  // Switch between front & back camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Reset scanner
  const handleResetScan = () => {
    isScannedRef.current = false;
    setIsScanned(false);
    setScanResult(null);
    animFrameId.current = requestAnimationFrame(scanLoop);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-slate-950 text-white shadow-inner flex flex-col items-center justify-center">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Container */}
      <div className="relative w-full aspect-square max-h-[300px] sm:max-h-[340px] flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          onLoadedData={handleVideoLoadedData}
          onPlay={handleVideoLoadedData}
          className="w-full h-full object-cover"
          muted
          autoPlay
          playsInline
        />

        {/* Viewfinder Target Overlay */}
        {hasCamera && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            {/* Dark vignette backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

            {/* Target Box */}
            <div className="relative z-10 w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] rounded-2xl bg-transparent border-2 border-white/40 shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Glowing Corner Brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-400 rounded-br-lg" />

              {/* Animated Scanning Laser Line */}
              {!isScanned && !isProcessing && (
                <div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-500 shadow-[0_0_12px_#c084fc] animate-pulse"
                  style={{
                    animation: 'scanLaser 2s ease-in-out infinite alternate',
                  }}
                />
              )}

              {/* Success Badge */}
              {isScanned && (
                <div className="z-20 bg-emerald-600/90 text-white px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-lg backdrop-blur-md animate-in zoom-in-90">
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>QR Terdeteksi!</span>
                </div>
              )}
            </div>

            {/* Instruction text below target */}
            <p className="relative z-10 mt-3 text-[11px] text-white/80 font-medium text-center bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
              {isScanned
                ? 'Sedang memproses presensi rapat...'
                : 'Posisikan QR Code rapat di dalam kotak'}
            </p>
          </div>
        )}

        {/* Camera Error / Permission Denied */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Akses Kamera Terkendala</h4>
            <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">
              {cameraError}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={startCamera}
                className="text-xs text-white border-white/20 hover:bg-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Coba Lagi
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls Bar */}
      <div className="w-full bg-slate-900/90 px-4 py-2.5 flex items-center justify-between border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                hasCamera ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                hasCamera ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="text-[11px] text-slate-300 font-medium">
            {hasCamera ? 'Pemindai Aktif' : cameraError ? 'Kamera Gagal' : 'Menghubungkan Kamera...'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {isScanned && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetScan}
              className="h-7 text-[11px] text-purple-300 hover:text-white hover:bg-purple-900/40"
            >
              <RefreshCw className="w-3 h-3 mr-1" /> Pindai Ulang
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFlipCamera}
            title="Ganti Kamera Depan / Belakang"
            className="h-7 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <SwitchCamera className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">
              {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
            </span>
          </Button>
        </div>
      </div>

      {/* Embedded CSS for scan laser animation */}
      <style>{`
        @keyframes scanLaser {
          0% {
            top: 5%;
            opacity: 0.9;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 92%;
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  );
};
