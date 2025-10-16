import React, { useState, useMemo, useCallback } from 'react';
import type { FocusSessionHistory, WeeklyPlan } from '../../types';
import { generateStudyPlan } from '../../services/geminiService';

interface StatsModalProps {
  onClose: () => void;
  userName: string;
  focusSessionHistory: FocusSessionHistory[];
}

const StudyTimelineChart: React.FC<{ history: FocusSessionHistory[] }> = ({ history }) => {
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();
  }, []);

  const getSessionsForDay = useCallback((day: Date) => {
    const dayString = day.toISOString().split('T')[0];
    return history.filter(s => s.date === dayString);
  }, [history]);

  return (
    <div className="space-y-4">
      {last7Days.map(day => {
        const sessions = getSessionsForDay(day);
        const totalMinutes = sessions.reduce((acc, s) => acc + (s.endTime - s.startTime) / 60000, 0);
        return (
          <div key={day.toISOString()} className="flex items-center gap-2 sm:gap-4">
            <div className="w-16 sm:w-24 text-right flex-shrink-0">
              <div className="font-semibold text-sm text-slate-700 dark:text-slate-200">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
            </div>
            <div className="flex-1 h-8 bg-black/5 dark:bg-white/10 rounded-md relative">
              {sessions.map(session => {
                const sessionStart = new Date(session.startTime);
                const startMinutes = sessionStart.getHours() * 60 + sessionStart.getMinutes();
                const durationMinutes = (session.endTime - session.startTime) / 60000;
                const left = (startMinutes / (24 * 60)) * 100;
                const width = (durationMinutes / (24 * 60)) * 100;
                return (
                  <div
                    key={session.startTime}
                    className="absolute h-full bg-gradient-to-r from-cyan-500 to-violet-500 rounded opacity-80"
                    style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
                    title={`Studied for ${Math.round(durationMinutes)} min starting at ${sessionStart.toLocaleTimeString()}`}
                  ></div>
                );
              })}
            </div>
            <div className="w-14 sm:w-20 text-left text-sm font-medium text-slate-600 dark:text-slate-300">{Math.round(totalMinutes)} min</div>
          </div>
        );
      })}
    </div>
  );
};

type PlannerStage = 'idle' | 'askingTimezone' | 'askingAvailability' | 'askingGoals' | 'askingCurrentDay' | 'generating' | 'showingPlan' | 'error';
type PlannerMessage = { from: 'ai' | 'user'; text: string; };

