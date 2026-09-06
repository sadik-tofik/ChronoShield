import React from 'react';
import { ShieldCheck, AlertTriangle, Flame } from 'lucide-react';

export default function HealthGauge({ healthFactor, collateralUsd, borrowedDebtUsd, stressDrop, theme = 'light' }) {
  const isDark = theme === 'dark';

  // Calculations
  const maxLtv = 0.85;
  const currentLtv = (borrowedDebtUsd / collateralUsd) * 100;

  // Status classification
  const isSafe = healthFactor >= 1.20;
  const isWarning = healthFactor < 1.20 && healthFactor >= 1.15;
  const isDanger = healthFactor < 1.15 && healthFactor >= 1.00;
  const isLiquidatable = healthFactor < 1.00;

  // Arc Gauge Geometry (Semi-circle gauge: 180 degrees)
  const minHf = 0.6;
  const maxHf = 1.8;
  const normalizedHf = Math.min(Math.max((healthFactor - minHf) / (maxHf - minHf), 0), 1);
  const angleDeg = -180 + normalizedHf * 180;

  const radius = 86;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - normalizedHf * circumference;

  // Color tokens
  const statusColor = isLiquidatable
    ? {
        text: isDark ? 'text-rose-400' : 'text-rose-600',
        badge: isDark
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          : 'bg-rose-50 text-rose-700 border-rose-200',
        stroke: isDark ? '#EF4444' : '#DC2626',
        label: 'LIQUIDATION THRESHOLD BREACHED',
      }
    : isDanger
    ? {
        text: isDark ? 'text-amber-400' : 'text-amber-600',
        badge: isDark
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          : 'bg-amber-50 text-amber-700 border-amber-200',
        stroke: isDark ? '#F59E0B' : '#D97706',
        label: 'DANGER: KEEPER ARMED (< 1.15 HF)',
      }
    : isWarning
    ? {
        text: isDark ? 'text-yellow-400' : 'text-amber-600',
        badge: isDark
          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
          : 'bg-yellow-50 text-yellow-700 border-yellow-200',
        stroke: isDark ? '#EAB308' : '#D97706',
        label: 'CAUTION: ELEVATED VOLATILITY',
      }
    : {
        text: isDark ? 'text-emerald-400' : 'text-emerald-600',
        badge: isDark
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200',
        stroke: isDark ? '#10B981' : '#059669',
        label: 'SOLVENT & PROTECTED',
      };

  return (
    <div className="bg-white dark:bg-[#12121A] rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-sm shadow-zinc-200/50 dark:shadow-none transition-colors duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08]">
            {isLiquidatable ? (
              <Flame className="w-4 h-4 text-rose-600 dark:text-rose-500 animate-pulse" />
            ) : isDanger ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="font-sans font-bold text-sm text-zinc-950 dark:text-white uppercase tracking-wider">
              Position Health Factor
            </h3>
            <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">Dynamic Risk Vector Matrix</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-semibold border ${statusColor.badge}`}>
          {isLiquidatable ? 'LIQUIDATING' : isDanger ? 'KEEPER ACTIVE' : 'SAFE'}
        </span>
      </div>

      {/* Radial Semi-Circle Arc Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2 select-none">
        <svg className="w-64 h-36 overflow-visible" viewBox="0 0 220 120">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isDark ? '#EF4444' : '#DC2626'} />
              <stop offset="35%" stopColor={isDark ? '#F59E0B' : '#D97706'} />
              <stop offset="65%" stopColor={isDark ? '#10B981' : '#059669'} />
              <stop offset="100%" stopColor={isDark ? '#06B6D4' : '#0284C7'} />
            </linearGradient>

            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Arc */}
          <path
            d="M 24 110 A 86 86 0 0 1 196 110"
            fill="none"
            stroke={isDark ? '#27272A' : '#E2E8F0'}
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Color Gradient Track */}
          <path
            d="M 24 110 A 86 86 0 0 1 196 110"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity={isDark ? '0.25' : '0.2'}
          />

          {/* Dynamic Active Progress Arc */}
          <path
            d="M 24 110 A 86 86 0 0 1 196 110"
            fill="none"
            stroke={statusColor.stroke}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            filter="url(#glowFilter)"
            className="transition-all duration-300 ease-out"
          />

          {/* Critical Threshold Tick Marker at HF = 1.15 */}
          <g transform="translate(110, 110) rotate(-79.5)">
            <line x1="0" y1="-95" x2="0" y2="-77" stroke={isDark ? '#F59E0B' : '#D97706'} strokeWidth="2.5" />
          </g>

          {/* Liquidation Threshold Tick Marker at HF = 1.0 */}
          <g transform="translate(110, 110) rotate(-120)">
            <line x1="0" y1="-95" x2="0" y2="-77" stroke={isDark ? '#EF4444' : '#DC2626'} strokeWidth="2.5" />
          </g>

          {/* Rotating Needle */}
          <g transform={`translate(110, 110) rotate(${angleDeg})`} className="transition-transform duration-300 ease-out">
            <polygon points="-3,0 3,0 1,-78 -1,-78" fill={isDark ? '#FFFFFF' : '#09090B'} opacity="0.9" />
            <circle cx="0" cy="0" r="7" fill={isDark ? '#18181B' : '#FFFFFF'} stroke={isDark ? '#FFFFFF' : '#09090B'} strokeWidth="2" />
          </g>

          {/* Min & Max Labels */}
          <text x="20" y="122" fill={isDark ? '#71717A' : '#64748B'} fontSize="9" fontFamily="monospace" textAnchor="middle">0.60</text>
          <text x="75" y="60" fill={isDark ? '#EF4444' : '#DC2626'} fontSize="8" fontFamily="monospace" textAnchor="middle">1.00</text>
          <text x="125" y="44" fill={isDark ? '#F59E0B' : '#D97706'} fontSize="8" fontFamily="monospace" textAnchor="middle">1.15 (Trigger)</text>
          <text x="200" y="122" fill={isDark ? '#71717A' : '#64748B'} fontSize="9" fontFamily="monospace" textAnchor="middle">1.80</text>
        </svg>

        {/* Center Digital Readout */}
        <div className="text-center -mt-6">
          <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 dark:text-white flex items-baseline justify-center gap-1">
            <span className={statusColor.text}>{healthFactor.toFixed(3)}</span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">HF</span>
          </div>
          <div className={`font-mono text-[11px] font-semibold mt-1 tracking-wider ${statusColor.text}`}>
            {statusColor.label}
          </div>
        </div>
      </div>

      {/* Numerical Data Grid */}
      <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-zinc-200 dark:border-white/[0.06] font-mono text-xs">
        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 block font-medium">COLLATERAL</span>
          <span className="font-bold text-zinc-900 dark:text-white">${collateralUsd.toFixed(2)}</span>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block">(-{stressDrop}%)</span>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 block font-medium">TOTAL DEBT</span>
          <span className="font-bold text-zinc-900 dark:text-white">${borrowedDebtUsd.toFixed(2)}</span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">tUSDC</span>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-200/80 dark:border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 block font-medium">CURRENT LTV</span>
          <span className={`font-bold ${currentLtv > 85 ? (isDark ? 'text-rose-400' : 'text-rose-600') : currentLtv > 75 ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>
            {currentLtv.toFixed(1)}%
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">Max 85%</span>
        </div>
      </div>
    </div>
  );
}
