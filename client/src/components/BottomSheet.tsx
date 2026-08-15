import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  maxHeightClass?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = 'sm:max-w-lg',
  maxHeightClass = 'max-h-[85dvh] sm:max-h-[85dvh]',
}) => {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer Card */}
      <div
        className={`w-full ${maxWidthClass} bg-[#111113] rounded-t-3xl sm:rounded-2xl border border-zinc-800 shadow-2xl relative ${maxHeightClass} flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 z-10`}
      >
        {/* Mobile Pull Handle Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700/60" />
        </div>

        {/* Header */}
        <div className="shrink-0 px-5 py-3.5 border-b border-zinc-800/80 flex items-center justify-between relative bg-[#111113]">
          <div className="min-w-0 pr-4">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800/80 transition-colors touch-manipulation shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 pb-6">
          {children}
        </div>

        {/* Action Footer (Always Pinned, Safe from Mobile Nav) */}
        {footer && (
          <div className="shrink-0 sticky bottom-0 bg-[#111113]/98 backdrop-blur-md border-t border-zinc-800 p-4 sm:p-5 pt-3 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] flex gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
