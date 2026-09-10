import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, RefreshCw, ExternalLink, Copy, Check, Radio, Database } from 'lucide-react';
import { sounds } from '../utils/audio';

const RPC_URL = 'https://dream-rpc.somnia.network';
const CONTRACT_ADDRESS = '0x728b9579edec0e8ef5422f2980c302d5bd266343';

// Function selectors for MockLendingPosition.sol
const SELECTORS = {
  collateralUsd: '0xe24112d3',
  borrowedDebtUsd: '0x848752b4',
  getHealthFactor: '0xa5f352b7',
};

export default function LiveOnChainPanel({ theme = 'light' }) {
  const [data, setData] = useState({
    collateralUsd: 2000.0,
    borrowedDebtUsd: 1250.0,
    healthFactor: 1.36,
  });
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchOnChainState = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setIsValidating(true);
    setError(null);

    try {
      const calls = [
        { id: 1, to: CONTRACT_ADDRESS, data: SELECTORS.collateralUsd },
        { id: 2, to: CONTRACT_ADDRESS, data: SELECTORS.borrowedDebtUsd },
        { id: 3, to: CONTRACT_ADDRESS, data: SELECTORS.getHealthFactor },
      ];

      const responses = await Promise.all(
        calls.map((c) =>
          fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: c.id,
              method: 'eth_call',
              params: [{ to: c.to, data: c.data }, 'latest'],
            }),
          }).then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
        )
      );

      const [colRes, debtRes, hfRes] = responses;

      if (colRes?.result && debtRes?.result && hfRes?.result) {
        // Raw values are 18-decimal uint256 fixed point (e.g. 2000e18)
        const colVal = Number(BigInt(colRes.result)) / 1e18;
        const debtVal = Number(BigInt(debtRes.result)) / 1e18;
        const hfVal = Number(BigInt(hfRes.result)) / 1e18;

        setData({
          collateralUsd: colVal,
          borrowedDebtUsd: debtVal,
          healthFactor: hfVal,
        });
        setLastUpdated(new Date().toLocaleTimeString());
        setIsInitialLoad(false);
      } else {
        throw new Error('Invalid RPC call payload');
      }
    } catch (err) {
      console.warn('On-Chain Adapter Poll Error:', err);
      setError('RPC Stalled — Retrying');
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
      setIsValidating(false);
      if (isManual) {
        setTimeout(() => setRefreshing(false), 500);
      }
    }
  }, []);

  useEffect(() => {
    fetchOnChainState();
    const timer = setInterval(() => fetchOnChainState(false), 8000);
    return () => clearInterval(timer);
  }, [fetchOnChainState]);

  const handleManualRefresh = () => {
    sounds.playClick();
    fetchOnChainState(true);
  };

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hf = data.healthFactor;
  const isSafe = hf >= 1.20;
  const isWarning = hf >= 1.00 && hf < 1.20;
  const isLiquidatable = hf < 1.00;

  return (
    <div className="rounded-3xl bg-white dark:bg-[#0E0E14] border border-cyan-500/30 dark:border-cyan-500/20 shadow-lg shadow-cyan-500/5 p-5 sm:p-6 space-y-5 transition-all duration-300 relative overflow-hidden">
      {/* Subtle background ambient pulse */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans font-bold text-sm sm:text-base text-zinc-950 dark:text-white tracking-tight">
                Live On-Chain Adapter State
              </h3>
              <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/40">
                MockLendingPosition.sol
              </span>
            </div>
            <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Updates continuously when <code className="text-zinc-700 dark:text-zinc-300">shock-position.mjs</code> or <code className="text-zinc-700 dark:text-zinc-300">reset-position.mjs</code> execute on-chain
            </p>
          </div>
        </div>

        {/* Action buttons & Status */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isInitialLoad ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
              Syncing Live RPC...
            </span>
          ) : error ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </span>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live On-Chain</span>
            </div>
          )}

          <button
            onClick={handleManualRefresh}
            disabled={refreshing || isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white border border-zinc-200 dark:border-white/[0.08] text-xs font-mono transition-all cursor-pointer disabled:opacity-50"
            title="Force immediate RPC poll"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ${refreshing || isValidating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Health Factor */}
        <div className={`p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.06] space-y-1 transition-opacity duration-300 ${isInitialLoad ? 'opacity-80' : 'opacity-100'}`}>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span>REAL ON-CHAIN HF</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              isInitialLoad ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 animate-pulse' :
              isSafe ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400' :
              isWarning ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 animate-pulse' :
              'bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 animate-bounce'
            }`}>
              {isInitialLoad ? 'SYNCING...' : isSafe ? 'SAFE' : isWarning ? 'HAZARD ACTIVE' : 'LIQUIDATABLE'}
            </span>
          </div>
          <div className="text-3xl font-mono font-bold tracking-tight">
            {isInitialLoad ? (
              <span className="text-slate-400 dark:text-slate-500 animate-pulse">--.---</span>
            ) : (
              <span className={
                isSafe ? 'text-emerald-600 dark:text-emerald-400' :
                isWarning ? 'text-amber-600 dark:text-amber-400' :
                'text-rose-600 dark:text-rose-500'
              }>
                {hf.toFixed(3)}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
            <span>Threshold: 1.150 | Liquidation: 1.000</span>
            {isInitialLoad && <span className="text-amber-600 dark:text-amber-400 font-semibold animate-pulse">Syncing...</span>}
          </p>
        </div>

        {/* Metric 2: Collateral USD */}
        <div className={`p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.06] space-y-1 transition-opacity duration-300 ${isInitialLoad ? 'opacity-80' : 'opacity-100'}`}>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span>COLLATERAL STORAGE</span>
            {isInitialLoad && (
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 animate-pulse font-medium">
                Syncing...
              </span>
            )}
          </div>
          <div className="text-3xl font-mono font-bold text-zinc-950 dark:text-white">
            {isInitialLoad ? (
              <span className="text-slate-400 dark:text-slate-500 animate-pulse">$---.--</span>
            ) : (
              <span>${data.collateralUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            Storage: collateralUsd()
          </p>
        </div>

        {/* Metric 3: Borrowed Debt USD */}
        <div className={`p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/[0.06] space-y-1 transition-opacity duration-300 ${isInitialLoad ? 'opacity-80' : 'opacity-100'}`}>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400">
            <span>BORROWED DEBT</span>
            {isInitialLoad && (
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 animate-pulse font-medium">
                Syncing...
              </span>
            )}
          </div>
          <div className="text-3xl font-mono font-bold text-zinc-950 dark:text-white">
            {isInitialLoad ? (
              <span className="text-slate-400 dark:text-slate-500 animate-pulse">$---.--</span>
            ) : (
              <span>${data.borrowedDebtUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
          </div>
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
            Storage: borrowedDebtUsd()
          </p>
        </div>
      </div>

      {/* Contract Anchor Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 text-xs font-mono text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-zinc-400 dark:text-zinc-500">Contract:</span>
          <code className="text-zinc-800 dark:text-zinc-200 font-semibold bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
            {CONTRACT_ADDRESS}
          </code>
          {isInitialLoad && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60 animate-pulse">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
              </span>
              INITIALIZING ON-CHAIN TAPE...
            </span>
          )}
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Copy contract address"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <a
            href={`https://shannon-explorer.somnia.network/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            <span>Shannon Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
          {isInitialLoad ? (
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Syncing with Somnia Shannon RPC...
            </span>
          ) : lastUpdated ? (
            `Polled at ${lastUpdated} (~8s interval)`
          ) : (
            'Syncing with Somnia Shannon RPC...'
          )}
        </div>
      </div>
    </div>
  );
}
