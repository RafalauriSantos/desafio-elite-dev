import React, { useState, useEffect } from 'react';
import { SeatItem } from '../lib/api';
import { ShieldCheck, Lock, CheckCircle2, Clock, Sparkles, ArrowRight } from 'lucide-react';

interface SeatMapProps {
  seats: SeatItem[];
  selectedSeatId: string | null;
  onSelectSeat: (seat: SeatItem) => void;
  isReserving?: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatId,
  onSelectSeat,
  isReserving = false,
}) => {
  // Group seats by row
  const rows = Array.from(new Set(seats.map((s) => s.row_name))).sort();
  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  // Timer countdown simulation
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (!selectedSeatId) return;
    setTimeLeft(600);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedSeatId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-[#141417] p-6 sm:p-10 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden space-y-8">
      {/* Stage Screen Backdrop (Curved Top Screen with Light Beam) */}
      <div className="relative text-center">
        <div className="w-full h-14 stage-beam rounded-b-full flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <span className="text-xs uppercase tracking-[0.35em] font-mono font-extrabold text-emerald-400 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> TELA / PALCO PRINCIPAL
          </span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="flex flex-col gap-4 items-center overflow-x-auto pb-4">
        {rows.map((rowName) => {
          const rowSeats = seats
            .filter((s) => s.row_name === rowName)
            .sort((a, b) => a.seat_number - b.seat_number);

          return (
            <div key={rowName} className="flex items-center gap-3">
              {/* Row Label */}
              <span className="w-6 text-center font-bold text-sm text-zinc-500 font-mono">
                {rowName}
              </span>

              {/* Seats in Row */}
              <div className="flex gap-2 sm:gap-3">
                {rowSeats.map((seat) => {
                  const isSelected = seat.id === selectedSeatId;
                  const isAvailable = seat.status === 'available';
                  const isLocked = seat.status === 'locked';
                  const isSold = seat.status === 'sold';

                  let seatStyle = 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border-zinc-700';

                  if (isAvailable) {
                    if (seat.category === 'VIP') {
                      seatStyle = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20';
                    } else if (seat.category === 'Premium') {
                      seatStyle = 'bg-cyan-950/70 text-cyan-300 border-cyan-500/50 hover:bg-cyan-400 hover:text-zinc-950 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/20';
                    } else {
                      seatStyle = 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-white';
                    }
                  }

                  if (isLocked) {
                    seatStyle = 'bg-amber-950/50 text-amber-400 border-amber-500/40 cursor-not-allowed';
                  }

                  if (isSold) {
                    seatStyle = 'bg-zinc-950 text-zinc-700 border-zinc-800 cursor-not-allowed opacity-40';
                  }

                  if (isSelected) {
                    seatStyle = 'bg-emerald-400 text-zinc-950 font-extrabold border-emerald-300 shadow-2xl shadow-emerald-500/50 scale-110 ring-2 ring-emerald-300 z-10';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={!isAvailable || isReserving}
                      onClick={() => onSelectSeat(seat)}
                      title={`Fileira ${seat.row_name} - Assento ${seat.seat_number} (${seat.category}): R$ ${seat.price.toFixed(2)}`}
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl border font-mono font-bold text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-200 active:scale-95 relative group ${seatStyle}`}
                    >
                      <span>{seat.seat_number}</span>

                      {/* Status Overlay Icon */}
                      {isLocked && <Lock className="w-3 h-3 text-amber-400 absolute bottom-1" />}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 absolute bottom-1" />}

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-[#09090b] text-zinc-100 text-[11px] py-1.5 px-3 rounded-xl shadow-2xl border border-zinc-700 whitespace-nowrap z-30 pointer-events-none animate-in fade-in duration-150">
                        <span className="font-bold text-emerald-400 font-mono">Fileira {seat.row_name} • Assento {seat.seat_number}</span>
                        <span className="text-zinc-300 font-medium">{seat.category} - R$ {seat.price.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Order Summary Dock (UI/UX Pro Max) */}
      {selectedSeat && (
        <div className="bg-[#09090b]/95 backdrop-blur-xl border border-emerald-500/40 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl shadow-emerald-500/10 animate-in slide-in-from-bottom-3 duration-300">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider font-bold">Assento Selecionado:</span>
                <span className="font-mono font-extrabold text-white text-base bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Fileira {selectedSeat.row_name} • N° {selectedSeat.seat_number}
                </span>
                <span className="bg-emerald-950 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                  {selectedSeat.category}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-1 font-medium">
                Total: <span className="text-emerald-400 font-mono font-extrabold text-sm">R$ {selectedSeat.price.toFixed(2)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-zinc-800 pt-3 sm:pt-0">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-800/60 font-mono font-bold">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Retenção: {formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend & Concurrency Assurance */}
      <div className="pt-6 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-zinc-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-950 border border-emerald-500"></span>
            <span>VIP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-cyan-950 border border-cyan-500"></span>
            <span>Premium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-zinc-900 border border-zinc-700"></span>
            <span>Standard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-950 border border-amber-600 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
            </span>
            <span>Bloqueado (Reservando)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-zinc-950 border border-zinc-800 opacity-50"></span>
            <span>Vendido</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 px-3.5 py-1.5 rounded-full border border-emerald-800/60 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Trava de Concorrência FOR UPDATE em Nível de Banco</span>
        </div>
      </div>
    </div>
  );
};
