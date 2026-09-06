import React from 'react';
import { X, ShieldCheck, Cpu, Code2, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function WhitepaperModal({ isOpen, onClose, theme = 'light' }) {
  if (!isOpen) return null;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#12121A] border border-zinc-200 dark:border-white/[0.12] rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-zinc-800 dark:text-zinc-200 font-sans transition-colors duration-200">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-white/[0.08]">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-500/40 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-cyan-700 dark:text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-zinc-950 dark:text-white font-sans">ChronoShield Architecture Whitepaper</h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
                SOMNIA SHANNON
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">Autonomous Anti-Liquidation & Event Contract Subsidies</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-6 text-sm leading-relaxed overflow-y-auto max-h-[70vh] pr-2">
          {/* Section 1: Executive Summary */}
          <section className="space-y-2">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 text-cyan-700 dark:text-cyan-400">
              <span>01 // EXECUTIVE SUMMARY</span>
            </h3>
            <p className="text-zinc-600 dark:text-zinc-300 font-mono text-xs">
              DeFi lending protocols suffer from catastrophic liquidations during volatile flash-crashes. Borrowers face punitive 5-15% liquidation penalties, while protocols risk bad debt if auctions slip below solvency.
            </p>
            <p className="text-zinc-600 dark:text-zinc-300 font-mono text-xs">
              <strong className="text-zinc-900 dark:text-white">ChronoShield</strong> is an autonomous, on-chain risk mitigation engine built on <strong className="text-cyan-700 dark:text-cyan-300">Somnia Shannon Testnet</strong>. By leveraging DreamDEX Event Contracts, ChronoShield monitors borrower positions and executes automated, sub-second downside hedges via binary outcome tokens (<code className="text-rose-600 dark:text-rose-400 font-bold">BUY_NO / DOWN</code>).
            </p>
          </section>

          {/* Section 2: Mathematical Mechanics */}
          <section className="space-y-3 bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-white/[0.06]">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              02 // MATHEMATICAL MODEL
            </h3>
            <div className="font-mono text-xs space-y-2 text-zinc-700 dark:text-zinc-300">
              <div className="bg-white dark:bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px] font-medium">HEALTH FACTOR FORMULA:</span>
                <span className="text-zinc-900 dark:text-white font-bold">HF = (Collateral × LiquidationThreshold) / BorrowedDebt</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Baseline parameters: Collateral = $2,000 tUSDC, Debt = $1,250 tUSDC, Max LTV = 85% (Threshold = 0.85). Baseline HF = (2000 × 0.85) / 1250 = <strong className="text-zinc-900 dark:text-white">1.360</strong>.
              </p>
              <div className="bg-white dark:bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-200 dark:border-white/[0.04]">
                <span className="text-zinc-500 block text-[10px] font-medium">DOWN-HEDGE PAYOUT RECONCILIATION:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">ΔVault_Restored = N_contracts × ($1.00 - P_entry)</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                When market shock drops collateral &gt; 16%, HF breaches 1.15. The keeper daemon uses protocol-level <code className="text-cyan-700 dark:text-cyan-300">mintSet</code> or CLOB cross to secure DOWN tokens. Upon expiry settlement, each winning DOWN token redeems 1:1 for 1.00 tUSDC, directly restoring vault collateral and lifting the Health Factor above the liquidation zone.
              </p>
            </div>
          </section>

          {/* Section 3: Why Somnia Shannon */}
          <section className="space-y-2">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-violet-700 dark:text-violet-400">
              03 // WHY SOMNIA SHANNON TESTNET?
            </h3>
            <ul className="space-y-2 font-mono text-xs text-zinc-600 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                <span><strong>Sub-Second Finality:</strong> Traditional L1s cannot hedge before liquidation happens due to 12s block times. Somnia processes trades in milliseconds.</span>
              </li>
              <li className="flex items-start gap-2">
                <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>DreamDEX Binary Pools:</strong> Fast 1-min & 5-min prediction windows permit micro-duration hedging exactly aligned with volatility spikes.</span>
              </li>
              <li className="flex items-start gap-2">
                <Cpu className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <span><strong>EVM + EIP-7702 Compatibility:</strong> Autonomous keeper operations operate non-custodially without taking custody of borrower private keys.</span>
              </li>
            </ul>
          </section>

          {/* Section 4: Verified Testnet Contracts */}
          <section className="space-y-2 pt-2 border-t border-zinc-200 dark:border-white/[0.06]">
            <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
              04 // VERIFIED TESTNET CONTRACTS
            </h3>
            <div className="font-mono text-[11px] space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-white/[0.04]">
                <span>DreamDEX ETH Binary Pool:</span>
                <span className="text-cyan-700 dark:text-cyan-300 font-semibold">0x807c540126fad42760da2281e9a316467ef255eb</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-white/[0.04]">
                <span>Collateral Token (tUSDC):</span>
                <span className="text-zinc-800 dark:text-zinc-200">0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-white/[0.04]">
                <span>Operator Keeper:</span>
                <span className="text-zinc-800 dark:text-zinc-200">0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-white/[0.04]">
                <span>Somnia Shannon Chain ID:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">50312</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-6 mt-6 border-t border-zinc-200 dark:border-white/[0.08] flex justify-end">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-mono text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Close Spec
          </button>
        </div>
      </div>
    </div>
  );
}
