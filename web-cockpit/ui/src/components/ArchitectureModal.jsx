import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Activity, 
  Search, 
  GitFork, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Layers, 
  Zap, 
  FileCode, 
  ArrowRight, 
  TrendingDown, 
  Maximize2 
} from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'dualRoute' | 'blueprint' | 'contracts'
  const [selectedStage, setSelectedStage] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isImageZoomed) {
          setIsImageZoomed(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isImageZoomed]);

  if (!isOpen) return null;

  const PIPELINE_STAGES = [
    {
      id: "surveillance",
      badge: "Stage 1",
      title: "Position Surveillance & Oracle Telemetry",
      subtitle: "MockLendingPosition.sol & Pyth Hermes Feeder",
      tag: "REAL-TIME MONITORING",
      tagColor: "cyan",
      description: "ChronoShield continuously polls on-chain lending health factor and real-world price feeds (Pyth Hermes ETH/USD with fallback). When a price shock causes collateral to drop, the health factor is computed on-chain.",
      formula: "HF = (Collateral × 0.85) / Borrowed Debt",
      metrics: [
        { label: "Healthy Baseline", value: "Collateral: $2,000 | Debt: $1,250 | HF: 1.360" },
        { label: "25% Volatility Shock", value: "Collateral: $1,500 | Debt: $1,250 | HF: 1.020" },
        { label: "Emergency Threshold", value: "HF < 1.150 triggers autonomous guardian reaction" }
      ],
      component: "MockLendingPosition (0x728b...6343) on Somnia Shannon",
      stateChange: "applyShock(25) transitions position from SAFE to LIQUIDATION HAZARD."
    },
    {
      id: "gates",
      badge: "Stage 2",
      title: "Pre-Flight Fail-Closed Policy Gates",
      subtitle: "Institutional Risk Controls Before Capital Deployment",
      tag: "4 INSTITUTIONAL GATES",
      tagColor: "amber",
      description: "Before placing any orders or spending gas, the keeper daemon evaluates 4 deterministic institutional risk gates. If even one gate fails, the system safely aborts with zero capital at risk.",
      gates: [
        { name: "Gate 1: Expiry Headroom", rule: "Market expiry must be ≥ 120s away", status: "PASS (e.g. 231s remaining)" },
        { name: "Gate 2: Hedge Budget Cap", rule: "Total hedge spend capped at $10.00 USDC", status: "PASS ($2.00 committed)" },
        { name: "Gate 3: Operator Registry", rule: "Caller signature verified against whitelist", status: "PASS (0x9C48... authorized)" },
        { name: "Gate 4: Route Sanity Check", rule: "Price deviation & fallback pathway validated", status: "PASS (Layer-2 Fallback armed)" }
      ],
      component: "Keeper Daemon Policy Subsystem (`config.mjs`)",
      stateChange: "Evaluated off-chain in memory prior to signing any testnet transaction."
    },
    {
      id: "discovery",
      badge: "Stage 3",
      title: "Dynamic Market Discovery & CLOB Depth Sensor",
      subtitle: "Querying Somnia Shannon DreamDEX Protocol",
      tag: "ORDERBOOK INSPECTION",
      tagColor: "purple",
      description: "The daemon queries DreamDEX binary event markets dynamically to identify the active ETH downside market. It then inspects Central Limit Orderbook (CLOB) depth to determine liquidity availability.",
      metrics: [
        { label: "Target Market", value: "DreamDEX Binary Pool (e.g. 0x5397...3D62)" },
        { label: "Orderbook Bids", value: "0 resting bids detected" },
        { label: "Orderbook Asks", value: "0 resting asks detected (Orderbook Drought)" },
        { label: "Routing Decision", value: "CLOB IOC cannot fill -> Engage Protocol Fallback" }
      ],
      component: "DreamDEX SDK & Somnia Shannon RPC (Chain ID 50312)",
      stateChange: "Dynamic route branch selected based on real-time orderbook depth."
    },
    {
      id: "execution",
      badge: "Stage 4",
      title: "Adaptive Dual-Layer Execution Engine",
      subtitle: "The Liquidation Gap Solution: Protocol mintSet Fallback",
      tag: "100% FILL GUARANTEE",
      tagColor: "emerald",
      description: "Standard taker bots fail with ImmediateOrCancelNoFill when orderbooks dry up during crashes. ChronoShield eliminates this failure mode: if CLOB depth is empty, it bypasses the orderbook and invokes protocol-level mintSet to mint guaranteed complete sets.",
      routes: [
        {
          name: "Route 1: CLOB IOC Taker",
          when: "When ask liquidity exists on the book",
          how: "Takes resting asks at or below maximum acceptable price",
          guarantee: "Execution depends on maker liquidity"
        },
        {
          name: "Route 2: Protocol mintSet Fallback (The Breakthrough)",
          when: "During 0-liquidity droughts (empty orderbooks)",
          how: "Direct smart contract call: locks 1 USDC -> creates 1 UP + 1 DOWN token",
          guarantee: "100% deterministic fill directly from protocol math. Zero slippage, zero counterparty dependency."
        }
      ],
      component: "DreamDEX Core Contract & Somnia Shannon Transaction Broadcaster",
      stateChange: "DOWN token balance secured in keeper vault (Tx: 0x19d6...5666)."
    },
    {
      id: "settlement",
      badge: "Stage 5",
      title: "Solvency Restoration & Cryptographic Evidence Seal",
      subtitle: "Position Reset & SHA-256 Audit Tape Generation",
      tag: "CRYPTOGRAPHIC SEAL",
      tagColor: "rose",
      description: "With downside coverage secured, the lending position is protected against liquidation penalties. The keeper resets the testnet position back to baseline solvency and publishes an immutable SHA-256 sealed audit receipt.",
      metrics: [
        { label: "Restored Health Factor", value: "1.360 (SAFE - Zero Bad Debt)" },
        { label: "Liquidation Penalty Avoided", value: "10%–15% standard liquidation haircut prevented" },
        { label: "Signed Audit Receipt", value: "run-2026-09-10T04-56-23-510Z.json" },
        { label: "Cryptographic SHA-256 Seal", value: "2a588f7702703378dd9a77f3e8cc3104f4460ff6510e65ad3757768342c514c9" }
      ],
      component: "MockLendingPosition.resetPosition() & Local Evidence Chaining",
      stateChange: "Position restored on-chain; execution receipt verified against Somnia RPC."
    }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#0b101c] border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="bg-[#070a14] border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">ChronoShield System Architecture</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-semibold hidden sm:inline">
                  Dual-Layer Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous anti-liquidation protection powered by DreamDEX binary event contracts on Somnia Shannon (50312).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900/80 border border-slate-800 cursor-pointer transition hover:bg-slate-800"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-[#090d18] border-b border-slate-800/80 px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pipeline'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interactive Flow Pipeline</span>
            </button>

            <button
              onClick={() => setActiveTab('dualRoute')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'dualRoute'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dual-Route Solution Matrix</span>
            </button>

            <button
              onClick={() => setActiveTab('blueprint')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'blueprint'
                  ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>System Blueprint Image</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'contracts'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>On-Chain Contracts</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden md:flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Somnia Shannon Chain ID 50312</span>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ========================================================================= */}
          {/* TAB 1: INTERACTIVE FLOW PIPELINE                                          */}
          {/* ========================================================================= */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              
              {/* Pipeline Step Navigator */}
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 font-semibold flex items-center justify-between">
                  <span>5-Stage Autonomous Anti-Liquidation Lifecycle</span>
                  <span className="text-cyan-400 text-[11px]">Click a stage to inspect state & contracts</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
                  {PIPELINE_STAGES.map((stg, idx) => (
                    <button
                      key={stg.id}
                      onClick={() => setSelectedStage(idx)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between min-h-[72px] ${
                        selectedStage === idx
                          ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] font-bold ${selectedStage === idx ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {stg.badge}
                        </span>
                        {selectedStage === idx && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <div className="text-[11px] font-semibold leading-tight line-clamp-2">
                        {stg.title.split('&')[0]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Flow Arrow Connection Strip */}
              <div className="p-3.5 rounded-xl bg-[#070a14] border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Activity className="w-3.5 h-3.5" /> 1. Lending Monitor (HF &lt; 1.15)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
                <span className="flex items-center gap-1.5 text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> 2. Four Fail-Closed Gates
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
                <span className="flex items-center gap-1.5 text-purple-400">
                  <Search className="w-3.5 h-3.5" /> 3. Orderbook Sensor
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Zap className="w-3.5 h-3.5" /> 4. Protocol mintSet Fallback
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
                <span className="flex items-center gap-1.5 text-rose-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 5. Sealed Receipt
                </span>
              </div>

              {/* Selected Stage Detail Card */}
              {(() => {
                const stage = PIPELINE_STAGES[selectedStage];
                return (
                  <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#070a14] border border-slate-800 space-y-4 shadow-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                            {stage.badge}
                          </span>
                          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            {stage.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{stage.subtitle}</p>
                      </div>

                      <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        {stage.tag}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {stage.description}
                    </p>

                    {/* Formula Box if any */}
                    {stage.formula && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-cyan-900/40 font-mono text-xs text-cyan-300 flex items-center justify-between">
                        <span>Solvency Formula: <strong>{stage.formula}</strong></span>
                        <span className="text-[10px] text-slate-500">Threshold: 8500 BPS</span>
                      </div>
                    )}

                    {/* Metrics / Key facts */}
                    {stage.metrics && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                        {stage.metrics.map((m, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                            <div className="text-[10px] uppercase text-slate-400">{m.label}</div>
                            <div className="font-bold text-slate-200 mt-0.5">{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Gate listing if Stage 2 */}
                    {stage.gates && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        {stage.gates.map((g, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-amber-300">{g.name}</div>
                              <div className="text-[11px] text-slate-400">{g.rule}</div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 shrink-0 font-bold">
                              {g.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Routes if Stage 4 */}
                    {stage.routes && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                        {stage.routes.map((r, i) => (
                          <div 
                            key={i} 
                            className={`p-4 rounded-xl border space-y-2 ${
                              i === 1 
                                ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-950/40' 
                                : 'bg-slate-900/60 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-bold ${i === 1 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                {r.name}
                              </span>
                              {i === 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                  CORE INNOVATION
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">Trigger: {r.when}</p>
                            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-300">
                              {r.how}
                            </div>
                            <div className={`text-[11px] font-semibold ${i === 1 ? 'text-emerald-300' : 'text-slate-400'}`}>
                              ✔ {r.guarantee}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Component & State transition summary */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <span className="text-slate-400">
                        Component: <code className="text-cyan-300">{stage.component}</code>
                      </span>
                      <span className="text-emerald-400">
                        {stage.stateChange}
                      </span>
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DUAL-ROUTE SOLUTION MATRIX                                         */}
          {/* ========================================================================= */}
          {activeTab === 'dualRoute' && (
            <div className="space-y-6 text-xs">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  The Liquidation Gap &amp; The Dual-Route Breakthrough
                </h3>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Why traditional taker bots fail during market crashes, and how ChronoShield provides guaranteed downside coverage through protocol complete-set minting.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Route 1 Card */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Route 1 (Baseline)</span>
                      <h4 className="text-sm font-bold text-slate-200">Layer-1 CLOB IOC Taker</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      Normal Orderbook
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    When the binary event market has active market makers posting resting limit asks, the keeper executes an Immediate-Or-Cancel (IOC) taker order to purchase existing DOWN tokens.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 font-mono text-[11px]">
                    <div className="text-slate-400">Execution Mechanism:</div>
                    <div className="text-cyan-300">OrderBook.executeIOC(takerOrder, signatures)</div>
                    <div className="text-slate-400 pt-1">Condition:</div>
                    <div className="text-emerald-400">Resting Ask Volume &gt; 0 &amp;&amp; Price &lt;= Max Cap</div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> The Liquidation Gap Vulnerability:
                    </div>
                    <p className="text-[11px] text-slate-400">
                      During extreme market crashes, market makers pull quotes. Naive keepers attempting IOC orders fail with <code className="text-rose-400">ImmediateOrCancelNoFill</code>, leaving the borrower unhedged and exposed to liquidation penalties.
                    </p>
                  </div>
                </div>

                {/* Route 2 Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-[#070a14] border border-emerald-500/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-emerald-900/50 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Route 2 (ChronoShield Core)</span>
                      <h4 className="text-sm font-bold text-white">Protocol mintSet Complete-Set Fallback</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-900/60 text-emerald-300 border border-emerald-700 font-bold">
                      100% Fill Guarantee
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">
                    When the CLOB orderbook is dry (0 bids, 0 asks), ChronoShield <strong>bypasses the orderbook entirely</strong> and interacts with DreamDEX core contracts to mint guaranteed complete sets.
                  </p>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-900/60 space-y-2 font-mono text-[11px]">
                    <div className="text-slate-400">Execution Mechanism:</div>
                    <div className="text-emerald-300">DreamDEX.mintSet(marketId, hedgeAmount)</div>
                    <div className="text-slate-400 pt-1">Condition:</div>
                    <div className="text-cyan-400">Orderbook Depth == 0 (Triggered on Drought)</div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mathematical Execution Certainty:
                    </div>
                    <p className="text-[11px] text-slate-300">
                      DreamDEX math guarantees that 1 USDC locks to produce exactly 1 UP + 1 DOWN token. Because this relies on contract state rather than counterparty orders, execution is <strong>100% guaranteed</strong> with 0 slippage.
                    </p>
                  </div>
                </div>

              </div>

              {/* Comparative Feature Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#070a14] border-b border-slate-800 text-slate-400 text-[11px]">
                    <tr>
                      <th className="p-3">Dimension</th>
                      <th className="p-3">Route 1: Layer-1 IOC Taker</th>
                      <th className="p-3 text-emerald-400">Route 2: Protocol mintSet Fallback</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-slate-400">Counterparty Required</td>
                      <td className="p-3 text-amber-400">YES (Maker Asks Needed)</td>
                      <td className="p-3 text-emerald-400 font-bold">NO (Direct Protocol Mint)</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-slate-400">Execution During Flash Crash</td>
                      <td className="p-3 text-rose-400">Reverts on Empty Book</td>
                      <td className="p-3 text-emerald-400 font-bold">100% Guaranteed Success</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-slate-400">Slippage &amp; Spread Impact</td>
                      <td className="p-3 text-amber-400">Subject to CLOB Spread</td>
                      <td className="p-3 text-emerald-400 font-bold">0.00% Mathematical Parity</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-slate-400">Post-Hedge Position</td>
                      <td className="p-3">Holds DOWN tokens</td>
                      <td className="p-3 text-cyan-300">Holds DOWN (Hedge) + UP (Residual)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SYSTEM BLUEPRINT IMAGE                                             */}
          {/* ========================================================================= */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Full System Architecture Schematic</h3>
                  <p className="text-xs text-slate-400">
                    Hardware, keeper daemon, smart contract interfaces, and Somnia Shannon testnet integration.
                  </p>
                </div>

                <button
                  onClick={() => setIsImageZoomed(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-cyan-400 transition cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Enlarge Blueprint</span>
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#070a14] shadow-2xl relative group">
                <img
                  src="/assets/architecture.png"
                  alt="ChronoShield Architecture Diagram"
                  className="w-full h-auto max-h-[540px] object-contain mx-auto"
                />
                <div className="p-3 bg-[#0b101c] border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Fig 1.1 — ChronoShield Autonomous Dual-Layer Architecture</span>
                  <span className="text-cyan-400">Verified Somnia Shannon Deployments</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ON-CHAIN CONTRACTS & REPOSITORY INTERFACES                         */}
          {/* ========================================================================= */}
          {activeTab === 'contracts' && (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight font-sans">
                  Deployed Somnia Shannon Smart Contracts &amp; Data Feeds
                </h3>
                <p className="text-slate-400 text-xs mt-1 font-sans">
                  All contracts are deployed on Somnia Shannon Testnet (Chain ID 50312) and verified against block receipts.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">MockLendingPosition.sol (Solvency Adapter)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400">
                      CONFIRMED #484098396
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Address: <a href="https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">
                      0x728b9579edec0e8ef5422f2980c302d5bd266343 <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Exposes <code className="text-slate-200">collateralUsd()</code>, <code className="text-slate-200">borrowedDebtUsd()</code>, <code className="text-slate-200">applyShock(percent)</code>, and <code className="text-slate-200">resetPosition()</code> for institutional testing and borrower solvency tracking.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400">DreamDEX Protocol Contracts (Event Markets)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                      SHANNON L1 ECOSYSTEM
                    </span>
                  </div>
                  <div className="text-slate-300">
                    Target Market: <code className="text-emerald-300">0x5397cd6DE6e87eB7f2D9B72191B5eFfb16E53D62</code>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Provides binary event outcomes (UP/DOWN tokens) collateralized by Testnet USDC (6 decimals). Supports both central limit orderbook execution and direct <code className="text-slate-200">mintSet</code> complete-set creation.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-400">Pyth Network Hermes Feeder</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-400">
                      HIGH-FREQUENCY FEED
                    </span>
                  </div>
                  <div className="text-slate-300">
                    ETH/USD Feed ID: <code className="text-purple-300 text-[10px]">0xff61491a931112ddf1bdc4c21e00b143241be85ac4127009a40bda10d237732a</code>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Polls Pyth Hermes v2 with optional bearer authentication. Computes live delta against persistent <code className="text-slate-200">.oracle-baseline.json</code> with institutional fallback to Coinbase/Binance when unauthenticated.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Footer Note */}
        <div className="bg-[#070a14] border-t border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 shrink-0">
          <span>ChronoShield Architecture — Built for Somnia Shannon &amp; DreamDEX Hackathon 2026</span>
          <a 
            href="/docs.html" 
            target="_blank" 
            rel="noreferrer" 
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
          >
            Full Developer Documentation ↗
          </a>
        </div>
      </div>

      {/* Fullscreen Image Zoom Overlay */}
      {isImageZoomed && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsImageZoomed(false)}
        >
          <button
            onClick={() => setIsImageZoomed(false)}
            className="absolute top-6 right-6 text-white p-2 rounded-xl bg-slate-900 border border-slate-700 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src="/assets/architecture.png"
            alt="ChronoShield Architecture Diagram Fullscreen"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
