import React from 'react';
import { SeatItem } from '../lib/api';
import { Sparkles, Flame } from 'lucide-react';

interface SeatMapProps {
  seats: SeatItem[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: SeatItem) => void;
  isReserving?: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  isReserving = false,
}) => {
  const rows = Array.from(new Set(seats.map((s) => s.row_name))).sort();

  const totalSeats = seats.length;
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  const availableVip = seats.filter((s) => s.status === 'available' && s.category === 'VIP').length;
  const occupancyPct = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

  return (
    <div className="w-full bg-[#111113] p-4 sm:p-8 rounded-2xl border border-zinc-800 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Dynamic Occupancy & Urgência Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-800/50 text-amber-300 font-semibold">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{occupancyPct}% Reservado ({totalSeats - availableSeats}/{totalSeats})</span>
          </div>
          {availableVip > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Apenas {availableVip} VIPs restantes</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-zinc-400 font-mono text-[11px]">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Lock Pessimista Ativo</span>
        </div>
      </div>

      {/* Stage indicator with neon light glow */}
      <div className="text-center space-y-2 relative">
        <div className="mx-auto max-w-lg py-2.5 rounded-b-3xl bg-gradient-to-b from-zinc-800/80 to-zinc-900/60 border-b-2 border-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
          <span className="text-[11px] sm:text-xs uppercase tracking-widest font-bold text-zinc-200">
            PALCO / TELÃO PRINCIPAL
          </span>
        </div>
        <p className="sm:hidden text-[10px] text-zinc-500 font-mono">
          Deslize lateralmente para explorar todas as fileiras ↔
        </p>
      </div>

      {/* Seat grid */}
      <div className="flex flex-col gap-2 sm:gap-3 items-center pt-2 sm:pt-4 overflow-x-auto pb-4 w-full scrollbar-thin">
        {rows.map((rowName) => {
          const rowSeats = seats
            .filter((s) => s.row_name === rowName)
            .sort((a, b) => a.seat_number - b.seat_number);

          return (
            <div key={rowName} className="flex items-center gap-1.5 sm:gap-3">
              {/* Highlighted Row Label on Left Margin */}
              <span className="w-5 sm:w-6 text-center text-[10px] sm:text-xs text-zinc-300 font-mono font-bold uppercase tracking-wider bg-zinc-900 py-1 rounded border border-zinc-700/80 shrink-0">
                {rowName}
              </span>

              <div className="flex gap-1 sm:gap-2">
                {rowSeats.map((seat) => {
                  const isSelected = selectedSeatIds.includes(seat.id);
                  const isAvailable = seat.status === 'available';
                  const isLocked = seat.status === 'locked';
                  const isSold = seat.status === 'sold';

                  let style = '';

                  if (isSold) {
                    style = 'bg-zinc-900 text-zinc-700 border-zinc-800/50 cursor-not-allowed opacity-30';
                  } else if (isLocked) {
                    style = 'bg-amber-950/30 text-amber-600 border-amber-900/40 cursor-not-allowed';
                  } else if (isSelected) {
                    style = 'bg-emerald-500 text-zinc-950 border-emerald-300 ring-2 ring-emerald-400/40 scale-105 sm:scale-110 z-10 font-bold shadow-lg shadow-emerald-500/20';
                  } else if (seat.category === 'VIP') {
                    style = 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-900/50 hover:border-emerald-500';
                  } else if (seat.category === 'Premium') {
                    style = 'bg-cyan-950/30 text-cyan-300 border-cyan-700/50 hover:bg-cyan-900/40 hover:border-cyan-500';
                  } else {
                    style = 'bg-zinc-800/60 text-zinc-300 border-zinc-700/60 hover:bg-zinc-700/60 hover:text-white';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={!isAvailable || isReserving}
                      onClick={() => onToggleSeat(seat)}
                      title={`${seat.row_name}${seat.seat_number} · ${seat.category} · R$ ${seat.price.toFixed(2)}`}
                      className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg border font-mono text-[10px] sm:text-xs transition-all duration-150 flex items-center justify-center touch-manipulation ${style}`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend with high contrast */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800 text-xs text-zinc-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-emerald-950/40 border border-emerald-600/60" />
            VIP (R$ 499.90)
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-cyan-950/30 border border-cyan-600/60" />
            Premium (R$ 399.90)
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-zinc-800/60 border border-zinc-600/60" />
            Standard (R$ 299.90)
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-zinc-900 border border-zinc-800/50 opacity-30" />
            Vendido
          </div>
        </div>

        <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
          Garantia de Não-Dupla Venda (SELECT FOR UPDATE)
        </span>
      </div>
    </div>
  );
};
