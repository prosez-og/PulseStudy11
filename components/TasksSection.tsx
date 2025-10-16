import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Task, TaskPriority } from '../types';

interface TasksSectionProps {
  tasks: Task[];
  onAddTask: (title: string, priority: TaskPriority, dueDate?: number) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTaskPriority: (id: string, priority: TaskPriority) => void;
}

const priorityStyles: Record<TaskPriority, { border: string; bg: string; text: string; name: string, ring: string }> = {
  high: { border: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-500 dark:text-red-400', name: 'High', ring: 'ring-red-500' },
  medium: { border: 'border-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-500 dark:text-yellow-400', name: 'Medium', ring: 'ring-yellow-500' },
  low: { border: 'border-green-500', bg: 'bg-green-500/20', text: 'text-green-500 dark:text-green-400', name: 'Low', ring: 'ring-green-500' },
};
const priorities: TaskPriority[] = ['high', 'medium', 'low'];

const formatDueDate = (timestamp: number): string => {
    const dueDate = new Date(timestamp);
    const today = new Date();
    
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays < 7) return `in ${diffDays} days`;
    if (diffDays >= 7 && diffDays < 14) return 'Next week';
    
    return dueDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
};

const TasksSection: React.FC<TasksSectionProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, onUpdateTaskPriority }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState<number | null>(null);
  
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'dueDate'>('created');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority[]>(['high', 'medium', 'low']);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');
  
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [isPriorityPickerOpen, setPriorityPickerOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const priorityPickerRef = useRef<HTMLDivElement>(null);

  const areFiltersActive = useMemo(() => {
    return statusFilter !== 'all' || priorityFilter.length < 3;
  }, [statusFilter, priorityFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
            setFilterOpen(false);
        }
        if (priorityPickerRef.current && !priorityPickerRef.current.contains(event.target as Node)) {
            setPriorityPickerOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dueDateOptions = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    const weekend = new Date();
    const dayOfWeek = weekend.getDay();
    const daysUntilSaturday = 6 - dayOfWeek;
    weekend.setDate(weekend.getDate() + (daysUntilSaturday < 0 ? daysUntilSaturday + 7 : daysUntilSaturday));
    weekend.setHours(23, 59, 59, 999);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);

    return [
        { label: 'Today', value: today.getTime() },
        { label: 'Tomorrow', value: tomorrow.getTime() },
        { label: 'This Weekend', value: weekend.getTime() },
        { label: 'Next Week', value: nextWeek.getTime() },
    ];
  }, []);

  const handleAddTask = () => {
    onAddTask(newTaskTitle.trim(), newTaskPriority, newTaskDueDate || undefined);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskDueDate(null);
  };

  const handleDeleteWithAnimation = (id: string) => {
    setDeletingTaskId(id);
    setTimeout(() => {
        onDeleteTask(id);
        setDeletingTaskId(null);
    }, 300);
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };
  
  const handlePriorityFilterChange = (priority: TaskPriority) => {
    setPriorityFilter(current => 
        current.includes(priority)
            ? current.filter(p => p !== priority)
            : [...current, priority]
    );
  };

  const filteredAndSortedTasks = useMemo(() => {
    const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    let filtered = [...tasks];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => (statusFilter === 'done' ? t.done : !t.done));
    }
    if (priorityFilter.length < 3) {
      filtered = filtered.filter(t => priorityFilter.includes(t.priority));
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        if (a.priority !== b.priority) return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'dueDate') {
        if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
      }
      return b.created - a.created;
    });
  }, [tasks, sortBy, priorityFilter, statusFilter]);

  return (
    <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Tasks</h3>
        <div className="relative" ref={filterMenuRef}>
            <button 
                onClick={() => setFilterOpen(o => !o)}
                className="relative flex items-center gap-2 px-3 py-2 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                Filter & Sort
                {areFiltersActive && <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-cyan-500 ring-2 ring-slate-100 dark:ring-slate-800"></span>}
            </button>
            {isFilterOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-lg shadow-xl z-20 p-4 animate-fade-in-up origin-top-right">
                   <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">STATUS</label>
                            <div className="mt-2 flex items-center gap-1 bg-black/5 dark:bg-white/10 p-1 rounded-md">
                                {(['all', 'pending', 'done'] as const).map(s => (
                                    <button key={s} onClick={() => setStatusFilter(s)} className={`w-full px-2 py-1 text-xs font-semibold rounded capitalize transition-colors ${statusFilter === s ? 'bg-violet-500 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/20'}`}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">PRIORITY</label>
                            <div className="mt-2 space-y-2">
                                {priorities.map(p => (
                                    <label key={p} className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            checked={priorityFilter.includes(p)}
                                            onChange={() => handlePriorityFilterChange(p)}
                                            className={`h-4 w-4 rounded bg-white/10 border-slate-300 dark:border-white/20 text-violet-500 focus:ring-violet-500 cursor-pointer ${priorityStyles[p].text}`}
                                        />
                                        <span className={`capitalize ${priorityStyles[p].text}`}>{p}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">SORT BY</label>
                             <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'created' | 'priority' | 'dueDate')}
                                className="w-full mt-2 p-2 rounded-md bg-transparent border border-slate-300 dark:border-white/20 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                aria-label="Sort tasks"
                                >
                                <option value="created">Newest First</option>
                                <option value="priority">Priority (High-Low)</option>
                                <option value="dueDate">Due Date (Soonest)</option>
                            </select>
                        </div>
                   </div>
                </div>
            )}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3">
         <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New task..."
            className="w-full p-2 rounded-md bg-transparent border border-slate-300 dark:border-white/20 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Due:</span>
              {dueDateOptions.map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => setNewTaskDueDate(current => current === value ? null : value)}
                  className={`px-2 py-1 text-xs font-semibold rounded-md transition-all ${newTaskDueDate === value ? 'bg-violet-500 text-white shadow-md ring-2 ring-violet-400' : 'text-slate-600 dark:text-slate-300 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20'}`}
                >
                  {label}
                </button>
              ))}
              {newTaskDueDate && (
                <button
                    onClick={() => setNewTaskDueDate(null)}
                    className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1"
                    aria-label="Clear due date"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
                <div className="relative" ref={priorityPickerRef}>
                    <button 
                        onClick={() => setPriorityPickerOpen(o => !o)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors text-sm font-semibold border ${priorityStyles[newTaskPriority].bg} ${priorityStyles[newTaskPriority].text} ${priorityStyles[newTaskPriority].border}`}
                        aria-haspopup="true"
                        aria-expanded={isPriorityPickerOpen}
                    >
                        <span className={`w-2 h-2 rounded-full ${priorityStyles[newTaskPriority].ring.replace('ring-','bg-')}`}></span>
                        {priorityStyles[newTaskPriority].name}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    {isPriorityPickerOpen && (
                        <div className="absolute bottom-full right-0 mb-2 w-32 bg-slate-200/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-300 dark:border-white/20 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-up origin-bottom-right">
                           {priorities.map(p => (
                               <button 
                                key={p}
                                onClick={() => { setNewTaskPriority(p); setPriorityPickerOpen(false); }}
                                className={`w-full text-left px-3 py-2 text-sm font-medium flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${priorityStyles[p].text}`}
                               >
                                  <span className={`w-2 h-2 rounded-full ${priorityStyles[p].ring.replace('ring-','bg-')}`}></span>
                                  {priorityStyles[p].name}
                               </button>
                           ))}
                        </div>
                    )}
                </div>
                <button onClick={handleAddTask} className="px-3 py-2 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-sm font-semibold">Add Task</button>
            </div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200 dark:border-white/10"></div>

      <ul className="mt-4 space-y-2 max-h-80 overflow-auto pr-2">
        {filteredAndSortedTasks.length > 0 ? filteredAndSortedTasks.map((task) => {
          const nextPriorityIndex = (priorities.indexOf(task.priority) + 1) % priorities.length;
          const nextPriority = priorities[nextPriorityIndex];
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isOverdue = task.dueDate && !task.done && new Date(task.dueDate) < today;

          return (
            <li 
                key={task.id} 
                className={`
                    p-3 rounded-lg flex items-center justify-between transition-all duration-300 ease-in-out 
                    hover:bg-black/5 dark:hover:bg-white/10 border-l-4 
                    ${task.done ? 'bg-green-500/10 dark:bg-green-900/20' : 'bg-black/5 dark:bg-white/5'} 
                    ${priorityStyles[task.priority]?.border || 'border-transparent'}
                    ${deletingTaskId === task.id ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                `}>
              <div className="flex items-start gap-3 overflow-hidden">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask(task.id)}
                  className="h-4 w-4 mt-1 rounded bg-black/10 dark:bg-white/10 border-slate-300 dark:border-white/20 text-violet-500 focus:ring-violet-500 cursor-pointer flex-shrink-0"
                  aria-labelledby={`task-title-${task.id}`}
                />
                <div className="overflow-hidden">
                    <span id={`task-title-${task.id}`} className={`font-medium break-words transition-colors duration-300 ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>{task.title}</span>
                    {task.dueDate && (
                        <div className={`flex items-center gap-1.5 text-xs mt-1 ${isOverdue ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                            <span>{isOverdue ? 'Overdue!' : formatDueDate(task.dueDate)}</span>
                        </div>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                 <button 
                    onClick={() => onUpdateTaskPriority(task.id, nextPriority)} 
                    className={`
                        w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-colors
                        ${priorityStyles[task.priority].bg} ${priorityStyles[task.priority].text}
                        hover:ring-2 hover:ring-offset-2 hover:ring-offset-slate-100 dark:hover:ring-offset-slate-800 ${priorityStyles[task.priority].border.replace('border-', 'ring-')}
                    `}
                    aria-label={`Current priority: ${task.priority}. Click to change to ${nextPriority}.`}
                 >
                    {task.priority.charAt(0).toUpperCase()}
                </button>
                <button 
                    onClick={() => handleDeleteWithAnimation(task.id)}
                    className="text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors w-6 h-6 rounded-md flex items-center justify-center hover:bg-red-500/10"
                    aria-label={`Delete task: ${task.title}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
              </div>
            </li>
          );
        }) : (
          <li className="text-center py-6 text-slate-500">
            No tasks found. Try adjusting your filters!
          </li>
        )}
      </ul>
    </div>
  );
};

export default TasksSection;