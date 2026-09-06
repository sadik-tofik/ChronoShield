import React, { useEffect, useRef, useState } from 'react';
import { Activity, ShieldAlert, Cpu, Radio } from 'lucide-react';

export default function ParticleNexusCanvas({ stressDrop = 0, healthFactor = 1.36, theme = 'light' }) {
  const canvasRef = useRef(null);
  const [fps, setFps] = useState(60);
  const [latency, setLatency] = useState(42);
  const isDark = theme === 'dark';

  // Randomize latency slightly to feel hyper-live
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(38 + Math.random() * 8));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle system setup: 15,360 particles
    const PARTICLE_COUNT = 15360;
    const angles = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const radii = new Float32Array(PARTICLE_COUNT);
    const depths = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      angles[i] = Math.random() * Math.PI * 2;
      radii[i] = Math.pow(Math.random(), 0.6) * Math.min(width, height) * 0.38 + 15;
      speeds[i] = (0.002 + Math.random() * 0.005) * (Math.random() > 0.4 ? 1 : -1);
      depths[i] = Math.random();
    }

    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;
    let globalRotation = 0;

    const render = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      frameCount++;
      fpsTimer += dt;
      if (fpsTimer >= 1.0) {
        setFps(Math.round(frameCount / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      // Dynamic color & chaos transition according to stressDrop (0 - 40)
      const stressRatio = Math.min(Math.max(stressDrop / 40, 0), 1);
      const isCritical = healthFactor < 1.15;
      const isLiquidatable = healthFactor < 1.0;

      // Trailing motion blur: clear background according to active theme
      if (isDark) {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.45)';
      } else {
        // Clinical Liquid Tech: crisp clean off-white
        ctx.fillStyle = 'rgba(248, 250, 252, 0.55)';
      }
      ctx.fillRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      globalRotation += (0.25 + stressRatio * 1.8) * dt;

      // Determine palette based on risk state & active theme
      let r, g, b;
      if (isLiquidatable) {
        // Circuit breaker crimson
        r = isDark ? 239 : 220;
        g = isDark ? 68 : 38;
        b = isDark ? 68 : 38;
      } else if (isCritical) {
        // Warning amber
        r = isDark ? 245 : 217;
        g = isDark ? 158 : 119;
        b = isDark ? 11 : 6;
      } else {
        // Safe: Electric Cyan / Sapphire
        if (isDark) {
          r = Math.floor(6 + stressRatio * 120);
          g = Math.floor(182 - stressRatio * 80);
          b = Math.floor(212 + stressRatio * 40);
        } else {
          r = Math.floor(2 + stressRatio * 150);
          g = Math.floor(132 - stressRatio * 60);
          b = Math.floor(199 + stressRatio * 30);
        }
      }

      // Draw pulsating core shockwaves when stressed
      if (stressRatio > 0.25) {
        const pulse = (Math.sin(time * 0.008) * 0.5 + 0.5) * 40 * stressRatio;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50 + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${isDark ? 0.15 * stressRatio : 0.22 * stressRatio})`;
        ctx.lineWidth = 2 + stressRatio * 3;
        ctx.stroke();
        ctx.restore();
      }

      // Render particles
      const particleAlpha = isDark ? 0.65 : 0.78;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${particleAlpha})`;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const turbulence = stressRatio > 0.3 
          ? (Math.sin(i * 99 + time * 0.01) * stressRatio * 12) 
          : 0;
        
        angles[i] += speeds[i] * (1 + stressRatio * 2.5);
        const currentR = radii[i] + turbulence + Math.sin(time * 0.002 + i) * 6;

        const effectiveAngle = angles[i] + globalRotation * 0.15;
        const x = centerX + Math.cos(effectiveAngle) * currentR;
        const y = centerY + Math.sin(effectiveAngle) * currentR * 0.82;

        const pSize = depths[i] > 0.9 ? 2.0 : depths[i] > 0.7 ? 1.4 : 0.9;
        ctx.fillRect(x, y, pSize, pSize);
      }

      // Render nexus rings and crosshairs
      ctx.save();
      const ringAlpha = isDark ? (0.12 + stressRatio * 0.2) : (0.18 + stressRatio * 0.25);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${ringAlpha})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      // Outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(width, height) * 0.38, 0, Math.PI * 2);
      ctx.stroke();

      // Middle ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(width, height) * 0.22, 0, Math.PI * 2);
      ctx.stroke();

      // Center crosshair
      ctx.setLineDash([]);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${isDark ? 0.4 : 0.6})`;
      ctx.beginPath();
      ctx.moveTo(centerX - 14, centerY);
      ctx.lineTo(centerX + 14, centerY);
      ctx.moveTo(centerX, centerY - 14);
      ctx.lineTo(centerX, centerY + 14);
      ctx.stroke();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [stressDrop, healthFactor, isDark]);

  // Status banner styling for light & dark modes
  const isDanger = healthFactor < 1.15;
  const isLiquidatable = healthFactor < 1.0;

  const statusColor = isLiquidatable 
    ? 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10' 
    : isDanger 
    ? 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10' 
    : 'text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30 bg-cyan-50/90 dark:bg-cyan-950/40';

  return (
    <div className="relative w-full h-full min-h-[480px] lg:min-h-full overflow-hidden bg-slate-100/60 dark:bg-[#0A0A0F] flex items-center justify-center select-none border-l border-zinc-200 dark:border-white/[0.06] transition-colors duration-200">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Subtle Scanline Overlay */}
      <div className="absolute inset-0 scanline-overlay opacity-10 dark:opacity-20 pointer-events-none" />

      {/* High-tech HUD Reticle Top Left */}
      <div className="absolute top-6 left-6 flex items-center gap-2 font-mono text-[11px] text-zinc-700 dark:text-zinc-400 z-10 bg-white/90 dark:bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-white/[0.08] backdrop-blur-md shadow-xs">
        <span className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" />
        <span className="font-semibold">R-NEXUS MATRIX</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span className="text-cyan-700 dark:text-cyan-300 font-bold">15,360 NODES</span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span className="text-zinc-600 dark:text-zinc-300">{fps} FPS</span>
      </div>

      {/* Target HUD Overlays with connecting lines */}
      {/* 1. Top Right: Oracle Latency */}
      <div className="absolute top-12 right-8 z-10 hidden sm:flex flex-col items-end">
        <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-950/90 border border-cyan-300 dark:border-cyan-500/30 px-3 py-1.5 rounded-lg backdrop-blur-md font-mono text-xs text-zinc-800 dark:text-zinc-300 shadow-sm">
          <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
          <span className="text-zinc-500 dark:text-zinc-400">Oracle Latency:</span>
          <span className="font-bold text-cyan-700 dark:text-cyan-300">{latency}ms</span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold px-1 rounded bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20">LIVE</span>
        </div>
        <svg className="w-24 h-12 stroke-cyan-600/40 dark:stroke-cyan-500/40 pointer-events-none mt-1" viewBox="0 0 96 48">
          <polyline points="96,0 60,0 20,48" fill="none" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="20" cy="48" r="2.5" fill={isDark ? '#06B6D4' : '#0284C7'} />
        </svg>
      </div>

      {/* 2. Middle Left: Shannon Feed Status */}
      <div className="absolute top-1/2 -translate-y-12 left-6 z-10 hidden sm:flex flex-col items-start">
        <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-950/90 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg backdrop-blur-md font-mono text-xs text-zinc-800 dark:text-zinc-300 shadow-sm">
          <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span className="text-zinc-500 dark:text-zinc-400">Shannon Feed:</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">ACTIVE</span>
          <span className="text-[10px] text-zinc-500 font-medium">CH-50312</span>
        </div>
        <svg className="w-28 h-12 stroke-emerald-600/40 dark:stroke-emerald-500/40 pointer-events-none" viewBox="0 0 112 48">
          <polyline points="0,0 40,0 112,48" fill="none" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="112" cy="48" r="2.5" fill={isDark ? '#10B981' : '#059669'} />
        </svg>
      </div>

      {/* 3. Bottom Right: Down-Hedge Capacity */}
      <div className="absolute bottom-10 right-8 z-10 hidden sm:flex flex-col items-end">
        <svg className="w-32 h-14 stroke-violet-600/40 dark:stroke-violet-500/40 pointer-events-none mb-1" viewBox="0 0 128 56">
          <polyline points="10,0 70,56 128,56" fill="none" strokeWidth="1" strokeDasharray="3,3" />
          <circle cx="10" cy="0" r="2.5" fill={isDark ? '#8B5CF6' : '#7C3AED'} />
        </svg>
        <div className="flex items-center gap-2 bg-white/95 dark:bg-zinc-950/90 border border-violet-300 dark:border-violet-500/30 px-3 py-1.5 rounded-lg backdrop-blur-md font-mono text-xs text-zinc-800 dark:text-zinc-300 shadow-sm">
          <Cpu className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span className="text-zinc-500 dark:text-zinc-400">Down-Hedge Capacity:</span>
          <span className="font-bold text-violet-700 dark:text-violet-300">500,000 tUSDC</span>
        </div>
      </div>

      {/* Bottom Center: Live State Banner */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className={`px-3 py-1.5 rounded-lg border backdrop-blur-md font-mono text-[11px] flex items-center gap-2 transition-all duration-300 shadow-sm ${statusColor}`}>
          {isLiquidatable ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 animate-bounce text-rose-600 dark:text-rose-400" />
              <span className="font-bold tracking-wider">CIRCUIT-BREAKER TRIGGERED: DOWN CONTRACTS SECURED</span>
            </>
          ) : isDanger ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse text-amber-600 dark:text-amber-400" />
              <span className="font-bold tracking-wider">CRITICAL RISK: KEEPER DAEMON ARMED & POOL MATCHED</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
              <span className="font-semibold tracking-wide">SYSTEM NOMINAL // CONTINUOUS HEALTH ARBITRAGE</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
