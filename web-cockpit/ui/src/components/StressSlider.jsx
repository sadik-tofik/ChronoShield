import React from 'react';
import { Sliders, RefreshCw, ExternalLink } from 'lucide-react';
import { sounds } from '../utils/audio';

const CONTRACT_ADDRESS = '0x728b9579edec0e8ef5422f2980c302d5bd266343';

export default function StressSlider({ stressDrop, setStressDrop, healthFactor, theme = 'light' }) {
  const isDark = theme === 'dark';

  const presets = [
    { label: '0% Normal', value: 0, desc: 'HF 1.36 (Safe)' },
    { label: '-10% Dip', value: 10, desc: 'HF 1.22 (Warning)' },
    { label: '-16% Breach', value: 16, desc: 'HF 1.14 (Armed!)' },
    { label: '-25% Crash', value: 25, desc: 'HF 1.02 (Danger)' },
    { label: '-35% Black Swan', value: 35, desc: 'HF 0.88 (Liquidatable)' },
  ];

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setStressDrop(val);
    if (val === 16 || (stressDrop < 16 && val >= 16)) {
      sounds.playWarning();
    } else {
      sounds.playClick();
    }
  };

  const handleSelectPreset = (val) => {
    setStressDrop(val);
    if (val >= 16) {
      sounds.playWarning();
    } else {
      sounds.playClick();
    }
  };

  const handleReset = () => {
    sounds.playClick();
    setStressDrop(0);
  };

  const isDanger = stressDrop >= 16;
  const isCritical = stressDrop >= 27;

  return (
    <div className="bg-white dark:bg-[#12121A] rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between shadow-sm shadow-zinc-200/50 dark:shadow-none transition-colors duration-200">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08]">
            <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans font-bold text-sm text-zinc-950 dark:text-white uppercase tracking-wider">
                Market Shock Stress-Tester
              </h3>
              {/* "View on-chain" link directly next to the stress slider header */}
              <a
                href={`https://shannon-explorer.somnia.network/address/${CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 text-[11px] text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 font-mono transition-colors shadow-2xs"
                title="View real MockLendingPosition contract on Shannon Explorer"
              >
                <span>0x728b...6343</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">Simulate Real-Time Collateral Drawdown</p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-200 dark:border-white/[0.08] text-xs font-mono transition-colors cursor-pointer self-start sm:self-auto"
          title="Reset market stress to 0%"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Slider Display */}
      <div className="space-y-4 py-2">
        <div className="flex items-end justify-between">
          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">Simulated Price Shock:</span>
          <div className="font-mono text-2xl font-bold flex items-baseline gap-1">
            <span className={isCritical ? (isDark ? 'text-rose-400' : 'text-rose-600') : isDanger ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-cyan-400' : 'text-cyan-600')}>
              -{stressDrop}%
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal">DROP</span>
          </div>
        </div>

        {/* Custom Range Slider */}
        <div className="relative py-2">
          <input
            type="range"
            min="0"
            max="40"
            step="1"
            value={stressDrop}
            onChange={handleSliderChange}
            className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-600 dark:accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />

          {/* Critical Threshold Marker on the slider */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
            style={{ left: '40%' }}
          >
            <div className="w-0.5 h-6 bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 font-bold -mt-1">1.15 HF</span>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {presets.map((p) => {
            const isSelected = stressDrop === p.value;
            return (
              <button
                key={p.value}
                onClick={() => handleSelectPreset(p.value)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-sm'
                      : 'bg-cyan-50 border-cyan-500 text-cyan-950 font-semibold shadow-xs'
                    : isDark
                    ? 'bg-zinc-900/50 border-white/[0.04] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <span className="font-mono text-xs font-bold">{p.label}</span>
                <span className="font-mono text-[9px] opacity-75 mt-0.5">{p.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Mathematical Formula Card */}
      <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/[0.04] font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center justify-between">
          <span>Solvency Invariant:</span>
          <code className="text-zinc-800 dark:text-zinc-200 font-bold">HF = (Collateral × 0.85) / Debt</code>
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px]">
          <span>Trigger Boundary:</span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold">HF &lt; 1.150 activates DreamDEX hedge</span>
        </div>
      </div>
    </div>
  );
}
