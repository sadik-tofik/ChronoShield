import React, { useState } from 'react';
import { Shield, ExternalLink, Copy, Check, Volume2, VolumeX, Terminal, BookOpen } from 'lucide-react';
import { sounds } from '../utils/audio';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ onOpenWhitepaper, theme, onToggleTheme }) {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const operatorAddress = '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1';

  const handleCopy = () => {
    navigator.clipboard.writeText(operatorAddress);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/[0.08] bg-white/85 dark:bg-[#0A0A0F]/85 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-violet-500/20 border border-cyan-600/30 dark:border-cyan-500/40 flex items-center justify-center group-hover:border-cyan-500 transition-colors shadow-sm">
              <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0F] animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-zinc-950 dark:text-white font-sans text-base">CHRONOSHIELD</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40 font-semibold">v0.1.0</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hidden sm:inline">AUTONOMOUS DEFI HEDGING</span>
            </div>
          </a>

          {/* Network Pill */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">SOMNIA SHANNON:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">CHAIN 50312</span>
          </div>
        </div>

        {/* Center: Testnet Balances */}
        <div className="hidden lg:flex items-center gap-2.5 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 shadow-xs">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">GAS:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">99.968 STT</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 shadow-xs">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">COLLATERAL VAULT:</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">493.703 tUSDC</span>
          </div>
        </div>

        {/* Right: Actions, Operator Wallet, Theme Toggle & Docs */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle Button (Sleek Sun / Moon) */}
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-2 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
          </button>

          {/* Whitepaper Docs Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenWhitepaper?.();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-cyan-500/40 text-xs font-mono transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Docs</span>
          </button>

          {/* Jump to Terminal Button */}
          <a
            href="#cockpit-section"
            onClick={() => sounds.playClick()}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-600/30 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 hover:border-cyan-500 text-xs font-mono transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Cockpit</span>
          </a>

          {/* Wallet Address Pill */}
          <div className="flex items-center bg-white dark:bg-zinc-900/90 border border-emerald-500/40 dark:border-emerald-500/30 rounded-lg p-1 pr-2.5 gap-2 shadow-xs">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-xs">
              OP
            </div>
            <div className="flex flex-col text-left">
              <span className="font-mono text-[11px] text-zinc-900 dark:text-zinc-200 tracking-tight font-medium">
                0x9C48...EDE1
              </span>
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold leading-none">CONNECTED</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ml-0.5 cursor-pointer"
              title="Copy operator address"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
            <a
              href={`https://shannon-explorer.somnia.network/address/${operatorAddress}`}
              target="_blank"
              rel="noreferrer"
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              title="View on Shannon Explorer"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
