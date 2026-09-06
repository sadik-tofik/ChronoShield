import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { sounds } from '../utils/audio';

export default function ThemeToggle({ theme, onToggleTheme }) {
  const isDark = theme === 'dark';

  const handleClick = () => {
    sounds.playClick();
    onToggleTheme();
  };

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 cursor-pointer ${
        isDark
          ? 'bg-zinc-900 hover:bg-zinc-800 text-amber-300 border-zinc-700/80 shadow-sm'
          : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-200 shadow-sm shadow-zinc-200/60'
      }`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle visual theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-cyan-300 transition-transform duration-300 rotate-0" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-300 rotate-0" />
        )}
      </div>
      <span className="font-semibold text-[11px] hidden sm:inline">
        {isDark ? 'DARK' : 'LIGHT'}
      </span>
    </button>
  );
}
