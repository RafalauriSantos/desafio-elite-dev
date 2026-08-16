import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, GatekeeperValidationResult, TicketItem } from '../lib/api';
import {
  Camera,
  Keyboard,
  Upload,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export interface QRScannerHandle {
  validate: (qrText: string) => Promise<void>;
}

interface QRScannerProps {
  onResult: (result: GatekeeperValidationResult) => void;
  targetEventId?: string;
}

export const QRScanner = forwardRef<QRScannerHandle, QRScannerProps>(({ onResult, targetEventId = 'all' }, ref) => {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Active validation modal overlay state
  const [activeOverlay, setActiveOverlay] = useState<{
    valid: boolean;
    code: string;
    message: string;
    ticket?: TicketItem;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scanInFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const resumeTimerRef = useRef<number | null>(null);

  // Helper Web Audio synthesizer for clean audio feedback
  const playBeep = (valid: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (valid) {
        // Melodic 2-tone success chime (A5 -> E6)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.08);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.08);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.35);
      } else {
        // Low double-pulse warning buzzer
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Ignore audio context restrictions
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
      void stopCamera();
    };
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      void initCameras();
    } else {
      void stopCamera();
    }
  }, [mode]);

  const initCameras = async () => {
    setCameraError(null);
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        const backCamera =
          devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('traseira') ||
              d.label.toLowerCase().includes('environment')
          ) || devices[0];

        setSelectedCameraId(backCamera.id);
        await startCamera(backCamera.id);
      } else {
        await startMobileCamera();
      }
    } catch {
      setCameraError('Permissão de câmera não concedida. Use o modo manual ou envie uma imagem.');
    }
  };

  const startCamera = async (cameraId: string) => {
    await stopCamera();
    if (!mountedRef.current) return;

    try {
      const scannerId = 'qr-reader-viewport';
      let element = document.getElementById(scannerId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(scannerId, {
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });

      html5QrCodeRef.current = html5QrCode;

      const cameraConfig = cameraId || { facingMode: 'environment' };

      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.max(160, Math.floor(minEdge * 0.92));
            return { width: edgeSize, height: edgeSize };
          },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        async (decodedText) => {
          if (scanInFlightRef.current || html5QrCodeRef.current !== html5QrCode) return;
          scanInFlightRef.current = true;
          try {
            await html5QrCode.pause();
          } catch {}
          try {
            await handleValidate(decodedText);
          } finally {
            scanInFlightRef.current = false;
            resumeTimerRef.current = window.setTimeout(() => {
              if (html5QrCodeRef.current !== html5QrCode || !mountedRef.current) return;
              try {
                html5QrCode.resume();
              } catch {}
            }, 3000);
          }
        },
        () => {}
      );
      if (mountedRef.current && html5QrCodeRef.current === html5QrCode) {
        setIsScanning(true);
        setCameraError(null);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setIsScanning(false);
        const message = err instanceof Error ? err.message : String(err);
        setCameraError('Erro ao iniciar câmera: ' + message);
      }
    }
  };

  const startMobileCamera = async () => {
    await startCamera('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setCameraError(null);
    try {
      const tempElementId = 'qr-reader-file-temp';
      let tempEl = document.getElementById(tempElementId);
      if (!tempEl) {
        tempEl = document.createElement('div');
        tempEl.id = tempElementId;
        tempEl.style.display = 'none';
        document.body.appendChild(tempEl);
      }
      const html5QrCode = new Html5Qrcode(tempElementId, {
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        verbose: false,
      });
      const decodedText = await html5QrCode.scanFile(file, true);
      await html5QrCode.clear();
      await handleValidate(decodedText);
    } catch {
      setCameraError('Não foi possível identificar o QR Code na imagem fornecida.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const stopCamera = async () => {
    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;
    scanInFlightRef.current = false;
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {}
    }
    if (mountedRef.current) setIsScanning(false);
  };

  const handleValidate = async (data: string) => {
    if (!data.trim()) return;
    setLoading(true);
    try {
      const res = await api.validateTicket(data, targetEventId);

      // Audio Feedback
      playBeep(res.valid);
      try {
        if (res.valid) {
          navigator.vibrate?.([80]);
        } else {
          navigator.vibrate?.([100, 50, 100]);
        }
      } catch {}

      const overlayState = {
        valid: res.valid,
        code: res.code || (res.valid ? 'VALID' : 'INVALID'),
        message: res.valid ? res.message || 'ENTRADA LIBERADA!' : res.error || res.message || 'ACESSO NEGADO',
        ticket: res.ticket,
      };

      setActiveOverlay(overlayState);
      onResult(res);

      // Auto dismiss modal overlay after 3.5 seconds
      setTimeout(() => {
        setActiveOverlay(null);
      }, 3500);
    } catch (err: unknown) {
      playBeep(false);
      try {
        navigator.vibrate?.([100, 50, 100]);
      } catch {}
      const message = err instanceof Error ? err.message : 'Falha na validação do QR Code.';
      setActiveOverlay({
        valid: false,
        code: 'INVALID',
        message,
      });

      onResult({
        success: false,
        valid: false,
        code: 'INVALID',
        error: message,
      });

      setTimeout(() => {
        setActiveOverlay(null);
      }, 3500);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    validate: handleValidate,
  }));

  return (
    <div className="w-full bg-[#111113] rounded-3xl border border-zinc-800 p-5 space-y-4 shadow-2xl relative overflow-hidden">
      {/* HUD Heads-Up Result Alert */}
      {activeOverlay && (
        <div
          className={`absolute inset-0 z-50 p-6 flex flex-col items-center justify-center text-center backdrop-blur-2xl transition-all animate-in zoom-in-95 duration-200 ${
            activeOverlay.valid
              ? 'bg-emerald-950/95 border-2 border-emerald-500 text-emerald-100'
              : activeOverlay.code === 'WRONG_EVENT'
              ? 'bg-blue-950/95 border-2 border-blue-500 text-blue-100'
              : activeOverlay.code === 'ALREADY_USED'
              ? 'bg-amber-950/95 border-2 border-amber-500 text-amber-100'
              : 'bg-red-950/95 border-2 border-red-500 text-red-100'
          }`}
        >
          {activeOverlay.valid ? (
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 animate-bounce" />
          ) : (
            <ShieldAlert className="w-16 h-16 text-amber-400 mb-2 animate-pulse" />
          )}

          <h2 className="text-xl font-bold uppercase tracking-wide font-mono">
            {activeOverlay.valid
              ? 'ACESSO AUTORIZADO'
              : activeOverlay.code === 'ALREADY_USED'
              ? 'INGRESSO JÁ UTILIZADO'
              : activeOverlay.code === 'WRONG_EVENT'
              ? 'EVENTO INCORRETO'
              : 'INGRESSO INVÁLIDO'}
          </h2>

          <p className="text-sm mt-1.5 max-w-xs opacity-90 leading-relaxed font-medium">
            {activeOverlay.message}
          </p>

          {activeOverlay.ticket && (
            <div className="mt-3.5 pt-3 border-t border-white/20 text-xs font-mono w-full max-w-xs text-left space-y-1 bg-black/40 p-3.5 rounded-xl">
              <div><span className="opacity-60">Titular:</span> {activeOverlay.ticket.user_name || activeOverlay.ticket.user_email}</div>
              <div><span className="opacity-60">Assento:</span> {activeOverlay.ticket.seats?.row_name || 'A'}{activeOverlay.ticket.seats?.seat_number || 1}</div>
              <div><span className="opacity-60">REF:</span> #{activeOverlay.ticket.id?.slice(0, 8)}</div>
            </div>
          )}

          <button
            onClick={() => setActiveOverlay(null)}
            className="mt-4 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all active:scale-[0.98]"
          >
            Próxima leitura
          </button>
        </div>
      )}

      {/* Mode Switcher Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3.5">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'manual'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Digitar / Colar</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('camera')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'camera'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Câmera Vivo</span>
          </button>
        </div>

        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0">
          <Upload className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ler Foto</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {mode === 'camera' ? (
        <div className="flex flex-col items-center space-y-3">
          {/* Camera Selector Dropdown */}
          {cameras.length > 1 && (
            <div className="w-full max-w-sm flex items-center justify-between bg-zinc-900/90 px-3.5 py-2 rounded-xl border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-mono text-[10px]">Câmera:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="bg-transparent text-white text-xs outline-none cursor-pointer font-medium"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                    {c.label || `Câmera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Camera Viewport & Scan Target Overlay */}
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-zinc-700/60 bg-zinc-950 min-h-[280px] flex items-center justify-center shadow-2xl">
            <div id="qr-reader-viewport" className="w-full h-full min-h-[280px]" />

            {/* Single Clean Google Lens / Boarding Pass Corner Frame */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                {/* Top Floating HUD Status */}
                <div className="absolute top-3 inset-x-0 flex justify-center">
                  <div className="px-3 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md border border-emerald-500/40 flex items-center gap-2 text-[10px] font-mono font-bold text-emerald-400 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>SCANNER ÓPTICO ATIVO</span>
                  </div>
                </div>

                {/* Single Corner Brackets Target Frame */}
                <div className="w-56 h-56 relative rounded-2xl">
                  {/* 4 Precision Corner Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[3.5px] border-l-[3.5px] border-emerald-400 rounded-tl-xl shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[3.5px] border-r-[3.5px] border-emerald-400 rounded-tr-xl shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3.5px] border-l-[3.5px] border-emerald-400 rounded-bl-xl shadow-[0_0_12px_rgba(16,185,129,0.4)]" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3.5px] border-r-[3.5px] border-emerald-400 rounded-br-xl shadow-[0_0_12px_rgba(16,185,129,0.4)]" />

                  {/* Smooth Sweeping Laser Line Inside Frame */}
                  <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-scan-sweep" />
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-6 text-center space-y-3 z-10">
                <AlertCircle className="w-9 h-9 text-amber-400 mx-auto" />
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => void startMobileCamera()}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-400 font-medium text-center flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Centralize o QR Code no retângulo de foco para validação instantânea.</span>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            rows={3}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            onPaste={(e) => {
              const pasted = e.clipboardData?.getData('text') || '';
              if (pasted.trim()) {
                setManualInput(pasted.trim());
                void handleValidate(pasted.trim());
              }
            }}
            placeholder="Cole o código do ingresso aqui (validação instantânea automática ao colar)..."
            className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-2xl p-4 text-xs text-zinc-200 font-mono placeholder-zinc-600 outline-none focus:border-emerald-500 transition-all resize-none"
          />

          <button
            onClick={() => handleValidate(manualInput)}
            disabled={loading || !manualInput.trim()}
            className="w-full min-h-[48px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Validar Acesso de Portaria</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

QRScanner.displayName = 'QRScanner';
