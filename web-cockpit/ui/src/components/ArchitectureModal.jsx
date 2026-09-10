import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldCheck } from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#0b101c] border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer transition"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white tracking-tight">ChronoShield System Architecture</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Dual-layer execution routing between on-chain solvency monitoring and DreamDEX binary event markets.
        </p>

        <div className="bg-[#070a14] border border-slate-800 rounded-xl p-3 flex justify-center mb-6">
          <img
            src="/assets/architecture.png"
            alt="ChronoShield Architecture Diagram"
            className="rounded-lg max-h-[480px] w-auto object-contain shadow-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="font-semibold text-emerald-400 mb-1">Route 1: Layer-1 IOC Taker</div>
            <p className="text-slate-300 leading-relaxed">
              When the central limit orderbook (CLOB) contains ask depth, taker orders take resting liquidity to establish downside protection.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="font-semibold text-cyan-400 mb-1">Route 2: Protocol mintSet Fallback</div>
            <p className="text-slate-300 leading-relaxed">
              During 0-liquidity droughts, the keeper invokes DreamDEX protocol contracts directly to mint guaranteed complete sets, bypassing empty orderbooks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
