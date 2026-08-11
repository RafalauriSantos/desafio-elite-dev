import React from 'react';
import { SeatItem } from '../lib/api';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="w-full bg-[#121215] p-6 sm:p-8 rounded-2xl border border-[#27272a] shadow-xl relative overflow-hidden">
      {/* Stage Screen Backdrop (Curved Top Screen per Skill 2) */}
      <div className="relative mb-10 text-center">
        <div className="w-full h-10 bg-zinc-900/60 border-b-2 border-emerald-500/50 rounded-b-full flex items-center justify-center">
          <span className="text-[11px] uppercase tracking-[0.3em] font-mono font-semibold text-emerald-400">
            TELA / PALCO PRINCIPAL
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
              <span className="w-6 text-center font-bold text-sm text-zinc-400 font-mono">
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
                      seatStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500 hover:text-zinc-950';
                    } else if (seat.category === 'Premium') {
                      seatStyle = 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-emerald-600 hover:text-white';
                    } else {
                      seatStyle = 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white';
                    }
                  }

                  if (isLocked) {
                    seatStyle = 'bg-amber-950/40 text-amber-400 border-amber-500/30 cursor-not-allowed';
                  }

                  if (isSold) {
                    seatStyle = 'bg-zinc-950 text-zinc-700 border-zinc-850 cursor-not-allowed opacity-40';
                  }

                  if (isSelected) {
                    seatStyle = 'bg-emerald-500 text-zinc-950 font-extrabold border-emerald-400 shadow-md shadow-emerald-500/30 scale-105 ring-2 ring-emerald-300';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={!isAvailable || isReserving}
                      onClick={() => onSelectSeat(seat)}
                      title={`Fileira ${seat.row_name} - Assento ${seat.seat_number} (${seat.category}): R$ ${seat.price.toFixed(2)}`}
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg border font-mono font-semibold text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-150 relative group ${seatStyle}`}
                    >
                      <span>{seat.seat_number}</span>

                      {/* Status Overlay Icon */}
                      {isLocked && <Lock className="w-3 h-3 text-amber-400 absolute bottom-1" />}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-zinc-950 absolute bottom-1" />}

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-zinc-900 text-zinc-100 text-[10px] py-1 px-2.5 rounded shadow-xl border border-zinc-700 whitespace-nowrap z-20 pointer-events-none">
                        <span className="font-bold text-emerald-400 font-mono">Fileira {seat.row_name} • Assento {seat.seat_number}</span>
                        <span className="text-zinc-300">{seat.category} - R$ {seat.price.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Concurrency Assurance */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-950 border border-emerald-500"></span>
            <span>VIP</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-indigo-950 border border-indigo-500"></span>
            <span>Premium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-700"></span>
            <span>Standard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-950 border border-amber-600 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-amber-400" />
            </span>
            <span>Bloqueado (Reservando)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800 opacity-50"></span>
            <span>Vendido</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-indigo-400 bg-indigo-950/40 px-3 py-1.5 rounded-full border border-indigo-800/40">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span className="font-medium">Confirmação Instantânea de Assento</span>
        </div>
      </div>
    </div>
  );
};
