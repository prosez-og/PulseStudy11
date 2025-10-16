import React from 'react';
import type { Rank, PomodoroSession } from '../types';
import { ranks } from '../constants';
import RankBadge from './RankBadge';

interface DashboardProps {
  taskCount: number;
  noteCount: number;
  focusTime: number;
  xp: number;
  rank: Rank;
  onOpenModal: (type: 'ranks' | 'stats' | 'aiRatingInfo') => void;
  aiRating: number;
  pomodoro: {
    duration: number;
    setDuration: (d: number) => void;
    secondsLeft: number;
    isRunning: boolean;
    setIsRunning: (r: boolean) => void;
    reset: () => void;
    session: PomodoroSession;
    setSession: React.Dispatch<React.SetStateAction<PomodoroSession>>;
    openFullScreen: () => void;
  }
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-4 rounded-xl bg-black/5 border border-black/10 dark:bg-white/5 dark:border-white/10">
    <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
    <div className="text-lg font-bold text-slate-800 dark:text-white">{value}</div>
  </div>
);

const AIRatingCard: React.FC<{ rating: number, onClick: () => void }> = ({ rating, onClick }) => (
    <button onClick={onClick} className="p-4 rounded-xl text-left w-full bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-400/30 relative overflow-hidden transition-colors hover:border-violet-400/60">
        <div className="flex items-center justify-between">
            <div className="text-xs text-violet-500 dark:text-violet-300">AI Rating</div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400 dark:text-yellow-300" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        </div>
        <div className="text-lg font-bold text-slate-800 dark:text-white">{rating > 0 ? rating.toLocaleString() : '...'}</div>
    </button>
);

const formatDate = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

const PomodoroTimer: React.FC<DashboardProps['pomodoro']> = ({ duration, setDuration, secondsLeft, isRunning, setIsRunning, reset, session, setSession, openFullScreen }) => {
    
    const handleReset = () => {
        reset();
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDuration = parseInt(e.target.value, 10);
        if (newDuration > 0 && newDuration <= 120) {
            setDuration(newDuration);
        }
    };
    
    const handleGoalChange = (amount: number) => {
        setSession(s => ({ ...s, total: Math.max(1, s.total + amount) }));
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const secs = (s % 60).toString().padStart(2, '0');
        return `${m}:${secs}`;
    };

    return (
        <aside className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col items-center justify-between transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10">
            <div>
                <div className="flex items-center justify-between w-full">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Pomodoro</div>
                     <button onClick={openFullScreen} className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors" aria-label="Open full-screen timer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" /></svg>
                    </button>
                </div>
                 <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
                    <input 
                        id="customPomodoro" 
                        type="number" 
                        value={duration}
                        onChange={handleDurationChange}
                        className="w-16 text-slate-800 dark:text-slate-100 p-1 rounded-md bg-black/10 dark:bg-white/10 text-center focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    /> 
                    <span>minutes</span>
                </div>
                <div className="text-5xl font-bold my-4 text-slate-900 dark:text-white">{formatTime(secondsLeft)}</div>
            </div>

            <div className="w-full">
                <div className="flex items-center justify-center gap-2 mb-4">
                    {Array.from({ length: session.total }).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-all duration-300 ${i < session.completed ? 'bg-cyan-400' : 'bg-black/20 dark:bg-white/20'}`}></div>
                    ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span>Today's Goal</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleGoalChange(-1)} className="w-5 h-5 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20">-</button>
                        <span>{session.total} sessions</span>
                        <button onClick={() => handleGoalChange(1)} className="w-5 h-5 rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20">+</button>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setIsRunning(!isRunning)} className="w-full px-4 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 text-white dark:text-slate-900 font-semibold transition-transform hover:scale-105">
                        {isRunning ? 'Pause' : 'Start'}
                    </button>
                    <button onClick={handleReset} className="px-4 py-2 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors">Reset</button>
                </div>
            </div>
        </aside>
    );
};


export default function Dashboard({ taskCount, noteCount, focusTime, xp, rank, onOpenModal, aiRating, pomodoro }: DashboardProps) {
  const currentRankIndex = ranks.findIndex(r => r.name === rank.name);
  const nextRank = currentRankIndex !== -1 && currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;

  let xpPercentage = 0;
  let xpDisplay = `${xp.toLocaleString()}`;

  if (nextRank) {
      const rankXpRange = nextRank.min - rank.min;
      const xpInCurrentRank = xp - rank.min;
      xpPercentage = Math.max(0, Math.min((xpInCurrentRank / rankXpRange) * 100, 100));
      xpDisplay = `${xp.toLocaleString()} / ${nextRank.min.toLocaleString()}`;
  } else {
      // Last rank, bar is full
      xpPercentage = 100;
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r dark:from-slate-200 dark:to-slate-400">Hey, ready to slay today?</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your hub for notes, tasks & focused sprints.</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-slate-500 dark:text-slate-400">Today</div>
            <div className="font-semibold text-slate-800 dark:text-white">{formatDate(new Date())}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <StatCard label="Tasks" value={taskCount} />
          <AIRatingCard rating={aiRating} onClick={() => onOpenModal('aiRatingInfo')} />
          <StatCard label="Notes" value={noteCount} />
          <StatCard label="Focus Time" value={`${focusTime}m`} />
        </div>

        <button 
            onClick={() => onOpenModal('ranks')}
            className="w-full mt-6 p-4 rounded-xl bg-black/5 border border-black/10 dark:bg-white/5 dark:border-white/10 flex items-center gap-4 text-left transition-colors hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label="View rank progression"
        >
            <RankBadge rank={rank} />
            <div className="flex-1">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex justify-between">
                    <span>XP: {xpDisplay}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">Rank: {rank.name}</span>
                </div>
                <div className="w-full h-2.5 bg-black/20 dark:bg-black/30 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${xpPercentage}%` }}
                    ></div>
                </div>
            </div>
        </button>
      </div>

      <PomodoroTimer {...pomodoro} />
    </section>
  );
};