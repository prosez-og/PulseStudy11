
import React from 'react';
import type { ModalContentType } from '../types';

interface QuickToolsProps {
  onOpenModal: (type: ModalContentType) => void;
}

const ToolButton: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-center font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200">
        {children}
    </button>
);

const QuickTools: React.FC<QuickToolsProps> = ({ onOpenModal }) => {
  return (
    <section id="tools" className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 mt-6">
      <h3 className="font-semibold text-lg text-slate-800 dark:text-white">Quick Tools</h3>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
        <ToolButton onClick={() => onOpenModal('calculator')}>Calculator</ToolButton>
        <ToolButton onClick={() => onOpenModal('stats')}>Your Stats</ToolButton>
        <ToolButton onClick={() => document.getElementById('customPomodoro')?.focus()}>Focus Timer</ToolButton>
      </div>
    </section>
  );
};

export default QuickTools;