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
    <div className="w-full glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Stage Backdrop Effect */}
      <div className="relative mb-12 text-center">
        <div className="w-3/4 mx-auto h-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-b-xl blur-xs opacity-80 animate-pulse-slow"></div>
        <div className="w-full h-12 bg-gradient-to-b from-indigo-500/10 to-transparent border-t-2 border-indigo-400/40 rounded-t-full flex items-center justify-center mt-2">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-indigo-300">
            PALCO / PALESTRA PRINCIPAL
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
              <span className="w-6 text-center font-bold text-sm text-slate-400 font-display">
                {rowName}
              </span>

              {/* Seats in Row */}
              <div className="flex gap-2 sm:gap-3">
                {rowSeats.map((seat) => {
                  const isSelected = seat.id === selectedSeatId;
                  const isAvailable = seat.status === 'available';
                  const isLocked = seat.status === 'locked';
                  const isSold = seat.status === 'sold';

                  let seatStyle = 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border-slate-700';

                  if (isAvailable) {
                    if (seat.category === 'VIP') {
                      seatStyle = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-500/30';
                    } else if (seat.category === 'Premium') {
                      seatStyle = 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30';
                    } else {
                      seatStyle = 'bg-slate-900 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white';
                    }
                  }

                  if (isLocked) {
                    seatStyle = 'bg-amber-950/50 text-amber-500/70 border-amber-600/30 cursor-not-allowed';
                  }

                  if (isSold) {
                    seatStyle = 'bg-slate-900/60 text-slate-600 border-slate-800/40 cursor-not-allowed opacity-50';
                  }

                  if (isSelected) {
                    seatStyle = 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/50 scale-105 ring-2 ring-indigo-300';
                  }

                  return (
                    <button
                      key={seat.id}
                      disabled={!isAvailable || isReserving}
                      onClick={() => onSelectSeat(seat)}
                      title={`Fileira ${seat.row_name} - Assento ${seat.seat_number} (${seat.category}): R$ ${seat.price.toFixed(2)}`}
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg border font-semibold text-xs sm:text-sm flex flex-col items-center justify-center transition-all duration-200 relative group ${seatStyle}`}
                    >
                      <span>{seat.seat_number}</span>

                      {/* Status Overlay Icon */}
                      {isLocked && <Lock className="w-3 h-3 text-amber-400 absolute bottom-1" />}
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white absolute bottom-1" />}

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-slate-100 text-[10px] py-1 px-2.5 rounded shadow-xl border border-slate-700 whitespace-nowrap z-20 pointer-events-none">
                        <span className="font-bold text-indigo-300">Fileira {seat.row_name} • Assento {seat.seat_number}</span>
                        <span className="text-slate-300">{seat.category} - R$ {seat.price.toFixed(2)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Row Label Right */}
              <span className="w-6 text-center font-bold text-sm text-slate-400 font-display">
                {rowName}
              </span>
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
          <span className="font-medium">Proteção Concorrência RPC (`FOR UPDATE`)</span>
        </div>
      </div>
    </div>
  );
};