const AIPlanner: React.FC<{ history: FocusSessionHistory[] }> = ({ history }) => {
    const [stage, setStage] = useState<PlannerStage>('idle');
    const [timezone, setTimezone] = useState('');
    const [availability, setAvailability] = useState('');
    const [goals, setGoals] = useState('');
    const [currentDay, setCurrentDay] = useState('');
    const [plan, setPlan] = useState<WeeklyPlan | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [userInput, setUserInput] = useState('');

    const plannerMessages = useMemo<PlannerMessage[]>(() => {
        const messages: PlannerMessage[] = [];
        if (stage !== 'idle') {
            messages.push({ from: 'ai', text: "Hello! To create a personalized study schedule, I need a little more information." });
            messages.push({ from: 'ai', text: "First, what is your current timezone? (e.g., PDT, EST, GMT+5)" });
        }
        if (timezone) {
            messages.push({ from: 'user', text: timezone });
            messages.push({ from: 'ai', text: "Great! Now, tell me when you are generally free to study. (e.g., 'Weekdays after 4 PM', 'Mornings from 9 to 12')" });
        }
        if (availability) {
            messages.push({ from: 'user', text: availability });
            messages.push({ from: 'ai', text: "Excellent. What are your main goals for this week? (e.g., 'Prepare for my calculus midterm', 'Finish my English essay')" });
        }
        if (goals) {
            messages.push({ from: 'user', text: goals });
            messages.push({ from: 'ai', text: "Got it. Lastly, what day is it today? (e.g., Monday, Tuesday)" });
        }
        if (currentDay) {
            messages.push({ from: 'user', text: currentDay });
        }
        if (stage === 'generating') {
            messages.push({ from: 'ai', text: "Perfect! Generating your personalized plan now... This might take a moment." });
        }
        if (stage === 'error' && error) {
            messages.push({ from: 'ai', text: `Oops, something went wrong. ${error} You could try rephrasing your goals or availability.` });
        }
        return messages;
    }, [stage, timezone, availability, goals, currentDay, error]);

    const handleStart = () => setStage('askingTimezone');
    
    const handleResetPlanner = () => {
        setStage('idle');
        setTimezone('');
        setAvailability('');
        setGoals('');
        setCurrentDay('');
        setPlan(null);
        setError(null);
        setUserInput('');
    };

    const handleUserInput = async () => {
        const input = userInput.trim();
        if (!input) return;

        if (stage === 'askingTimezone') {
            setTimezone(input);
            setStage('askingAvailability');
        } else if (stage === 'askingAvailability') {
            setAvailability(input);
            setStage('askingGoals');
        } else if (stage === 'askingGoals') {
            setGoals(input);
            setStage('askingCurrentDay');
        } else if (stage === 'askingCurrentDay') {
            setCurrentDay(input);
            setStage('generating');
            try {
                const result = await generateStudyPlan({ history, timezone, availability, goals, currentDay: input });
                setPlan(result);
                setStage('showingPlan');
            } catch (e: any) {
                setError(e.message || "An unknown error occurred.");
                setStage('error');
            }
        }
        setUserInput('');
    };

    const isInputVisible = stage === 'askingTimezone' || stage === 'askingAvailability' || stage === 'askingGoals' || stage === 'askingCurrentDay';
    const inputPlaceholder = 
        stage === 'askingTimezone' ? 'Your timezone...' :
        stage === 'askingAvailability' ? 'Your availability...' :
        stage === 'askingGoals' ? 'Your goals for the week...' :
        'What day is today?';


    return (
        <div>
            {stage === 'idle' && (
                <div className="text-center p-6 border-2 border-dashed border-slate-300 dark:border-white/20 rounded-xl">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">AI Weekly Planner</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Get a personalized study schedule based on your habits to boost consistency by 10%.</p>
                    <button onClick={handleStart} className="mt-4 px-5 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 text-white dark:text-slate-900 font-semibold transition-transform hover:scale-105">
                        Create My Plan
                    </button>
                </div>
            )}

            {(stage !== 'idle' && stage !== 'showingPlan') && (
                <div className="space-y-3 p-4 border border-slate-200 dark:border-white/10 rounded-lg">
                    {plannerMessages.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-3 text-sm ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.from === 'ai' && <div className="w-6 h-6 flex-shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400 text-xs font-bold">P</div>}
                            <div className={`p-2 rounded-lg max-w-[85%] ${msg.from === 'user' ? 'bg-violet-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>{msg.text}</div>
                        </div>
                    ))}
                     {stage === 'generating' && <div className="text-center text-sm text-slate-500 dark:text-slate-400 animate-pulse">AI is thinking...</div>}
                     {isInputVisible && (
                        <div className="flex gap-2 pt-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUserInput()}
                                placeholder={inputPlaceholder}
                                className="flex-1 p-2 rounded-md bg-transparent border border-slate-300 dark:border-white/20 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                autoFocus
                            />
                            <button onClick={handleUserInput} className="px-4 py-2 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 font-semibold">Send</button>
                        </div>
                    )}
                    {stage === 'error' && (
                        <div className="text-center pt-2">
                             <button onClick={handleResetPlanner} className="px-4 py-2 text-sm rounded-md bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors">
                                Try Again
                             </button>
                        </div>
                    )}
                </div>
            )}
            
            {stage === 'showingPlan' && plan && (
                 <div className="animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Your AI-Generated Weekly Plan</h3>
                        <button onClick={handleResetPlanner} className="text-sm text-slate-500 dark:text-slate-400 hover:underline mt-1 sm:mt-0">Generate New Plan</button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(plan).map(([day, activities]) => (
                            <div key={day} className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                <h4 className="font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-white/10 pb-2 mb-2">{day}</h4>
                                {(activities && activities.length > 0) ? (
                                    <ul className="space-y-2 text-sm">
                                        {activities.map((act, i) => (
                                            <li key={i}>
                                                <span className="font-medium text-slate-600 dark:text-slate-300">{act.time}: </span>
                                                <span className="text-slate-500 dark:text-slate-400">{act.activity}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-slate-400">Rest day!</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const StatsModal: React.FC<StatsModalProps> = ({ onClose, userName, focusSessionHistory }) => {
    const totalFocusMinutes = useMemo(() => focusSessionHistory.reduce((acc, s) => acc + (s.endTime - s.startTime) / 60000, 0), [focusSessionHistory]);
    const avgDailyMinutes = useMemo(() => {
        const uniqueDays = new Set(focusSessionHistory.map(s => s.date)).size;
        return uniqueDays > 0 ? totalFocusMinutes / uniqueDays : 0;
    }, [focusSessionHistory, totalFocusMinutes]);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100 dark:bg-gradient-to-b dark:from-[#031124] dark:to-[#06070a] flex flex-col animate-fade-in text-slate-800 dark:text-slate-200">
             <header className="flex-shrink-0 h-16 bg-white/80 dark:bg-slate-800/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 z-10">
                <h2 className="font-semibold text-lg text-slate-800 dark:text-white">Your Performance Dashboard</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label="Close dashboard">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Hey {userName || 'Student'}, here's your progress!</h1>
                        <p className="text-slate-500 dark:text-slate-400">Keep up the great work. Consistency is key.</p>
                    </div>

                    <div className="p-4 sm:p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Study Timeline (Last 7 Days)</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Each colored block represents a completed focus session.</p>
                        {focusSessionHistory.length > 0 ? <StudyTimelineChart history={focusSessionHistory} /> : <p className="text-center py-8 text-slate-500">No focus sessions recorded yet. Use the Pomodoro timer to start tracking!</p>}
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 text-center">
                            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Average Daily Focus</h4>
                            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{Math.round(avgDailyMinutes)} minutes</p>
                        </div>
                    </div>
                    
                    <div className="p-4 sm:p-6 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
                         <AIPlanner history={focusSessionHistory} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StatsModal;