import React, { useState } from 'react';
import { Shield, ExternalLink, Copy, Check, Volume2, VolumeX, Terminal, BookOpen, Wallet, Loader2 } from 'lucide-react';
import { sounds } from '../utils/audio';
import ThemeToggle from './ThemeToggle';

export default function Navbar({
  onOpenWhitepaper,
  theme,
  onToggleTheme,
  walletAddress = '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1',
  sttBalance = '99.968',
  usdcBalance = '493.703',
  isLoadingBalances = false,
  currentBlock = null,
  rpcLatency = null,
  walletConnected = true,
  onConnectWallet,
}) {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Format balances cleanly with fallback placeholder '-- STT | -- USDC'
  const formattedStt = isLoadingBalances || !sttBalance ? '-- STT' : `${Number(sttBalance).toFixed(3)} STT`;
  const formattedUsdc = isLoadingBalances || !usdcBalance ? '-- USDC' : `${Number(usdcBalance).toFixed(3)} USDC`;

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : '0x9C48...EDE1';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/[0.08] bg-white/85 dark:bg-[#0A0A0F]/85 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <a href="#" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-gradient-to-br dark:from-cyan-500/20 dark:to-violet-500/20 border border-cyan-600/30 dark:border-cyan-500/40 flex items-center justify-center group-hover:border-cyan-500 transition-colors shadow-sm">
              <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0A0A0F] animate-pulse" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-zinc-950 dark:text-white font-sans text-sm sm:text-base">
                  CHRONOSHIELD
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800/40 font-semibold hidden xs:inline">
                  v0.1.0
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                AUTONOMOUS DEFI HEDGING
              </span>
            </div>
          </a>

          {/* Somnia Shannon Network Pill */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/[0.08] font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">SOMNIA SHANNON:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {currentBlock ? `#${currentBlock}` : '50312'}
            </span>
            {rpcLatency && (
              <span className="text-zinc-400 text-[10px]">{rpcLatency}ms</span>
            )}
          </div>
        </div>

        {/* Center: Live Balances (Desktop View) */}
        <div className="hidden xl:flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">GAS:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {formattedStt}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/90 dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.06] text-zinc-700 dark:text-zinc-300 shadow-2xs">
            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">VAULT:</span>
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              {formattedUsdc}
            </span>
          </div>
        </div>

        {/* Right: Actions, Operator Wallet, Theme Toggle & Docs */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Theme Toggle Button */}
          <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className="p-1.5 sm:p-2 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
          </button>

          {/* Whitepaper Docs Button */}
          <a
            href="/docs.html"
            target="_blank"
            rel="noreferrer"
            onClick={() => sounds.playClick()}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-zinc-100/80 hover:bg-zinc-200/70 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-cyan-500/40 text-xs font-mono transition-colors cursor-pointer"
            title="Open DreamDEX-style Developer Documentation"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Docs ↗</span>
          </a>

          {/* Wallet Address & Live Balance Pill */}
          {walletConnected ? (
            <div className="flex items-center bg-white dark:bg-zinc-900/90 border border-emerald-500/40 dark:border-emerald-500/30 rounded-xl p-1 pr-2 sm:pr-2.5 gap-1.5 sm:gap-2 shadow-xs max-w-[210px] sm:max-w-none">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center font-mono text-[10px] font-bold text-white shadow-xs shrink-0">
                OP
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-zinc-900 dark:text-zinc-200 tracking-tight font-medium">
                  <span>{truncatedAddress}</span>
                  <span className="text-zinc-300 dark:text-zinc-700 hidden xs:inline">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold hidden xs:inline truncate">
                    {formattedStt}
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700 hidden lg:inline">·</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-semibold hidden lg:inline truncate">
                    {formattedUsdc}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold leading-none">
                    CONNECTED
                  </span>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors ml-0.5 cursor-pointer shrink-0"
                title="Copy operator address"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
              <a
                href={`https://shannon-explorer.somnia.network/address/${walletAddress}`}
                target="_blank"
                rel="noreferrer"
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors shrink-0"
                title="View on Shannon Explorer"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            <button
              onClick={onConnectWallet}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
