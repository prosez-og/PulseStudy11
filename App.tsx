import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { Task, Note, ModalContent, TaskPriority, NoteFile, PomodoroSession, Theme, FocusSessionHistory } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import NotesSection from './components/NotesSection';
import TasksSection from './components/TasksSection';
import AiSolver from './components/AiSolver';
import AiChatButton from './components/AiChatButton';
import QuickTools from './components/QuickTools';
import Footer from './components/Footer';
import NoteModal from './components/modals/NoteModal';
import CalculatorModal from './components/modals/CalculatorModal';
import StatsModal from './components/modals/StatsModal';
import RanksModal from './components/modals/RanksModal';
import FileEditorModal from './components/modals/FileEditorModal';
import FullScreenPomodoroModal from './components/modals/FullScreenPomodoroModal';
import AIRatingInfoModal from './components/modals/AIRatingInfoModal';
import { ranks } from './constants';
import { evaluateTaskCompletion } from './services/geminiService';

export default function App() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('ps_tasks_v3', []);
  const [notes, setNotes] = useLocalStorage<Note[]>('ps_notes_v3', []);
  const [focusTime, setFocusTime] = useLocalStorage<number>('ps_focus_v3', 0);
  const [focusSessionHistory, setFocusSessionHistory] = useLocalStorage<FocusSessionHistory[]>('ps_focus_history_v1', []);
  const [xp, setXp] = useLocalStorage<number>('ps_xp_v3', 0);
  const [userName, setUserName] = useLocalStorage<string>('ps_userName', '');
  const [theme, setTheme] = useLocalStorage<Theme>('ps_theme_v1', 'dark');
  
  // Pomodoro State
  const [pomodoroDuration, setPomodoroDuration] = useLocalStorage('ps_pomo_duration_v1', 25);
  const [secondsLeft, setSecondsLeft] = useState(pomodoroDuration * 60);
  const [isPomodoroRunning, setPomodoroRunning] = useState(false);
  const [isPomodoroFullScreen, setPomodoroFullScreen] = useState(false);
  const [pomodoroSession, setPomodoroSession] = useLocalStorage<PomodoroSession>('ps_pomo_session_v2', {
    date: new Date().toISOString().split('T')[0],
    total: 4,
    completed: 0,
  });
  
  const timerIntervalRef = useRef<number | null>(null);
  const pomodoroStartTimestamp = useRef<number | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContent>({ type: null });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAiChatOpen, setAiChatOpen] = useState(false);
  
  // Dynamic AI Rating Calculation
  const aiRating = useMemo(() => {
    const completedTasksCount = tasks.filter(t => t.done).length;
    const rawScore = (completedTasksCount * 15) + (focusTime * 2) + (notes.length * 25) + (xp * 0.5);
    const targetScore = 12000; // An estimated score for a very active user
    const scaledScore = (rawScore / targetScore) * 9000;
    return 1000 + Math.min(9000, Math.round(scaledScore));
  }, [tasks, focusTime, notes, xp]);

  useEffect(() => {
    // Apply theme class to the root element
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    // One-time migrations for tasks
    const needsMigration = tasks.length > 0 && tasks.some(t => !t.priority || !t.completions);
    if (needsMigration) {
      setTasks(currentTasks => currentTasks.map(task => ({
        ...task,
        priority: task.priority || 'medium',
        completions: task.completions || [],
      })));
    }
    
    // Check and reset Pomodoro session daily
    const today = new Date().toISOString().split('T')[0];
    if (pomodoroSession.date !== today) {
        setPomodoroSession(prev => ({
            date: today,
            total: prev.total, // Keep user's preferred total
            completed: 0
        }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const addXP = useCallback((amount: number) => {
    setXp(prevXp => prevXp + amount);
  }, [setXp]);

  const handleSetPomodoroRunning = (running: boolean) => {
    const wasRunning = isPomodoroRunning;
    if (running && !wasRunning) { // Starting
      pomodoroStartTimestamp.current = Date.now();
    } else if (!running && wasRunning) { // Stopping
      if (pomodoroStartTimestamp.current) {
        const session: FocusSessionHistory = {
          date: new Date(pomodoroStartTimestamp.current).toISOString().split('T')[0],
          startTime: pomodoroStartTimestamp.current,
          endTime: Date.now(),
        };
        // Only add sessions longer than a minute
        if (session.endTime - session.startTime > 60000) {
            setFocusSessionHistory(prev => [...prev, session]);
        }
        pomodoroStartTimestamp.current = null;
      }
    }
    setPomodoroRunning(running);
  };

  // Central Pomodoro Timer Logic
  const handlePomodoroSessionComplete = useCallback(() => {
    setFocusTime(prev => prev + pomodoroDuration);
    addXP(pomodoroDuration); // Award 1 XP per minute of focus
    setPomodoroSession(s => ({ ...s, completed: Math.min(s.total, s.completed + 1) }));
    alert("Pomodoro session finished! Great work.");
    handleSetPomodoroRunning(false);
    setSecondsLeft(pomodoroDuration * 60);
  }, [addXP, setFocusTime, pomodoroDuration, setPomodoroSession]);

  useEffect(() => {
    if (isPomodoroRunning) {
        timerIntervalRef.current = window.setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    window.clearInterval(timerIntervalRef.current!);
                    handlePomodoroSessionComplete();
                    return 0; // Will be reset by handler
                }
                return prev - 1;
            });
        }, 1000);
    } else if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
    }
    return () => {
        if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    };
  }, [isPomodoroRunning, handlePomodoroSessionComplete]);
  
  const handlePomodoroDurationChange = (newDuration: number) => {
    setPomodoroDuration(newDuration);
    if (!isPomodoroRunning) {
      setSecondsLeft(newDuration * 60);
    }
  };

  const handlePomodoroReset = () => {
    handleSetPomodoroRunning(false);
    setSecondsLeft(pomodoroDuration * 60);
  };

  const currentRank = ranks.find(r => xp >= r.min && xp <= r.max) ?? ranks[ranks.length - 1];

  const handleOpenModal = (type: ModalContent['type'], data?: any) => {
    if (type === 'note' && data) {
      setEditingNote(data);
    } else {
      setEditingNote(null);
    }
    setModalContent({ type, data });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingNote(null);
    // Give time for modal to fade out before resetting content
    setTimeout(() => setModalContent({ type: null }), 300);
  };

  const handleSaveNote = (noteToSave: Note) => {
    const existingIndex = notes.findIndex(n => n.id === noteToSave.id);
    if (existingIndex > -1) {
      const updatedNotes = [...notes];
      updatedNotes[existingIndex] = noteToSave;
      setNotes(updatedNotes);
    } else {
      setNotes([noteToSave, ...notes]);
      addXP(15);
    }
    handleCloseModal();
  };
  
  const handleDeleteNote = (noteId: string) => {
      setNotes(currentNotes => currentNotes.filter(n => n.id !== noteId));
      handleCloseModal();
  };

  const handleSaveEditedFile = (noteId: string, updatedFile: NoteFile) => {
    setNotes(currentNotes => currentNotes.map(note => {
        if (note.id === noteId) {
            return { ...note, file: updatedFile };
        }
        return note;
    }));
    handleCloseModal();
  };

  const handleAddTask = (title: string, priority: TaskPriority, dueDate?: number) => {
      if (!title) return;
      const newTask: Task = { id: Date.now().toString(), title, done: false, created: Date.now(), priority, dueDate, completions: [] };
      setTasks([newTask, ...tasks]);
  };

  const evaluateAndAwardXp = useCallback(async (task: Task) => {
    console.log(`AI is evaluating task: "${task.title}"`);
    const result = await evaluateTaskCompletion(task);
    if (result.awardXP) {
        console.log(`AI approved XP award. Reason: ${result.reason}`);
        addXP(10);
    } else {
        console.warn(`AI rejected XP award for task "${task.title}". Reason: ${result.reason}`);
    }
  }, [addXP]);
  
  const handleToggleTask = (id: string) => {
    let taskToEvaluate: Task | undefined;

    setTasks(currentTasks =>
        currentTasks.map(t => {
            if (t.id === id) {
                const isCompleting = !t.done;
                const updatedTask = {
                    ...t,
                    done: isCompleting,
                    completions: isCompleting
                        ? [...(t.completions || []), Date.now()]
                        : t.completions,
                };

                if (isCompleting) {
                    taskToEvaluate = updatedTask;
                }
                return updatedTask;
            }
            return t;
        })
    );
    
    if (taskToEvaluate) {
        evaluateAndAwardXp(taskToEvaluate);
    }
  };
  
  const handleDeleteTask = (id: string) => {
      setTasks(tasks.filter(t => t.id !== id));
  };

  const handleUpdateTaskPriority = (id: string, priority: TaskPriority) => {
    setTasks(tasks.map(t => (t.id === id ? { ...t, priority } : t)));
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isPomodoroFullScreen) {
            setPomodoroFullScreen(false);
        } else if (modalContent.type !== 'fileEditor') {
            handleCloseModal();
            setAiChatOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [modalContent.type, isPomodoroFullScreen]);

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200">
      <Header 
        theme={theme} 
        setTheme={setTheme}
      />
      <main className="pt-28 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <Dashboard
          taskCount={tasks.length}
          noteCount={notes.length}
          focusTime={focusTime}
          xp={xp}
          rank={currentRank}
          onOpenModal={handleOpenModal}
          aiRating={aiRating}
          pomodoro={{
            duration: pomodoroDuration,
            setDuration: handlePomodoroDurationChange,
            secondsLeft: secondsLeft,
            isRunning: isPomodoroRunning,
            setIsRunning: handleSetPomodoroRunning,
            reset: handlePomodoroReset,
            session: pomodoroSession,
            setSession: setPomodoroSession,
            openFullScreen: () => setPomodoroFullScreen(true),
          }}
        />
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <NotesSection 
              notes={notes} 
              onOpenModal={handleOpenModal}
            />
          </div>
          <aside className="space-y-6">
            <TasksSection 
                tasks={tasks} 
                onAddTask={handleAddTask} 
                onToggleTask={handleToggleTask} 
                onDeleteTask={handleDeleteTask}
                onUpdateTaskPriority={handleUpdateTaskPriority}
            />
          </aside>
        </section>
        <QuickTools onOpenModal={handleOpenModal} />
      </main>
      <Footer />
      
      {isPomodoroFullScreen && (
        <FullScreenPomodoroModal 
            duration={pomodoroDuration}
            secondsLeft={secondsLeft}
            isRunning={isPomodoroRunning}
            setIsRunning={handleSetPomodoroRunning}
            reset={handlePomodoroReset}
            session={pomodoroSession}
            onClose={() => setPomodoroFullScreen(false)}
        />
      )}

      {modalContent.type === 'stats' && modalOpen && (
        <StatsModal
          onClose={handleCloseModal}
          userName={userName}
          focusSessionHistory={focusSessionHistory}
        />
      )}
      
      {modalContent.type === 'fileEditor' && modalOpen && modalContent.data && (
        <FileEditorModal
            file={modalContent.data.file}
            onSave={(updatedFile) => handleSaveEditedFile(modalContent.data.noteId, updatedFile)}
            onClose={handleCloseModal}
        />
      )}

      {modalContent.type !== 'fileEditor' && modalContent.type !== 'stats' && modalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseModal}
        >
          <div className="w-full max-w-xl p-4" onClick={(e) => e.stopPropagation()}>
            {modalContent.type === 'note' && <NoteModal note={editingNote} onSave={handleSaveNote} onDelete={handleDeleteNote} onClose={handleCloseModal} onOpenModal={handleOpenModal} />}
            {modalContent.type === 'calculator' && <CalculatorModal onClose={handleCloseModal} />}
            {modalContent.type === 'ranks' && <RanksModal onClose={handleCloseModal} />}
            {modalContent.type === 'aiRatingInfo' && <AIRatingInfoModal rating={aiRating} onClose={handleCloseModal} />}
          </div>
        </div>
      )}

      {!isAiChatOpen && <AiChatButton onClick={() => setAiChatOpen(true)} />}
      <AiSolver 
        isOpen={isAiChatOpen} 
        onClose={() => setAiChatOpen(false)}
        userName={userName}
        setUserName={setUserName}
        onAddTask={handleAddTask}
      />
    </div>
  );
}