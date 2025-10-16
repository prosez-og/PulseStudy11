import React, { useState, useRef, useEffect } from 'react';
import type { Theme } from '../types';

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeToggle: React.FC<{ theme: Theme, setTheme: (theme: Theme) => void }> = ({ theme, setTheme }) => (
    <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Theme</span>
        <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-700 p-1 rounded-full">
            <button 
                onClick={() => setTheme('light')} 
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${theme === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
            >
                Light
            </button>
            <button 
                onClick={() => setTheme('dark')} 
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
            >
                Dark
            </button>
        </div>
    </div>
);


const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
            setSettingsOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full fixed top-4 left-0 z-40 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/80 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">PulseStudy</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 -mt-0.5">Ultimate Student Dashboard</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <nav className="hidden md:flex items-center gap-2">
            <a href="#tools" className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200">Tools</a>
          </nav>
          <div className="relative" ref={settingsRef}>
            <button onClick={() => setSettingsOpen(o => !o)} className="p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors" aria-label="Open settings">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-1.57 1.996A1.532 1.532 0 013 8.22v3.56c0 .85.69 1.53 1.53 1.53.62 0 1.157.342 1.41.865.253.523.82.934 1.41.934.59 0 1.157-.411 1.41-.934a1.532 1.532 0 011.41-.865c.84 0 1.53-.68 1.53-1.53V8.22c0-.85-.69-1.53-1.53-1.53a1.532 1.532 0 01-1.41-.865c-.253-.523-.82-.934-1.41-.934a1.532 1.532 0 01-1.41.865c-.62 0-1.157-.342-1.41-.865a1.532 1.532 0 01-2.286-.948zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            </button>
            {isSettingsOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-white dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-lg shadow-xl z-20 p-4 animate-fade-in-up origin-top-right">
                   <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Settings</h4>
                        <ThemeToggle theme={theme} setTheme={setTheme} />
                   </div>
                </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;