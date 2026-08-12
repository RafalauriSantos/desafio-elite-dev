import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CheckCircle2, QrCode, ChevronDown, ChevronUp, ShieldAlert, RefreshCw, Volume2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface QRScannerProps {
  targetEventId?: string;
  onResult: (result: { success: boolean; valid: boolean; code?: string; message?: string; error?: string; ticket?: any }) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ targetEventId, onResult }) => {
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [showTestPresets, setShowTestPresets] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Active validation modal overlay state
  const [activeOverlay, setActiveOverlay] = useState<{
    valid: boolean;
    code: string;
    message: string;
    ticket?: any;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Helper Web Audio BEEP synthesizer for instant audio feedback
  const playBeep = (valid: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (valid) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitched pleasant A5 beep
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low warning sound
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Ignore audio context autoplay restrictions
    }
  };

  // Initialize and list cameras when switching to camera mode
  useEffect(() => {
    if (mode === 'camera') {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            setCameras(devices);
            // Default to back camera or first device
            const backCam = devices.find((d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('traseira'));
            setSelectedCameraId(backCam ? backCam.id : devices[0].id);
            setCameraError(null);
          } else {
            setCameraError('Nenhuma câmera encontrada no dispositivo.');
          }
        })
        .catch((err) => {
          setCameraError('Permissão de câmera negada ou indisponível: ' + (err.message || err));
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [mode]);

  // Start camera scanning when selectedCameraId changes
  useEffect(() => {
    if (mode === 'camera' && selectedCameraId) {
      startCamera(selectedCameraId);
    }
  }, [selectedCameraId, mode]);

  const startCamera = async (cameraId: string) => {
    await stopCamera();
    try {
      const html5QrCode = new Html5Qrcode('qr-reader-viewport');
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 }
        },
        async (decodedText) => {
          // Pause camera during validation processing
          try {
            await html5QrCode.pause();
          } catch {}
          await handleValidate(decodedText);
          // Resume camera scan after 3 seconds
          setTimeout(() => {
            try {
              html5QrCode.resume();
            } catch {}
          }, 3000);
        },
        () => {}
      );
      setIsScanning(true);
      setCameraError(null);
    } catch (err: any) {
      setIsScanning(false);
      setCameraError('Erro ao iniciar a câmera: ' + (err.message || err));
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch {}
      html5QrCodeRef.current = null;
      setIsScanning(false);
    }
  };

  const handleValidate = async (data: string) => {
    if (!data.trim()) return;
    setLoading(true);
    try {
      const res = await api.validateTicket(data, targetEventId);

      // Audio & Haptic Feedback
      playBeep(res.valid);
      if (res.valid) {
        navigator.vibrate?.([80]);
      } else {
        navigator.vibrate?.([100, 50, 100]);
      }

      const overlayState = {
        valid: res.valid,
        code: res.code || (res.valid ? 'VALID' : 'INVALID'),
        message: res.valid ? (res.message || 'ENTRADA LIBERADA!') : (res.error || 'ACESSO NEGADO'),
        ticket: res.ticket
      };

      setActiveOverlay(overlayState);
      onResult(res);

      // Auto dismiss modal overlay after 4 seconds
      setTimeout(() => {
        setActiveOverlay(null);
      }, 4000);
    } catch (err: any) {
      playBeep(false);
      navigator.vibrate?.([100, 50, 100]);
      setActiveOverlay({
        valid: false,
        code: 'INVALID',
        message: err.message || 'Falha na validação do QR Code.'
      });

      onResult({
        success: false,
        valid: false,
        code: 'INVALID',
        error: err.message || 'Falha na validação do QR Code.'
      });

      setTimeout(() => {
        setActiveOverlay(null);
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  const setTestPreset = (type: 'valid' | 'used' | 'invalid' | 'wrong_event') => {
    let payload = '';
    const now = Date.now();

    if (type === 'valid') {
      payload = JSON.stringify({
        ticketId: 't-demo-valid-' + Math.floor(Math.random() * 1000),
        eventId: 'e1111111-1111-1111-1111-111111111111',
        seatId: 's-e1-A-1',
        userEmail: 'ana.cliente@verzel.com',
        issuedAt: now,
        signature: 'hmac_sha256_valid_signature_ok_2026'
      });
    } else if (type === 'used') {
      payload = JSON.stringify({
        ticketId: 't-demo-used-123',
        eventId: 'e1111111-1111-1111-1111-111111111111',
        seatId: 's-e1-A-2',
        userEmail: 'bruno.cliente@verzel.com',
        issuedAt: now - 3600000,
        signature: 'hmac_sha256_used_signature_2026'
      });

      const stored = api.getTickets();
      if (!stored.some((t) => t.id === 't-demo-used-123')) {
        stored.push({
          id: 't-demo-used-123',
          event_id: 'e1111111-1111-1111-1111-111111111111',
          seat_id: 's-e1-A-2',
          user_email: 'bruno.cliente@verzel.com',
          user_name: 'Bruno Cliente (Já Entrou)',
          status: 'used',
          qr_signature: 'hmac_sha256_used_signature_2026',
          created_at: new Date().toISOString(),
          events: { id: 'e1111111-1111-1111-1111-111111111111', title: 'Tech Summit Elite 2026', description: 'Tech Summit', venue: 'Arena Innovation Hub', date: new Date().toISOString(), price: 299.90, banner_url: '' },
          seats: { id: 's-e1-A-2', event_id: 'e1', row_name: 'A', seat_number: 2, category: 'VIP', price: 499.90, status: 'sold' }
        });
        localStorage.setItem('elite_tickets_demo', JSON.stringify(stored));
      }
    } else if (type === 'invalid') {
      payload = JSON.stringify({
        ticketId: 't-forged-999',
        eventId: 'e1111111-1111-1111-1111-111111111111',
        seatId: 's-e1-A-3',
        userEmail: 'hacker@exemplo.com',
        issuedAt: now,
        signature: 'INVALID_SIGNATURE_FORGED_HMAC'
      });
    } else if (type === 'wrong_event') {
      payload = JSON.stringify({
        ticketId: 't-wrong-event-456',
        eventId: 'e3333333-3333-3333-3333-333333333333',
        seatId: 's-e3-B-4',
        userEmail: 'visitante@outroevento.com',
        issuedAt: now,
        signature: 'hmac_sha256_wrong_event_signature'
      });
    }

    setManualInput(payload);
    handleValidate(payload);
  };

  return (
    <div className="w-full bg-[#111113] p-5 rounded-xl border border-zinc-800/60 space-y-4 relative overflow-hidden">
      {/* Modal Overlay / Result Alert */}
      {activeOverlay && (
        <div
          className={`absolute inset-0 z-50 p-6 flex flex-col items-center justify-center text-center backdrop-blur-xl transition-all animate-in fade-in zoom-in duration-200 ${
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
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-3 animate-bounce" />
          ) : (
            <ShieldAlert className="w-16 h-16 text-amber-400 mb-3 animate-pulse" />
          )}

          <h2 className="text-xl font-bold uppercase tracking-wide font-mono">
            {activeOverlay.valid
              ? 'ENTRADA LIBERADA'
              : activeOverlay.code === 'ALREADY_USED'
              ? 'INGRESSO JÁ UTILIZADO'
              : activeOverlay.code === 'WRONG_EVENT'
              ? 'EVENTO INCORRETO'
              : 'ASSINATURA INVÁLIDA'}
          </h2>

          <p className="text-sm mt-2 max-w-xs opacity-90 leading-relaxed font-sans">
            {activeOverlay.message}
          </p>

          {activeOverlay.ticket && (
            <div className="mt-4 pt-3 border-t border-white/20 text-xs font-mono w-full max-w-xs text-left space-y-1 bg-black/30 p-3 rounded-lg">
              <div><span className="opacity-60">Titular:</span> {activeOverlay.ticket.user_name || activeOverlay.ticket.user_email}</div>
              <div><span className="opacity-60">Assento:</span> Fileira {activeOverlay.ticket.seats?.row_name || 'A'} - Nº {activeOverlay.ticket.seats?.seat_number || 1}</div>
              <div><span className="opacity-60">REF:</span> #{activeOverlay.ticket.id?.slice(0, 8)}</div>
            </div>
          )}

          <button
            onClick={() => setActiveOverlay(null)}
            className="mt-5 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-colors"
          >
            Fechar aviso
          </button>
        </div>
      )}

      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <QrCode className="w-4 h-4 text-emerald-400" />
          Leitor QR / Scanner de Portaria
        </h3>

        <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800/60">
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Manual / Leitura
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`px-3 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              mode === 'camera'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            Câmera Vivo
          </button>
        </div>
      </div>

      {/* Retractable Debug Accordion */}
      <div className="border border-zinc-800/60 rounded-lg overflow-hidden bg-zinc-900/30">
        <button
          type="button"
          onClick={() => setShowTestPresets(!showTestPresets)}
          className="w-full px-3 py-2 text-[11px] font-mono font-medium text-zinc-400 hover:text-white flex items-center justify-between transition-colors"
        >
          <span>Modo de Avaliação / Teste de Estados (Edital)</span>
          {showTestPresets ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTestPresets && (
          <div className="p-3 border-t border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-zinc-950/40">
            <button
              type="button"
              onClick={() => setTestPreset('valid')}
              className="px-2 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/50 rounded-lg text-[11px] font-medium text-emerald-400 text-left transition-colors truncate"
            >
              🟢 1. VÁLIDO
            </button>
            <button
              type="button"
              onClick={() => setTestPreset('used')}
              className="px-2 py-1.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 rounded-lg text-[11px] font-medium text-amber-400 text-left transition-colors truncate"
            >
              🟡 2. JÁ USADO
            </button>
            <button
              type="button"
              onClick={() => setTestPreset('invalid')}
              className="px-2 py-1.5 bg-red-950/40 hover:bg-red-900/50 border border-red-800/50 rounded-lg text-[11px] font-medium text-red-400 text-left transition-colors truncate"
            >
              🔴 3. INVÁLIDO
            </button>
            <button
              type="button"
              onClick={() => setTestPreset('wrong_event')}
              className="px-2 py-1.5 bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/50 rounded-lg text-[11px] font-medium text-blue-400 text-left transition-colors truncate"
            >
              🔵 4. EVENTO ERRADO
            </button>
          </div>
        )}
      </div>

      {mode === 'camera' ? (
        <div className="flex flex-col items-center pt-2 space-y-3">
          {/* Camera Selector Dropdown */}
          {cameras.length > 1 && (
            <div className="w-full max-w-sm flex items-center justify-between bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 text-xs">
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
          <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 min-h-[260px] flex items-center justify-center">
            <div id="qr-reader-viewport" className="w-full h-full min-h-[260px]" />

            {/* Glowing Laser Scan Animation Overlay */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-emerald-500/80 rounded-xl relative overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981] animate-[bounce_2s_infinite]" />
                </div>
              </div>
            )}

            {cameraError && (
              <div className="p-4 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">{cameraError}</p>
                <button
                  onClick={() => selectedCameraId && startCamera(selectedCameraId)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
                </button>
              </div>
            )}
          </div>

          <p className="text-xs text-zinc-500 text-center font-mono">
            Aproxime o QR Code do ingresso da lente da câmera.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <textarea
            rows={3}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder='Cole o payload JSON, hash HMAC ou escaneie via câmera...'
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono placeholder-zinc-700 outline-none focus:border-zinc-600 transition-colors resize-none"
          />

          <button
            onClick={() => handleValidate(manualInput)}
            disabled={loading || !manualInput.trim()}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Validar entrada de portaria
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
