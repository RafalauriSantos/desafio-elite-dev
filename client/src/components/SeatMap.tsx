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

  return (
    <div className="w-full bg-[#111113] p-6 sm:p-8 rounded-2xl border border-zinc-800/60 space-y-6">
      {/* Stage indicator */}
      <div className="text-center">
        <div className="mx-auto max-w-md py-2 rounded-b-2xl bg-zinc-800/50 border-b-2 border-emerald-500/40">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400">PALCO / TELA PRINCIPAL</span>
        </div>
      </div>

      {/* Seat grid */}
      <div className="flex flex-col gap-3 items-center pt-4 overflow-x-auto pb-2">
        {rows.map((rowName) => {
          const rowSeats = seats
            .filter((s) => s.row_name === rowName)
            .sort((a, b) => a.seat_number - b.seat_number);

          return (
            <div key={rowName} className="flex items-center gap-3">
              {/* Highlighted Row Label on Left Margin */}
              <span className="w-6 text-center text-xs text-zinc-400 font-mono font-bold uppercase tracking-wider bg-zinc-900/80 py-1 rounded border border-zinc-800 shrink-0">
                {rowName}
              </span>

              <div className="flex gap-2">
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
                    style = 'bg-emerald-500 text-zinc-950 border-emerald-400 ring-2 ring-emerald-500/30 scale-110 z-10 font-bold shadow-lg';
                  } else if (seat.category === 'VIP') {
                    style = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40 hover:bg-emerald-900/50 hover:border-emerald-600/50';
                  } else if (seat.category === 'Premium') {
                    style = 'bg-cyan-950/30 text-cyan-400 border-cyan-800/40 hover:bg-cyan-900/40 hover:border-cyan-600/50';
                  } else {
                    style = 'bg-zinc-800/50 text-zinc-400 border-zinc-700/40 hover:bg-zinc-700/50 hover:text-zinc-200';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={!isAvailable || isReserving}
                      onClick={() => onToggleSeat(seat)}
                      title={`${seat.row_name}${seat.seat_number} · ${seat.category} · R$ ${seat.price.toFixed(2)}`}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg border font-mono text-xs transition-all duration-150 ${style}`}
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

      {/* Legend with text-zinc-400 contrast */}
      <div className="flex flex-wrap items-center gap-5 pt-4 border-t border-zinc-800/40 text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded bg-emerald-950/40 border border-emerald-800/40" />
          VIP (R$ 499.90)
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded bg-cyan-950/30 border border-cyan-800/40" />
          Premium (R$ 399.90)
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded bg-zinc-800/50 border border-zinc-700/40" />
          Standard (R$ 299.90)
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-3 h-3 rounded bg-zinc-900 border border-zinc-800/50 opacity-30" />
          Vendido
        </div>
      </div>
    </div>
  );
};
