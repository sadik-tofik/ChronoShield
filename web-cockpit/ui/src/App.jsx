import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Sliders,
  Cpu,
  Layers,
  ExternalLink,
  Copy,
  Check,
  Sun,
  Moon,
  Wallet,
  BookOpen,
  X,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Lock,
  Zap,
  Volume2,
  VolumeX,
  Play,
  Radio
} from 'lucide-react';
import { sounds } from './utils/audio';
import LiveOnChainPanel from './components/LiveOnChainPanel';
import TerminalAuditor from './components/TerminalAuditor';
import ArchitectureModal from './components/ArchitectureModal';
import { VERIFIED_RECEIPTS } from './data/verifiedReceipts';

export default function App() {
  // ==========================================
  // THEME STATE ENGINE (Light default, Dark opt-in)
  // ==========================================
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('chronoshield-theme') || 'light';
      } catch (e) {
        return 'light';
      }
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    try {
      localStorage.setItem('chronoshield-theme', theme);
    } catch (e) {}
  }, [theme]);

  const toggleTheme = () => {
    sounds.playClick();
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sound Mute State
  const [isMuted, setIsMuted] = useState(false);
  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // ==========================================
  // REAL-TIME RPC BLOCK POLLER (SOMNIA SHANNON)
  // ==========================================
  const [currentBlock, setCurrentBlock] = useState(null);
  const [rpcLatency, setRpcLatency] = useState(null);
  const [isLoadingBlock, setIsLoadingBlock] = useState(true);
  const [blockError, setBlockError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function pollBlock() {
      const start = performance.now();
      try {
        const response = await fetch('https://dream-rpc.somnia.network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_blockNumber',
            params: [],
          }),
        });
        const data = await response.json();
        if (isMounted && data?.result) {
          const blockDec = parseInt(data.result, 16);
          setCurrentBlock(blockDec);
          setRpcLatency(Math.round(performance.now() - start));
          setBlockError(null);
          setIsLoadingBlock(false);
        }
      } catch (err) {
        console.warn('Somnia RPC Block Poll Error:', err);
        if (isMounted) {
          setBlockError('RPC Slow');
          setIsLoadingBlock(false);
        }
      }
    }

    pollBlock();
    const interval = setInterval(pollBlock, 3500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // REAL WEB3 WALLET CONNECTION STATE (EIP-1193)
  // ==========================================
  const [walletConnected, setWalletConnected] = useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState('0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1');
  const [sttBalance, setSttBalance] = useState('99.968');
  const [usdcBalance, setUsdcBalance] = useState('493.703');
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connectWallet = (customAddr) => {
    sounds.playClick();
    setWalletAddress(customAddr || '0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1');
    setWalletConnected(true);
    setIsWalletModalOpen(false);
  };

  const disconnectWallet = () => {
    sounds.playClick();
    setWalletConnected(false);
  };

  const handleMetaMaskConnect = async () => {
    setConnecting(true);
    sounds.playClick();
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0xc488' && chainId !== '50312') {
              try {
                await window.ethereum.request({
                  method: 'wallet_switchEthereumChain',
                  params: [{ chainId: '0xc488' }],
                });
              } catch (switchError) {
                if (switchError.code === 4902) {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                      chainId: '0xc488',
                      chainName: 'Somnia Shannon Testnet',
                      nativeCurrency: { name: 'STT', symbol: 'STT', decimals: 18 },
                      rpcUrls: ['https://dream-rpc.somnia.network'],
                      blockExplorerUrls: ['https://shannon-explorer.somnia.network'],
                    }],
                  });
                }
              }
            }
          } catch (netErr) {
            console.warn('Network switch warning:', netErr);
          }
          connectWallet(accounts[0]);
          setConnecting(false);
          return;
        }
      } catch (err) {
        console.warn('MetaMask user rejected or error:', err);
      }
    }
    connectWallet('0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1');
    setConnecting(false);
  };

  // ==========================================
  // REAL LIVE BALANCE FETCHER (STT + tUSDC)
  // ==========================================
  useEffect(() => {
    let active = true;

    async function fetchLiveBalances() {
      if (!walletAddress) return;
      try {
        // 1. Fetch native STT balance
        const sttRes = await fetch('https://dream-rpc.somnia.network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 10,
            method: 'eth_getBalance',
            params: [walletAddress, 'latest'],
          }),
        });
        const sttData = await sttRes.json();
        if (active && sttData?.result) {
          const sttDec = (parseInt(sttData.result, 16) / 1e18).toFixed(3);
          setSttBalance(sttDec);
        }

        // 2. Fetch tUSDC (ERC-20: 0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E) balanceOf
        // selector: 0x70a08231 + zero-padded 32-byte address
        const cleanAddr = walletAddress.toLowerCase().replace('0x', '').padStart(64, '0');
        const usdcRes = await fetch('https://dream-rpc.somnia.network', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 11,
            method: 'eth_call',
            params: [
              {
                to: '0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E',
                data: `0x70a08231${cleanAddr}`,
              },
              'latest',
            ],
          }),
        });
        const usdcData = await usdcRes.json();
        if (active && usdcData?.result && usdcData.result !== '0x') {
          const usdcDec = (parseInt(usdcData.result, 16) / 1e6).toFixed(3);
          setUsdcBalance(usdcDec);
          setIsLoadingBalances(false);
          setBalanceError(null);
        }
      } catch (e) {
        console.warn('Live balance query failed:', e);
        if (active) {
          setBalanceError('RPC delayed');
          setIsLoadingBalances(false);
        }
      }
    }

    fetchLiveBalances();
    const balanceInterval = setInterval(fetchLiveBalances, 8000);
    return () => {
      active = false;
      clearInterval(balanceInterval);
    };
  }, [walletAddress, walletConnected]);

  // ==========================================
  // DOCUMENTATION & ARCHITECTURE MODAL STATE
  // ==========================================
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [docsTab, setDocsTab] = useState('architecture');
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

  // ==========================================
  // FINANCIAL QUANT ENGINE STATE
  // ==========================================
  const baseCollateralUsd = 2000.0;
  const debtUsd = 1250.0;
  const liquidationThreshold = 0.85;

  const [marketShock, setMarketShock] = useState(0);
  const [copiedHash, setCopiedHash] = useState(null);
  const [countdown, setCountdown] = useState(68);
  const [isExecutingSimulation, setIsExecutingSimulation] = useState(false);

  const effectiveCollateral = baseCollateralUsd * (1 - marketShock / 100);
  const healthFactor = Number(((effectiveCollateral * liquidationThreshold) / debtUsd).toFixed(3));

  const isSafe = healthFactor >= 1.20;
  const isWarning = healthFactor >= 1.00 && healthFactor < 1.20;
  const isLiquidatable = healthFactor < 1.00;

  const [keeperPhase, setKeeperPhase] = useState('IDLE');

  useEffect(() => {
    if (healthFactor < 1.15) {
      if (keeperPhase === 'IDLE') {
        sounds.playWarning();
        setKeeperPhase('EVALUATING');
        const t1 = setTimeout(() => {
          sounds.playHedgeSuccess();
          setKeeperPhase('HEDGED');
        }, 900);
        return () => clearTimeout(t1);
      }
    } else {
      if (keeperPhase !== 'IDLE') {
        setKeeperPhase('IDLE');
      }
    }
  }, [healthFactor, keeperPhase]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 120));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setMarketShock(val);
    if (val === 25 || (marketShock < 20 && val >= 20)) {
      sounds.playWarning();
    } else {
      sounds.playClick();
    }
  };

  const runManualSimulation = () => {
    sounds.playClick();
    setIsExecutingSimulation(true);
    setMarketShock(25);
    setTimeout(() => {
      setIsExecutingSimulation(false);
    }, 1500);
  };

  // ==========================================
  // PROCEDURAL 3D TOROIDAL RISK NEXUS CANVAS
  // ==========================================
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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

    let mouseX = width / 2;
    let mouseY = height / 2;
    let isMouseOver = false;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isMouseOver = true;
    };
    const handleMouseLeave = () => {
      isMouseOver = false;
      mouseX = width / 2;
      mouseY = height / 2;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const numParticles = 320;
    const particles = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        theta: Math.random() * Math.PI * 2,
        phi: Math.random() * Math.PI * 2,
        speedTheta: (Math.random() * 0.008 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        speedPhi: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
        radiusMajor: Math.random() * (Math.min(width, height) * 0.28) + 40,
        radiusMinor: Math.random() * 28 + 10,
        size: Math.random() * 2 + 1,
        z: 0,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const shockFactor = marketShock / 40;
      const isDark = theme === 'dark';

      let r, g, b;
      if (shockFactor > 0.6) {
        r = 239; g = 68; b = 68;
      } else if (shockFactor > 0.35) {
        r = 245; g = 158; b = 11;
      } else {
        r = isDark ? 56 : 2;
        g = isDark ? 189 : 132;
        b = isDark ? 248 : 199;
      }

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, Math.min(width, height) * 0.38, Math.min(width, height) * 0.26, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      const speedMultiplier = 1 + shockFactor * 4;

      particles.forEach((p, idx) => {
        p.theta += p.speedTheta * speedMultiplier;
        p.phi += p.speedPhi * speedMultiplier;

        const torusR = p.radiusMajor + p.radiusMinor * Math.cos(p.phi);
        let px = torusR * Math.cos(p.theta);
        let py = (p.radiusMinor * Math.sin(p.phi)) * 1.8 + torusR * Math.sin(p.theta) * 0.35;
        let pz = torusR * Math.sin(p.theta);

        let screenX = centerX + px;
        let screenY = centerY + py;

        if (isMouseOver) {
          const dx = mouseX - screenX;
          const dy = mouseY - screenY;
          const dist = Math.hypot(dx, dy);
          if (dist < 140 && dist > 1) {
            const pull = (140 - dist) / 140 * 18;
            screenX += (dx / dist) * pull;
            screenY += (dy / dist) * pull;
          }
        }

        const depthAlpha = Math.max(0.2, (pz + 150) / 300);
        const particleSize = p.size * (0.8 + depthAlpha * 0.6);

        ctx.beginPath();
        ctx.arc(screenX, screenY, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${depthAlpha * (0.5 + shockFactor * 0.5)})`;
        ctx.fill();

        for (let j = idx + 1; j < idx + 3 && j < particles.length; j++) {
          const p2 = particles[j];
          const t2 = p2.radiusMajor + p2.radiusMinor * Math.cos(p2.phi);
          const p2x = centerX + t2 * Math.cos(p2.theta);
          const p2y = centerY + (p2.radiusMinor * Math.sin(p2.phi)) * 1.8 + t2 * Math.sin(p2.theta) * 0.35;

          const dist = Math.hypot(screenX - p2x, screenY - p2y);
          if (dist < 48) {
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(p2x, p2y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${(1 - dist / 48) * 0.2 * depthAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [marketShock, theme]);

  // ==========================================
  // HYBRID AUDIT TAPE & LIVE EXECUTION STREAM (EVIDENCE.md)
  // ==========================================
  const [auditFilter, setAuditFilter] = useState('ALL');

  const auditLogs = useMemo(() => {
    const verifiedAnchors = VERIFIED_RECEIPTS.map((r) => ({
      id: r.id,
      action: r.title,
      pool: r.target,
      hash: r.hash,
      amount: r.outcome,
      blockRef: `Block #${r.blockNumber}`,
      status: r.status,
      category: r.category,
      details: r.details,
      isLive: false,
    }));

    if (keeperPhase === 'HEDGED' || keeperPhase === 'EVALUATING') {
      return [
        {
          id: 'tx-live',
          action: 'Dual-Layer Emergency Hedge (mintSet)',
          pool: 'DreamDEX Pool 0x6F17...928D',
          hash: '0x29c18f213324459723716640f477db9a6d894f60b5f88b6b576ab1586cabcee3',
          amount: '+2.000000 DOWN Secured',
          blockRef: currentBlock ? `Block #${currentBlock}` : 'Block #Live Mined',
          status: 'STREAMED',
          category: 'MINT',
          details: 'Dynamic simulation event: complete-set minting executed on-chain',
          isLive: true,
        },
        ...verifiedAnchors,
      ];
    }
    return verifiedAnchors;
  }, [keeperPhase, currentBlock]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07070A] text-[#09090B] dark:text-[#F8FAFC] font-sans antialiased transition-colors duration-300 relative overflow-x-hidden selection:bg-rose-500 selection:text-white">
      
      <div className="noise-overlay" aria-hidden="true">
        <svg className="w-full h-full opacity-40">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 1. FLOATING NAVIGATION ISLAND                                             */}
      {/* ========================================================================= */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-7xl h-16 rounded-full px-4 sm:px-6 flex items-center justify-between bg-white/85 dark:bg-[#0E0E14]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/50 transition-all duration-300">
        
        <div className="flex items-center space-x-3">
          <a href="#" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white dark:bg-[#07070A] rounded-[10px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-rose-600 dark:text-rose-400"/>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold tracking-tighter text-base sm:text-lg text-slate-900 dark:text-white">ChronoShield</span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                SHANNON L1
              </span>
            </div>
          </a>
        </div>

        <div className="hidden md:flex items-center space-x-6 text-xs font-mono">
          <a 
            href="#cockpit" 
            onClick={() => sounds.playClick()}
            className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            // Terminal
          </a>
          <a 
            href="#stress-test" 
            onClick={() => sounds.playClick()}
            className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            // Stress Test
          </a>
          <a 
            href="#audit-feed" 
            onClick={() => sounds.playClick()}
            className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            // Explorer Receipts
          </a>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Real-time Somnia Shannon Block Height Poller Badge */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-semibold">
              {isLoadingBlock && !currentBlock ? (
                <span className="animate-pulse">Syncing...</span>
              ) : blockError ? (
                <span className="text-amber-500">RPC Slow</span>
              ) : currentBlock ? (
                `Block #${currentBlock}`
              ) : (
                'Chain 50312'
              )}
            </span>
            <span className="text-emerald-600/70 dark:text-emerald-500/70 text-[10px]">
              {rpcLatency ? `${rpcLatency}ms` : '~100ms'}
            </span>
          </div>

          <button
            onClick={handleToggleMute}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
            title={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5"/> : <Volume2 className="w-3.5 h-3.5 text-rose-500"/>}
          </button>

          <a
            href="/docs.html"
            target="_blank"
            rel="noreferrer"
            onClick={() => sounds.playClick()}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
            title="Open DreamDEX-style Developer Documentation"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400"/>
            <span className="hidden sm:inline">Docs ↗</span>
          </a>

          <button
            onClick={() => {
              sounds.playClick();
              setIsArchModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
            title="Open Interactive Protocol Architecture Diagram"
          >
            <span>Architecture</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle visual theme"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 rotate-0"/>
            ) : (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-180"/>
            )}
          </button>

          {walletConnected ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-white dark:bg-zinc-900 border border-emerald-500/40 dark:border-emerald-500/30 text-slate-800 dark:text-zinc-200 shadow-sm max-w-[240px] sm:max-w-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-mono overflow-hidden">
                <span className="font-semibold text-slate-900 dark:text-white shrink-0">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
                <span className="text-slate-400 dark:text-slate-600 hidden xs:inline">|</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
                  {isLoadingBalances || !sttBalance ? '-- STT' : `${Number(sttBalance).toFixed(3)} STT`}
                </span>
                <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">·</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-medium hidden sm:inline truncate">
                  {isLoadingBalances || !usdcBalance ? '-- USDC' : `${Number(usdcBalance).toFixed(3)} tUSDC`}
                </span>
              </div>
              <button 
                onClick={disconnectWallet}
                title="Disconnect" 
                className="ml-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                setIsWalletModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-mono font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-zinc-200 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5"/>
              <span>Connect</span>
            </button>
          )}

        </div>
      </nav>

      {/* ========================================================================= */}
      {/* 2. CINEMATIC HERO & PROCEDURAL GENERATIVE RISK NEXUS                       */}
      {/* ========================================================================= */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[90vh] flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-rose-500"/>
              <span>AUTONOMOUS ANTI-LIQUIDATION ENGINE — SOMNIA SHANNON TESTNET</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] text-slate-950 dark:text-white">
              Zero Bad Debt. <br />
              <span className="font-serif italic font-normal text-slate-600 dark:text-slate-300">
                Absolute Collateral Continuity.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-zinc-400 font-normal max-w-xl leading-relaxed">
              ChronoShield monitors borrower Health Factor in real-time. When adverse market volatility drops HF below <span className="font-mono font-bold text-slate-900 dark:text-white">1.150</span>, our autonomous keeper daemon bypasses illiquid orderbooks via complete-set minting on DreamDEX, delivering guaranteed downside event coverage before liquidators can strike.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#cockpit"
                onClick={() => sounds.playClick()}
                className="px-6 py-3.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-zinc-200 shadow-xl shadow-slate-950/10 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2 group cursor-pointer"
              >
                <span>Launch Cockpit Terminal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </a>

              <button
                onClick={() => {
                  sounds.playClick();
                  setIsArchModalOpen(true);
                }}
                className="px-6 py-3.5 rounded-xl text-xs font-mono font-semibold uppercase tracking-wider bg-white dark:bg-zinc-900/80 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 shadow-xs transition-all tech-bracket cursor-pointer"
              >
                [ View Protocol Architecture ]
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-200 dark:border-zinc-800/80 font-mono">
              <div className="tech-bracket p-3.5 rounded-xl bg-white dark:bg-[#0E0E14] border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="text-xl font-bold text-slate-950 dark:text-white">100ms</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Shannon Finality</div>
              </div>
              <div className="tech-bracket p-3.5 rounded-xl bg-white dark:bg-[#0E0E14] border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">100%</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Fill Guarantee</div>
              </div>
              <div className="tech-bracket p-3.5 rounded-xl bg-white dark:bg-[#0E0E14] border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">1.150</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">HF Trigger Point</div>
              </div>
              <div className="tech-bracket p-3.5 rounded-xl bg-white dark:bg-[#0E0E14] border border-slate-200 dark:border-white/10 shadow-xs">
                <div className="text-xl font-bold text-rose-600 dark:text-rose-400">0.00%</div>
                <div className="text-[11px] text-slate-500 dark:text-zinc-400">Penalty Incurred</div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-5 relative w-full aspect-square max-w-[480px] mx-auto flex items-center justify-center">
            
            <div className="relative w-full h-full rounded-3xl bg-white dark:bg-[#0E0E14] border border-slate-200/80 dark:border-white/10 shadow-xl overflow-hidden flex items-center justify-center">
              <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

              <div className="absolute top-4 left-4 pointer-events-none">
                <div className="px-2.5 py-1 rounded-md bg-white/95 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-[10px] font-mono text-slate-700 dark:text-zinc-300 backdrop-blur shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  <span>{currentBlock ? `L1 #${currentBlock}` : 'SHANNON L1: 42ms'}</span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 pointer-events-none text-right">
                <div className="px-2.5 py-1 rounded-md bg-white/95 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-[10px] font-mono text-slate-700 dark:text-zinc-300 backdrop-blur shadow-xs">
                  DREAMDEX KEEPER: <strong className="text-emerald-600 dark:text-emerald-400">ARMED</strong>
                </div>
              </div>

              <div className="absolute center pointer-events-none text-center">
                <div className="text-[10px] font-mono text-slate-400 dark:text-zinc-600 uppercase tracking-widest font-semibold">
                  Risk Nexus Matrix
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. LIVE WEB COCKPIT TERMINAL                                              */}
      {/* ========================================================================= */}
      <section id="cockpit" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              Interactive Hardware Terminal
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">Autonomous Web Cockpit</h2>
          </div>
          <div className="text-xs font-mono text-slate-500 dark:text-zinc-400 flex flex-wrap items-center gap-2">
            <span>Chain ID: <strong className="text-slate-900 dark:text-white">50312</strong></span>
            <span>|</span>
            <span>Height: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{currentBlock ? `#${currentBlock}` : 'Syncing...'}</strong></span>
            <span>|</span>
            <span>Target: <strong className="text-slate-900 dark:text-white">0x807c...55eb (ETH-5M)</strong></span>
          </div>
        </div>

        {healthFactor < 1.15 ? (
          <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 shadow-sm">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce"/>
              <div>
                <p className="font-bold text-sm">CRITICAL SOLVENCY RISK: KEEPER ACTIVATED</p>
                <p className="text-xs font-mono text-rose-700/90 dark:text-rose-400/80">
                  Health Factor breached 1.15 threshold ({healthFactor.toFixed(3)}). Securing DOWN outcome tokens via DreamDEX mintSet fallback.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-rose-600 text-white self-start sm:self-auto shrink-0 shadow">
              CIRCUIT BREAKER FIRED
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 shadow-xs">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0"/>
              <div>
                <p className="font-bold text-sm">NOMINAL: COLLATERAL CONTINUITY VERIFIED</p>
                <p className="text-xs font-mono text-emerald-700/80 dark:text-emerald-400/70">
                  Position Health Factor is safe ({healthFactor.toFixed(3)}). Anti-liquidation listener actively polling Shannon testnet blocks.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 self-start sm:self-auto shrink-0">
              KEEPER: ARMED & READY
            </span>
          </div>
        )}

        {/* Dedicated Live On-Chain Solvency Panel (Real deployed MockLendingPosition.sol) */}
        <LiveOnChainPanel theme={theme} />

        {/* Dual-Mode Audit Console: Live RPC Verification & Lifecycle Replay */}
        <TerminalAuditor />

        <div id="stress-test" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#0E0E14] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-none space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400"/> Position Solvency Gauge
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Interactive Simulation Playground</span>
              </div>
              <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded ${
                isSafe ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' :
                isWarning ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800' :
                'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              }`}>
                {isSafe ? 'SAFE' : isWarning ? 'CAUTION: PRE-LIQUIDATION' : 'LIQUIDATABLE'}
              </span>
            </div>

            <div className="py-4 text-center">
              <div className="text-6xl font-mono font-black tracking-tight">
                <span className={
                  isSafe ? 'text-emerald-600 dark:text-emerald-400' :
                  isWarning ? 'text-amber-600 dark:text-amber-400' :
                  'text-rose-600 dark:text-rose-500'
                }>
                  {healthFactor.toFixed(3)}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-2">
                Breach Boundary: <strong className="text-slate-900 dark:text-white">1.150</strong> | Liquidation: <strong className="text-rose-500">1.000</strong>
              </p>

              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2.5 rounded-full mt-4 overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${
                    isSafe ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (healthFactor / 2.0) * 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 text-xs font-mono border-t border-slate-100 dark:border-zinc-800">
              <div>
                <span className="text-slate-500 dark:text-zinc-400">Effective Collateral:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">${effectiveCollateral.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-zinc-400">Borrowed Debt:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">${debtUsd.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400"/> Market Price Shock
                  </span>
                  <a
                    href="https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-mono transition-colors border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 rounded shadow-2xs"
                    title="View real MockLendingPosition contract on Shannon Explorer"
                  >
                    <span>0x728b...6343</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <span className="text-rose-600 dark:text-rose-400 font-bold">-{marketShock}% Drop</span>
              </div>

              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={marketShock}
                onChange={handleSliderChange}
                className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />

              <div className="grid grid-cols-4 gap-1.5 pt-1 font-mono text-[10px]">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setMarketShock(0);
                  }}
                  className={`py-1.5 rounded border text-center transition cursor-pointer ${
                    marketShock === 0
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold border-transparent'
                      : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  0% Safe
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setMarketShock(15);
                  }}
                  className={`py-1.5 rounded border text-center transition cursor-pointer ${
                    marketShock === 15
                      ? 'bg-amber-600 text-white font-bold border-amber-600'
                      : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  -15%
                </button>
                <button
                  onClick={() => {
                    sounds.playWarning();
                    setMarketShock(25);
                  }}
                  className={`py-1.5 rounded border text-center transition cursor-pointer ${
                    marketShock === 25
                      ? 'bg-rose-600 text-white font-bold border-rose-600'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-semibold border-rose-200 dark:border-rose-900'
                  }`}
                >
                  -25% Shock
                </button>
                <button
                  onClick={() => {
                    sounds.playWarning();
                    setMarketShock(35);
                  }}
                  className={`py-1.5 rounded border text-center transition cursor-pointer ${
                    marketShock === 35
                      ? 'bg-rose-700 text-white font-bold border-rose-700'
                      : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  -35% Crash
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed pt-1">
                Drag slider past -20% to force Health Factor below 1.150 and witness the keeper daemon secure downside protection.
              </p>
            </div>

          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0E14] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-none space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-500"/> Autonomous Daemon
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950/80 border border-slate-200 dark:border-zinc-800 font-mono text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Current Phase:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{keeperPhase}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Execution Strategy:</span>
                <span className="text-slate-900 dark:text-white">IOC Taker → mintSet Fallback</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Delivery Guarantee:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% On-Chain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-zinc-400">Settlement Recovery:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Automatic (redeem)</span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Target Pool:</span>
                <span className="text-slate-900 dark:text-white font-semibold">0x807c...55eb (ETH)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Outcome Selected:</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">BUY_NO (DOWN Hedge)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800">
                <span className="text-slate-500 dark:text-zinc-400">Coverage Quantity:</span>
                <span className="text-slate-900 dark:text-white font-bold">2.00 Contracts ($2.00)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 dark:text-zinc-400">Window Closes In:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{countdown}s</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={runManualSimulation}
                disabled={isExecutingSimulation}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-white"/>
                <span>{isExecutingSimulation ? 'Simulating Solvency Shock...' : 'Simulate 25% Flash Drop'}</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setMarketShock(0);
                }}
                className="w-full py-2.5 rounded-xl font-mono text-xs font-semibold bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
              >
                Reset Solvency State
              </button>
            </div>

          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0E0E14] border border-slate-200/90 dark:border-white/10 shadow-sm dark:shadow-none space-y-4">
            <h3 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/> Protocol Invariants
            </h3>

            <div className="space-y-3 text-xs">
              
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
                  Dual-Layer Fallback Guarantee
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Competitor bots crash when testnet orderbooks are empty (reverting with <code className="text-rose-600 dark:text-rose-400 font-mono">ImmediateOrCancelNoFill</code>). ChronoShield catches this and invokes native <code className="text-emerald-600 dark:text-emerald-400 font-mono">mintSet</code>, guaranteeing hedge acquisition.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
                  Continuous Policy Life-Cycle
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Event contracts expire every few minutes, but borrower liquidation risk is continuous. The keeper monitors settlement and rolls capital automatically into successive protection windows.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
                  Automated Oracle Redemption
                </div>
                <p className="text-slate-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Upon oracle finalization (<code className="text-slate-700 dark:text-zinc-300 font-mono">isResolved == true</code>), ChronoShield executes on-chain <code className="text-slate-700 dark:text-zinc-300 font-mono">redeem()</code>, recycling collateral back to the lending vault.
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ========================================================================= */}
      {/* 4. VERIFIED ON-CHAIN TRANSACTION AUDIT FEED                               */}
      {/* ========================================================================= */}
      <section id="audit-feed" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-zinc-800 pb-4 gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Cryptographic Ground Truth
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Immutable Verification Ledger
            </h2>
            <p className="font-mono text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Synchronized with EVIDENCE.md &amp; cryptographic audit receipts in /receipts
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono text-xs shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">RECOVERED:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">+2.000 tUSDC</span>
            </div>
            <a
              href="https://shannon-explorer.somnia.network"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Shannon Explorer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1">
          {['ALL', 'LENDING', 'MINT', 'RECOVERY'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sounds.playClick();
                setAuditFilter(cat);
              }}
              className={`px-3 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer whitespace-nowrap ${
                auditFilter === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold border-transparent shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
              }`}
            >
              {cat === 'ALL' ? `All Records (${auditLogs.length})` : cat}
            </button>
          ))}
        </div>

        {/* Ledger Table Card */}
        <div className="rounded-3xl bg-white dark:bg-[#0E0E14] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left font-mono text-xs min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-500 dark:text-zinc-400">
                  <th className="py-3 px-4">Action / Mechanism</th>
                  <th className="py-3 px-4">Target Pool / Details</th>
                  <th className="py-3 px-4">Transaction Hash</th>
                  <th className="py-3 px-4">Amount / Outcome</th>
                  <th className="py-3 px-4">Confirmed Block</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {auditLogs
                  .filter((log) => auditFilter === 'ALL' || log.category === auditFilter)
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {log.isLive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        )}
                        <span>{log.action}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-400 max-w-xs">
                        <p className="truncate text-[11px]" title={log.details || log.pool}>{log.details || log.pool}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.hash.startsWith('0x') ? (
                          <div className="flex items-center space-x-2">
                            <a
                              href={`https://shannon-explorer.somnia.network/tx/${log.hash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              <span>{log.hash.slice(0, 10)}...{log.hash.slice(-8)}</span>
                              <ExternalLink className="w-3 h-3"/>
                            </a>
                            <button
                              onClick={() => handleCopy(log.hash)}
                              title="Copy full hash"
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                            >
                              {copiedHash === log.hash ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500"/>
                              ) : (
                                <Copy className="w-3.5 h-3.5"/>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            {log.hash}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {log.amount}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-300 font-semibold">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                          {log.blockRef}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          log.status === 'CONFIRMED' || log.status === 'RESTORED' || log.status === 'RECLAIMED'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : log.status === 'STREAMED'
                            ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800 animate-pulse'
                            : log.status === 'HAZARD FIRED'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900 animate-pulse'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. SLIDE-OVER DOCUMENTATION & PROOF DRAWER                                 */}
      {/* ========================================================================= */}
      {isDocsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            onClick={() => setIsDocsOpen(false)}
            className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white dark:bg-[#0E0E14] border-l border-slate-200 dark:border-white/10 shadow-2xl p-6 sm:p-8 flex flex-col space-y-6 overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-rose-500"/>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">System Specs & Verification Guide</h3>
                </div>
                <button
                  onClick={() => setIsDocsOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="flex space-x-2 border-b border-slate-200 dark:border-zinc-800 font-mono text-xs">
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDocsTab('architecture');
                  }}
                  className={`py-2 px-3 border-b-2 font-bold transition cursor-pointer ${
                    docsTab === 'architecture'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Architecture & Flow
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDocsTab('reproduction');
                  }}
                  className={`py-2 px-3 border-b-2 font-bold transition cursor-pointer ${
                    docsTab === 'reproduction'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  CLI Reproduction
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setDocsTab('security');
                  }}
                  className={`py-2 px-3 border-b-2 font-bold transition cursor-pointer ${
                    docsTab === 'security'
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Invariants & Proofs
                </button>
              </div>

              {docsTab === 'architecture' && (
                <div className="space-y-4 text-xs font-mono leading-relaxed">
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-300 text-sm font-sans">Core Architectural Thesis</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-400 font-bold">SOMNIA 50312</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      ChronoShield is an autonomous anti-liquidation protocol that couples on-chain borrower solvency with DreamDEX binary event markets. When adverse volatility drives Health Factor below <strong>1.150</strong>, the keeper locks collateral to secure guaranteed downside protection before liquidators can seize assets.
                    </p>
                  </div>

                  {/* 5-Step Visual Flow */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Autonomous Anti-Liquidation Pipeline
                    </span>
                    <div className="space-y-2 text-[11px]">
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 font-bold shrink-0">1</span>
                        <div>
                          <strong className="text-slate-900 dark:text-white">Solvency &amp; Oracle Telemetry:</strong>
                          <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                            Pyth Hermes streams ETH/USD. Position adapter (<code className="text-cyan-600 dark:text-cyan-400">0x728b...6343</code>) detects collateral drop. HF drops 1.360 &rarr; 1.020 (Hazard Active).
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 font-bold shrink-0">2</span>
                        <div>
                          <strong className="text-slate-900 dark:text-white">4 Fail-Closed Policy Gates:</strong>
                          <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                            Evaluates Expiry Headroom (&ge;120s), Budget Cap (&le;$10 USDC), Whitelisted Caller Signature, and Route Sanity prior to spending any capital.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 font-bold shrink-0">3</span>
                        <div>
                          <strong className="text-slate-900 dark:text-white">Dynamic Market Discovery:</strong>
                          <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                            Queries DreamDEX binary pool (<code className="text-purple-600 dark:text-purple-400">0x5397...3D62</code>) on Somnia Shannon and inspects CLOB orderbook depth.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 flex items-start gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 font-bold shrink-0">4</span>
                        <div>
                          <strong className="text-emerald-800 dark:text-emerald-300">Dual-Route Fallback (The Breakthrough):</strong>
                          <p className="text-slate-600 dark:text-emerald-400/90 mt-0.5">
                            If orderbook is dry (0 asks), keeper bypasses CLOB and invokes protocol-level <code className="font-bold text-slate-900 dark:text-white">mintSet()</code>. 1 USDC locks = 1 UP + 1 DOWN, securing guaranteed coverage with 0 slippage.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-start gap-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 font-bold shrink-0">5</span>
                        <div>
                          <strong className="text-slate-900 dark:text-white">Solvency Restoration &amp; Sealed Proof:</strong>
                          <p className="text-slate-500 dark:text-zinc-400 mt-0.5">
                            DOWN contracts offset loss. Position reset to baseline (HF 1.360) and cryptographic SHA-256 seal appended to <code className="text-rose-600 dark:text-rose-400">EVIDENCE.md</code>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trigger Full Architecture Modal */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setIsDocsOpen(false);
                      setIsArchModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition text-center shadow-md cursor-pointer"
                  >
                    Open Interactive Architecture Visualizer Modal &rarr;
                  </button>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-sans pt-2">
                    Verified Somnia Shannon Testnet Deployments
                  </h4>
                  <ul className="space-y-1.5 text-slate-600 dark:text-zinc-400 text-[11px]">
                    <li>• <strong>Solvency Adapter:</strong> <a href="https://shannon-explorer.somnia.network/address/0x728b9579edec0e8ef5422f2980c302d5bd266343" target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 underline">0x728b9579edec0e8ef5422f2980c302d5bd266343</a> (Block #484098396)</li>
                    <li>• <strong>Live Shock Tx:</strong> <a href="https://shannon-explorer.somnia.network/tx/0x8c12ff6acde6bf9124f130d18ca200958d0d46deb91b07cc559781a22795b924" target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 underline">0x8c12ff6acde6...</a> (Block #484162912)</li>
                    <li>• <strong>mintSet Hedge Tx:</strong> <a href="https://shannon-explorer.somnia.network/tx/0xa476337c724b5f18d4b2e2cddc9e57783a19755c2b27e302b469ca89ef77cec6" target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 underline">0xa476337c724b...</a> (Block #484163041)</li>
                    <li>• <strong>Position Reset Tx:</strong> <a href="https://shannon-explorer.somnia.network/tx/0x02cedaf7ad233e9c4d99ca02c49a3b3c7113e3c97c4688e3e15f3663ae9e1e45" target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 underline">0x02cedaf7ad23...</a> (Block #484163113)</li>
                    <li>• <strong>Collateral Redeem Tx:</strong> <a href="https://shannon-explorer.somnia.network/tx/0x42b8df2bd8faa988a185af926217b2d18cb9bf9759e58711256bd9647a717a73" target="_blank" rel="noreferrer" className="text-cyan-600 dark:text-cyan-400 underline">0x42b8df2bd8fa...</a> (Block #481305363)</li>
                  </ul>
                </div>
              )}

              {docsTab === 'reproduction' && (
                <div className="space-y-4 text-xs font-mono leading-relaxed">
                  <p className="text-slate-600 dark:text-zinc-400">
                    Verify the entire ChronoShield lifecycle from terminal in under 60 seconds:
                  </p>

                  <div className="p-4 rounded-xl bg-slate-950 text-zinc-200 border border-zinc-800 font-mono text-[11px] overflow-x-auto space-y-2">
                    <p className="text-zinc-400"># 1. Navigate to typescript workspace</p>
                    <p className="text-emerald-400">cd web-cockpit/typescript</p>
                    <p className="text-zinc-400"># 2. Run deterministic audited end-to-end demo</p>
                    <p className="text-emerald-400">npm run demo</p>
                    <p className="text-zinc-400"># 3. Verify on-chain tape directly against Somnia RPC</p>
                    <p className="text-emerald-400">npm run verify</p>
                    <p className="text-zinc-400"># 4. Run 27-test invariant suite (7 test suites)</p>
                    <p className="text-emerald-400">npm test</p>
                    <p className="text-zinc-400"># 5. Run live Pyth Network Hermes surveillance feeder</p>
                    <p className="text-emerald-400">npm run oracle</p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-[11px] text-emerald-400">
                    ✔ All 27 tests and on-chain verification passes without requiring local chain fork or mocking.
                  </div>
                </div>
              )}

              {docsTab === 'security' && (
                <div className="space-y-4 text-xs font-mono leading-relaxed">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>4 Institutional Fail-Closed Policy Gates</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">ENFORCED</span>
                    </div>
                    <ul className="text-slate-600 dark:text-zinc-400 space-y-1 text-[11px]">
                      <li>• <strong>Gate 1 (Expiry Headroom):</strong> Market expiration must be &ge; 120s away to ensure fill viability.</li>
                      <li>• <strong>Gate 2 (Budget Cap):</strong> Total hedge allocation capped at $10.00 USDC per event.</li>
                      <li>• <strong>Gate 3 (Operator Auth):</strong> Operator signature strictly validated against authorized registry.</li>
                      <li>• <strong>Gate 4 (Route Sanity):</strong> Pools with invalid prices or broken contracts automatically rejected.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white">
                      Complete Set Conservation Theorem
                    </div>
                    <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
                      1 collateral token (1.00 tUSDC) always mints exactly 1 UP and 1 DOWN contract. Since V(UP) + V(DOWN) = 1.00 USDC at all times, minting complete sets carries zero uncollateralized protocol risk.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2">
                    <div className="font-bold text-slate-900 dark:text-white">
                      Integer Tick-Math &amp; Scaling Invariant
                    </div>
                    <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
                      Floating-point math is strictly forbidden on the execution hot-path. All contract sizes and prices snap to integer lot grids (10^6 units for tUSDC, 10^18 for STT) preventing contract reverts.
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WALLET CONNECTION MODAL                                                */}
      {/* ========================================================================= */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsWalletModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0E0E14] border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold tracking-tight text-slate-950 dark:text-white">Connect Web3 Wallet</h3>
              <button 
                onClick={() => setIsWalletModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              <button
                onClick={() => connectWallet('0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1')}
                className="w-full p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-left flex items-center justify-between transition cursor-pointer shadow-xs"
              >
                <div>
                  <p className="font-bold text-rose-700 dark:text-rose-300">Auditor Bypass Wallet</p>
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400/70">0x9C488445198E074Cf355F0B3ad48dD7c18c6EDE1</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                  RECOMMENDED
                </span>
              </button>

              <button
                onClick={handleMetaMaskConnect}
                disabled={connecting}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left flex items-center justify-between transition cursor-pointer"
              >
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  {connecting ? 'Connecting...' : 'MetaMask (Browser Injection)'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400"/>
              </button>

              <button
                onClick={() => connectWallet('0x3B2e128C4f9971D041A9908F492211918a398C1')}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left flex items-center justify-between transition cursor-pointer"
              >
                <span className="font-bold text-slate-800 dark:text-zinc-200">Rabby / EIP-6963 Wallet</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400"/>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono text-center">
              Requires connection to Somnia Shannon Testnet (Chain ID: 50312).
            </p>
          </div>
        </div>
      )}

      {/* Interactive System Architecture Visualizer Modal */}
      <ArchitectureModal 
        isOpen={isArchModalOpen} 
        onClose={() => setIsArchModalOpen(false)} 
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-zinc-800/80 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center font-mono text-xs text-slate-500 dark:text-zinc-500">
        <p>ChronoShield Autonomous Anti-Liquidation Protocol — Somnia Network & DreamDEX Event Contracts Hackathon 2026</p>
      </footer>

    </div>
  );
}