import React, { useState, useEffect } from 'react';
import { Cpu, Clock, CheckCircle2, Play } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function KeeperStatusCard({
  healthFactor,
  onTriggerManualHedge,
  isExecutingHedge,
  hasActiveHedge,
  theme = 'light',
}) {
  const [countdown, setCountdown] = useState(84);
  const [copiedPool, setCopiedPool] = useState(false);
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const poolAddress = '0x807c540126fad42760da2281e9a316467ef255eb';
  const shortenedPool = '0x807c...55eb';

  // Compute keeper state
  let keeperState = 'IDLE';
  let badgeColor = isDark
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let stateTitle = 'DAEMON IDLE (STANDBY)';
  let stateDesc = 'Continuous monitoring of borrower positions. Shannon RPC at 42ms.';

  if (isExecutingHedge) {
    keeperState = 'EXECUTING HEDGE';
    badgeColor = isDark
      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
      : 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
    stateTitle = 'EXECUTING EMERGENCY HEDGE';
    stateDesc = 'Sending mintSet transaction to DreamDEX BinaryPool...';
  } else if (hasActiveHedge || healthFactor < 1.00) {
    keeperState = 'SECURED DOWN HEDGE';
    badgeColor = isDark
      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
      : 'bg-cyan-50 text-cyan-700 border-cyan-300';
    stateTitle = 'CIRCUIT BREAKER ARMED: 2 DOWN SECURED';
    stateDesc = '2 DOWN contracts held in custody. Awaiting oracle settlement to restore collateral.';
  } else if (healthFactor < 1.15) {
    keeperState = 'EVALUATING BINARY POOLS';
    badgeColor = isDark
      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
      : 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
    stateTitle = 'EVALUATING DREAMDEX POOLS';
    stateDesc = 'Critical risk detected (<1.15 HF). Locating shortest expiry window (<300s).';
  }

  const handleCopyPool = () => {
    navigator.clipboard.writeText(poolAddress);
    setCopiedPool(true);
    sounds.playClick();
    setTimeout(() => setCopiedPool(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#12121A] rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-sm shadow-zinc-200/50 dark:shadow-none transition-colors duration-200">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08]">
              <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-sm text-zinc-950 dark:text-white uppercase tracking-wider">
                Autonomous Circuit Breaker
              </h3>
              <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">Somnia Keeper Daemon v0.1.0</p>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border tracking-wider ${badgeColor}`}>
            {keeperState}
          </span>
        </div>

        {/* State Banner */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/[0.06] mb-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-900 dark:text-white mb-1">
            {keeperState === 'IDLE' ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            ) : keeperState === 'EVALUATING BINARY POOLS' ? (
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400 animate-bounce" />
            )}
            <span>{stateTitle}</span>
          </div>
          <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {stateDesc}
          </p>
        </div>

        {/* Active Hedge Metrics */}
        <div className="space-y-2.5 font-mono text-xs">
          {/* Target Pool */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.04]">
            <span className="text-zinc-500 text-[11px] font-medium">TARGET POOL:</span>
            <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
              <span className="font-semibold text-cyan-700 dark:text-cyan-300">ETH 5-Min Binary Pool</span>
              <button
                onClick={handleCopyPool}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                title="Copy pool address"
              >
                {copiedPool ? 'Copied' : shortenedPool}
              </button>
            </div>
          </div>

          {/* Contract Type */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.04]">
            <span className="text-zinc-500 text-[11px] font-medium">CONTRACT TYPE:</span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                BUY_NO / DOWN Outcome
              </span>
              <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">(ERC-6909)</span>
            </div>
          </div>

          {/* Allocation */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.04]">
            <span className="text-zinc-500 text-[11px] font-medium">ALLOCATION:</span>
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>2 DOWN Contracts (mintSet)</span>
            </div>
          </div>

          {/* Window Expiry Countdown */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-white/[0.04]">
            <span className="text-zinc-500 text-[11px] font-medium">EXPIRY WINDOW:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-bold text-zinc-900 dark:text-white">T-minus {countdown}s</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">/ 300s window</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger CTA Button */}
      <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-white/[0.06]">
        <button
          onClick={() => {
            sounds.playClick();
            onTriggerManualHedge();
          }}
          disabled={isExecutingHedge}
          className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:text-cyan-300 dark:border dark:border-cyan-500/40 dark:hover:border-cyan-400 font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-md hover:shadow-cyan-950/20 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Play className="w-3.5 h-3.5 fill-current text-white dark:text-cyan-400" />
          <span>{isExecutingHedge ? 'Simulating On-Chain Hedge...' : 'Simulate Autonomous Hedge Cycle'}</span>
        </button>
      </div>
    </div>
  );
}
