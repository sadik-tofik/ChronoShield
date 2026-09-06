import React, { useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Trash2 } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function TerminalLogs({ logs = [], onClearLogs, theme = 'light' }) {
  const containerRef = useRef(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={`rounded-2xl border p-5 flex flex-col font-mono text-xs overflow-hidden transition-colors duration-200 ${
      isDark
        ? 'bg-[#0D0D14] border-white/[0.08]'
        : 'bg-[#0F172A] border-slate-300 shadow-sm shadow-slate-300/50'
    }`}>
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/90" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/90" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/90" />
          </div>
          <span className="text-[11px] text-slate-400 font-semibold ml-1">
            keeper-daemon.shannon.log (stdout)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            PID: 4912 // Somnia Shannon Engine
          </span>
          <button
            onClick={() => {
              sounds.playClick();
              onClearLogs();
            }}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Clear terminal stream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output Stream */}
      <div
        ref={containerRef}
        className="h-44 sm:h-52 overflow-y-auto space-y-1.5 pr-2 font-mono text-[11px] leading-relaxed select-text"
      >
        {logs.map((log, index) => {
          let lineClass = 'text-slate-300';
          if (log.type === 'alert') lineClass = 'text-amber-400 font-semibold';
          if (log.type === 'danger') lineClass = 'text-rose-400 font-bold';
          if (log.type === 'success') lineClass = 'text-emerald-400 font-semibold';
          if (log.type === 'cyan') lineClass = 'text-cyan-300 font-medium';

          return (
            <div key={index} className="flex items-start gap-2">
              <span className="text-slate-500 select-none">{log.time}</span>
              <span className="text-slate-600 select-none">&gt;</span>
              <span className={`break-all ${lineClass}`}>{log.message}</span>
            </div>
          );
        })}
        {/* Blinking cursor */}
        <div className="flex items-center gap-1 text-cyan-400 pt-1">
          <span className="text-slate-600 select-none">&gt;</span>
          <span className="w-2 h-3.5 bg-cyan-400 animate-pulse-subtle" />
        </div>
      </div>
    </div>
  );
}
