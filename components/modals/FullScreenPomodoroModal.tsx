import React, { useState } from 'react';
import type { PomodoroSession } from '../../types';
import { POMODORO_THEMES } from '../../constants';

interface FullScreenPomodoroModalProps {
    duration: number;
    secondsLeft: number;
    isRunning: boolean;
    setIsRunning: (r: boolean) => void;
    reset: () => void;
    session: PomodoroSession;
    onClose: () => void;
}

const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${m}:${secs}`;
};

const FullScreenPomodoroModal: React.FC<FullScreenPomodoroModalProps> = ({
    secondsLeft,
    isRunning,
    setIsRunning,
    reset,
    session,
    onClose
}) => {
    const [theme, setTheme] = useState(POMODORO_THEMES[0]);
    const [view, setView] = useState<'time' | 'scenery'>('scenery');

    const handleReset = () => {
        reset();
    };

    return (
        <div 
            className={`fixed inset-0 z-[60] flex flex-col items-center justify-center text-white transition-all duration-500 ${theme.class}`}
            style={{ background: theme.background }}
        >
            {/* Main Content */}
            <div className={`
                flex flex-col items-center justify-center transition-opacity duration-700
                ${view === 'time' ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
            `}>
                <h1 className="text-9xl md:text-[12rem] font-bold tracking-widest" style={{ textShadow: '0 0 30px rgba(0,0,0,0.4)' }}>
                    {formatTime(secondsLeft)}
                </h1>
            </div>

            {/* UI Controls Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Top Controls */}
                <div className="flex justify-between items-center">
                    <div className="font-bold text-lg">PulseStudy Focus</div>
                    <button onClick={onClose} className="p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors" aria-label="Exit full screen">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                {/* Bottom Controls */}
                <div className="flex flex-col items-center">
                    {/* Session Progress */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        {Array.from({ length: session.total }).map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 border-2 border-white/50 ${i < session.completed ? 'bg-white' : 'bg-transparent'}`}></div>
                        ))}
                    </div>

                    {/* Main Action Buttons */}
                     <div className="flex gap-4 items-center mb-6">
                        <button onClick={handleReset} className="px-5 py-3 text-sm font-semibold rounded-full bg-black/20 hover:bg-black/40 transition-colors" aria-label="Reset timer">Reset</button>
                        <button onClick={() => setIsRunning(!isRunning)} className="px-10 py-5 text-xl font-bold rounded-full bg-white text-black transition-transform hover:scale-105" aria-label={isRunning ? 'Pause timer' : 'Start timer'}>
                            {isRunning ? 'PAUSE' : 'START'}
                        </button>
                        <div className="w-[84px]"></div>
                    </div>

                    {/* View and Theme Controls */}
                    <div className="flex items-center justify-between w-full max-w-sm text-sm">
                        {/* Theme Picker */}
                        <div className="flex items-center gap-2">
                           <span className="font-medium">Theme:</span>
                           <div className="flex gap-2 p-1 rounded-full bg-black/20">
                               {POMODORO_THEMES.map(t => (
                                   <button 
                                        key={t.id} 
                                        onClick={() => setTheme(t)}
                                        className={`w-6 h-6 rounded-full transition-all border-2 ${theme.id === t.id ? 'border-white' : 'border-transparent'}`}
                                        style={{ background: t.background }}
                                        aria-label={`Select ${t.name} theme`}
                                    />
                               ))}
                           </div>
                        </div>

                        {/* View Switcher */}
                         <div className="flex items-center gap-2 p-1 rounded-full bg-black/20">
                            <button onClick={() => setView('scenery')} className={`px-3 py-1 rounded-full transition-colors ${view === 'scenery' ? 'bg-white/30' : ''}`} aria-label="Scenery view">Scenery</button>
                            <button onClick={() => setView('time')} className={`px-3 py-1 rounded-full transition-colors ${view === 'time' ? 'bg-white/30' : ''}`} aria-label="Time view">Time</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullScreenPomodoroModal;