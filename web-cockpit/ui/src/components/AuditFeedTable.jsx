import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, ShieldCheck, ArrowUpRight, Copy, Check, Terminal } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function AuditFeedTable({ auditEvents = [], theme = 'light' }) {
  const [filter, setFilter] = useState('ALL');
  const [copiedTx, setCopiedTx] = useState(null);
  const isDark = theme === 'dark';

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedTx(id);
    sounds.playClick();
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const filteredEvents = auditEvents.filter((item) => {
    if (filter !== 'ALL' && item.type !== filter) return false;
    return true;
  });

  return (
    <div className="bg-white dark:bg-[#12121A] rounded-2xl border border-zinc-200 dark:border-white/[0.08] p-5 sm:p-6 flex flex-col justify-between shadow-sm shadow-zinc-200/50 dark:shadow-none transition-colors duration-200">
      {/* Header & Explorer Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-200 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08]">
            <Terminal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-bold text-sm text-zinc-950 dark:text-white uppercase tracking-wider">
                Live On-Chain Audit Stream
              </h3>
              <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                VERIFIED LIFECYCLE
              </span>
            </div>
            <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
              Deterministic Shannon Testnet Transaction History (Chain ID 50312)
            </p>
          </div>
        </div>

        {/* Shannon Explorer Global Link */}
        <a
          href="https://shannon-explorer.somnia.network"
          target="_blank"
          rel="noreferrer"
          onClick={() => sounds.playClick()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/[0.1] text-cyan-700 dark:text-cyan-300 hover:text-cyan-900 dark:hover:text-white font-mono text-xs transition-colors self-start sm:self-auto shadow-xs"
        >
          <span>Shannon Explorer</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Filter and Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {['ALL', 'MINT', 'ORACLE', 'RECOVERY'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f);
                sounds.playClick();
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                filter === f
                  ? isDark
                    ? 'bg-zinc-800 border-cyan-500/60 text-cyan-300 font-semibold'
                    : 'bg-zinc-200 border-zinc-400 text-zinc-900 font-bold'
                  : isDark
                  ? 'bg-zinc-950/40 border-white/[0.04] text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {f === 'ALL' ? 'All (3)' : f}
            </button>
          ))}
        </div>

        {/* Collateral Recovery Banner */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-xs shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">RECOVERED COLLATERAL:</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">+2.000 tUSDC</span>
        </div>
      </div>

      {/* Transaction Feed Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/[0.06] text-zinc-500 dark:text-zinc-400 text-[10px] tracking-wider uppercase">
              <th className="pb-2.5 font-semibold">Lifecycle Stage</th>
              <th className="pb-2.5 font-semibold">Transaction Hash / Target</th>
              <th className="pb-2.5 font-semibold">Outcome / Payload</th>
              <th className="pb-2.5 font-semibold">Status</th>
              <th className="pb-2.5 font-semibold text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-white/[0.04]">
            {filteredEvents.map((tx) => {
              const shortened = `${tx.hash.substring(0, 10)}...${tx.hash.substring(tx.hash.length - 8)}`;
              const isCopied = copiedTx === tx.id;

              return (
                <tr key={tx.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30 transition-colors group">
                  {/* Stage */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${tx.dotColor}`} />
                      <div>
                        <span className="font-semibold text-zinc-950 dark:text-white block">{tx.title}</span>
                        <span className="text-[10px] text-zinc-500">{tx.timestamp}</span>
                      </div>
                    </div>
                  </td>

                  {/* Hash with copy button */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-800 dark:text-zinc-300 font-medium">{shortened}</span>
                      <button
                        onClick={() => handleCopy(tx.hash, tx.id)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors p-0.5 cursor-pointer"
                        title="Copy full transaction hash"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>

                  {/* Details / Payload */}
                  <td className="py-3 pr-3 text-zinc-700 dark:text-zinc-300">
                    <span className="text-[11px]">{tx.details}</span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 pr-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      isDark
                        ? tx.statusBadge
                        : tx.type === 'ORACLE'
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{tx.status}</span>
                    </span>
                  </td>

                  {/* Explorer Link */}
                  <td className="py-3 text-right">
                    <a
                      href={`https://shannon-explorer.somnia.network/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => sounds.playClick()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 border border-zinc-200 dark:border-white/[0.06] hover:border-cyan-500/40 text-[11px] transition-colors shadow-2xs"
                    >
                      <span>Receipt</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
