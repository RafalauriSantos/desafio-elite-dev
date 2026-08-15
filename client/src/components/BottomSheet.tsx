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
  maxWidthClass = 'sm:max-w-md',
  maxHeightClass = 'max-h-[78dvh] sm:max-h-[82dvh]',
}) => {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-hidden touch-none animate-in fade-in duration-150"
    >
      {/* Rigid Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Floating Centered Card (Locked horizontally, zero sliding/drift) */}
      <div
        className={`w-[calc(100vw-1.5rem)] sm:w-full ${maxWidthClass} bg-[#111113] rounded-3xl border border-zinc-800 shadow-2xl relative ${maxHeightClass} flex flex-col overflow-x-hidden overflow-y-hidden z-10 animate-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between relative bg-[#111113]">
          <div className="min-w-0 pr-3">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors touch-manipulation shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body (Strict Vertical Only with touch-pan-y) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4 space-y-4 touch-pan-y">
          {children}
        </div>

        {/* Action Footer */}
        {footer && (
          <div className="shrink-0 bg-[#111113] border-t border-zinc-800 p-4 flex gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.8)] z-20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
