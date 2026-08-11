import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle2, QrCode, Play, AlertCircle, Check, ShieldAlert } from 'lucide-react';
import { api } from '../lib/api';

interface QRScannerProps {
  targetEventId?: string;
  onResult: (result: { success: boolean; valid: boolean; message?: string; error?: string; ticket?: any }) => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ targetEventId, onResult }) => {
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;
    if (mode === 'camera') {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText) => {
          scanner?.clear();
          handleValidate(decodedText);
        },
        () => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [mode]);

  const handleValidate = async (data: string) => {
    if (!data.trim()) return;
    setLoading(true);
    try {
      const res = await api.validateTicket(data, targetEventId);
      onResult(res);
    } catch (err: any) {
      onResult({
        success: false,
        valid: false,
        error: err.message || 'Falha ao validar.'
      });
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
        userEmail: 'rafael.santos@verzel.com.br',
        issuedAt: now,
        signature: 'hmac_sha256_valid_signature_ok_2026'
      });
    } else if (type === 'used') {
      payload = JSON.stringify({
        ticketId: 't-demo-used-123',
        eventId: 'e1111111-1111-1111-1111-111111111111',
        seatId: 's-e1-A-2',
        userEmail: 'usuario.ja.validado@exemplo.com',
        issuedAt: now - 3600000,
        signature: 'hmac_sha256_used_signature_2026'
      });
      // Ensure local state marks this as used for demo
      const stored = api.getTickets();
      if (!stored.some(t => t.id === 't-demo-used-123')) {
        stored.push({
          id: 't-demo-used-123',
          event_id: 'e1111111-1111-1111-1111-111111111111',
          seat_id: 's-e1-A-2',
          user_email: 'usuario.ja.validado@exemplo.com',
          user_name: 'Usuário (Já Entrou)',
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
        eventId: 'e3333333-3333-3333-3333-333333333333', // AI Conference event ID
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
    <div className="w-full bg-[#111113] p-5 rounded-xl border border-zinc-800/60 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <QrCode className="w-4 h-4 text-zinc-400" />
          Leitor QR / Portaria
        </h3>

        <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800/60">
          <button
            onClick={() => setMode('manual')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Manual / Testes
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors ${
              mode === 'camera'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Camera className="w-3 h-3" />
            Câmera
          </button>
        </div>
      </div>

      {/* Preset Quick Tests (Edital Verzel - 4 States) */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
          Testar Estados de Validação (Edital Verzel)
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
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
      </div>

      {mode === 'camera' ? (
        <div className="flex flex-col items-center pt-2">
          <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900" />
          <p className="text-xs text-zinc-600 mt-3 text-center">
            Aproxime o QR Code da câmera do celular/computador.
          </p>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <textarea
            rows={3}
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder='Cole o payload JSON, link do ingresso ou clique em um dos testes acima...'
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 font-mono placeholder-zinc-700 outline-none focus:border-zinc-600 transition-colors resize-none"
          />

          <button
            onClick={() => handleValidate(manualInput)}
            disabled={loading || !manualInput.trim()}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Validar entrada
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
