import React, { useEffect, useRef } from 'react';
import { ArrowDown, FileText, ChevronRight, ShieldCheck, Zap, Lock, AlertTriangle } from 'lucide-react';
import ParticleNexusCanvas from './ParticleNexusCanvas';
import { sounds } from '../utils/audio';
import gsap from 'gsap';

export default function HeroSection({ stressDrop, healthFactor, onOpenWhitepaper, theme }) {
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const paraRef = useRef(null);
  const ctaRef = useRef(null);
  const tickerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from(headlineRef.current?.children || [], {
        y: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
      })
      .from(paraRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
      }, '-=0.5')
      .from(ctaRef.current?.children || [], {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
      }, '-=0.4')
      .from(tickerRef.current?.children || [], {
        y: 25,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
      }, '-=0.3');
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToCockpit = () => {
    sounds.playClick();
    const el = document.getElementById('cockpit-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={heroRef} className="relative w-full min-h-[calc(100vh-4rem)] border-b border-zinc-200 dark:border-white/[0.08] flex flex-col lg:flex-row items-stretch bg-slate-50 dark:bg-[#0A0A0F] overflow-hidden transition-colors duration-200">
      {/* Left Pane: Protocol Narrative */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10">
        <div className="space-y-6 max-w-xl">
          {/* Overline with live status */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100/90 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-400 font-mono text-xs tracking-wider shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 dark:bg-cyan-400 animate-ping" />
            <span className="font-semibold">// AUTONOMOUS ANTI-LIQUIDATION ENGINE — SOMNIA SHANNON TESTNET</span>
          </div>

          {/* Main Headline */}
          <div ref={headlineRef} className="space-y-1">
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-zinc-950 dark:text-white leading-none">
              Zero Bad Debt.
            </h1>
            <h2 className="text-2xl sm:text-4xl xl:text-5xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-500 dark:from-zinc-300 dark:via-zinc-400 dark:to-zinc-600 leading-tight">
              Absolute Collateral Continuity.
            </h2>
          </div>

          {/* Monospace Telemetry Paragraph */}
          <p ref={paraRef} className="font-mono text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-l-2 border-cyan-500 pl-4 bg-white/80 dark:bg-zinc-950/40 py-2.5 rounded-r-lg shadow-xs border-y border-r border-zinc-200/60 dark:border-white/[0.04]">
            ChronoShield monitors borrower Health Factor (HF) in real-time. When adverse market shocks drop HF below the <span className="text-amber-600 dark:text-amber-400 font-bold">1.15 safety barrier</span>, the autonomous keeper daemon instantaneously mints and redeems binary <span className="text-rose-600 dark:text-rose-400 font-bold">DOWN outcome contracts</span> on Somnia DreamDEX. Upon 5-minute settlement, event contract proceeds automatically subsidize the shortfall — shielding vaults from liquidation penalties.
          </p>

          {/* CTA Row */}
          <div ref={ctaRef} className="flex flex-wrap items-center gap-4 pt-2">
            {/* Primary CTA: Enter Cockpit */}
            <button
              onClick={scrollToCockpit}
              className="relative group overflow-hidden px-6 py-3.5 rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 dark:from-cyan-500 dark:to-emerald-500 text-white dark:text-zinc-950 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2.5 shadow-md shadow-cyan-600/20 dark:shadow-cyan-500/20 hover:shadow-cyan-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Enter Live Cockpit</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
            </button>

            {/* Secondary CTA: Read Whitepaper */}
            <button
              onClick={() => {
                sounds.playClick();
                onOpenWhitepaper?.();
              }}
              className="relative px-6 py-3.5 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-white/[0.12] hover:border-cyan-500/50 text-zinc-800 dark:text-zinc-200 font-mono text-xs uppercase tracking-wider flex items-center gap-2 backdrop-blur-md hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-all cursor-pointer tech-bracket shadow-xs"
            >
              <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Read Protocol Spec</span>
            </button>
          </div>
        </div>

        {/* Metrics Ticker (4 data modules with [ ] corner brackets) */}
        <div ref={tickerRef} className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 mt-6 border-t border-zinc-200 dark:border-white/[0.06]">
          {/* Metric 1 */}
          <div className="tech-bracket bg-white dark:bg-[#12121A] p-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:border-cyan-500/40 transition-colors shadow-xs">
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 mb-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wider font-semibold">LATENCY</span>
            </div>
            <div className="font-mono text-lg font-bold text-zinc-900 dark:text-white tracking-tight">0.01s</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Execution Speed</div>
          </div>

          {/* Metric 2 */}
          <div className="tech-bracket bg-white dark:bg-[#12121A] p-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:border-emerald-500/40 transition-colors shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wider font-semibold">INTEGRITY</span>
            </div>
            <div className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">100%</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">On-Chain Protocol</div>
          </div>

          {/* Metric 3 */}
          <div className="tech-bracket bg-white dark:bg-[#12121A] p-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:border-amber-500/40 transition-colors shadow-xs">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wider font-semibold">CIRCUIT</span>
            </div>
            <div className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400 tracking-tight">1.15 HF</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Automatic Trigger</div>
          </div>

          {/* Metric 4 */}
          <div className="tech-bracket bg-white dark:bg-[#12121A] p-3.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] hover:border-cyan-500/40 transition-colors shadow-xs">
            <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 tracking-wider font-semibold">SAVINGS</span>
            </div>
            <div className="font-mono text-lg font-bold text-zinc-900 dark:text-white tracking-tight">0.00</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Bad Debt Deficit</div>
          </div>
        </div>
      </div>

      {/* Right Pane: Generative Canvas Visualization */}
      <div className="w-full lg:w-1/2 relative min-h-[440px] lg:min-h-full">
        <ParticleNexusCanvas stressDrop={stressDrop} healthFactor={healthFactor} theme={theme} />
      </div>
    </section>
  );
}
