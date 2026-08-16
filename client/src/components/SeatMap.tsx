import React from 'react';
import { SeatItem } from '../lib/api';

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
  const occupancyPct = totalSeats > 0 ? Math.round(((totalSeats - availableSeats) / totalSeats) * 100) : 0;

  const vipSeat = seats.find((s) => s.category === 'VIP');
  const premiumSeat = seats.find((s) => s.category === 'Premium');
  const standardSeat = seats.find((s) => s.category === 'Standard');
  const vipPrice = vipSeat ? `(R$ ${vipSeat.price.toFixed(2)})` : '';
  const premiumPrice = premiumSeat ? `(R$ ${premiumSeat.price.toFixed(2)})` : '';
  const standardPrice = standardSeat ? `(R$ ${standardSeat.price.toFixed(2)})` : '';

  return (
    <div className="w-full bg-[#0e0e11] p-4 sm:p-7 rounded-2xl border border-zinc-800/90 space-y-5 shadow-2xl relative overflow-hidden bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)]">
      {/* Clean Minimalist Occupancy Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-800/80 pb-3">
        <span className="font-medium text-zinc-300">
          {totalSeats - availableSeats} de {totalSeats} assentos ocupados ({occupancyPct}%)
        </span>
        <span className="text-[11px] font-mono text-zinc-500">
          Mapa de Assentos Numerados
        </span>
      </div>

      {/* Stage indicator with subtle spotlight beam */}
      <div className="text-center space-y-1 relative">
        <div className="mx-auto max-w-md py-2.5 rounded-b-2xl bg-zinc-900/90 border-b-2 border-emerald-500 relative overflow-hidden shadow-lg shadow-emerald-950/30">
          <span className="text-[11px] uppercase tracking-widest font-bold text-zinc-200">
            PALCO / TELÃO PRINCIPAL
          </span>
        </div>
        <p className="sm:hidden text-[10px] text-zinc-500 font-mono">
          Deslize lateralmente para ver todas as poltronas ↔
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

      {/* Legend with high contrast and dynamic prices */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800 text-xs text-zinc-300">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-emerald-950/40 border border-emerald-600/60" />
            VIP {vipPrice}
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-cyan-950/30 border border-cyan-600/60" />
            Premium {premiumPrice}
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-zinc-800/60 border border-zinc-600/60" />
            Standard {standardPrice}
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-3.5 rounded bg-zinc-900 border border-zinc-800/50 opacity-30" />
            Vendido
          </div>
        </div>

        <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
          Reserva Atômica
        </span>
      </div>
    </div>
  );
};
