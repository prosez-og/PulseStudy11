import React from 'react';

interface AIRatingInfoModalProps {
  rating: number;
  onClose: () => void;
}

const AIRatingInfoModal: React.FC<AIRatingInfoModalProps> = ({ rating, onClose }) => {
  return (
    <div className="bg-slate-200 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-300 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg text-slate-800 dark:text-white">About Your AI Rating</h4>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">✕</button>
      </div>
      <div className="mt-4 text-slate-600 dark:text-slate-300 space-y-3">
        <div className="text-center my-4">
            <div className="text-xs text-violet-500 dark:text-violet-300 font-bold">YOUR CURRENT RATING</div>
            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-violet-500 my-1">{rating.toLocaleString()}</div>
        </div>
        <p>
            Hello there! I'm Pulse, your AI tutor, and I've calculated this rating to recognize your amazing effort.
        </p>
        <p>
            This isn't just a random number—it's a dynamic score from <span className="font-bold text-slate-800 dark:text-white">1,000 to 10,000</span> that reflects your productivity and dedication on PulseStudy. It goes up as you:
        </p>
        <ul className="list-disc list-inside space-y-1 pl-2 text-sm">
            <li>
                <span className="font-semibold text-slate-700 dark:text-slate-100">Complete tasks</span> and stay on top of your to-do list.
            </li>
            <li>
                Dedicate time to <span className="font-semibold text-slate-700 dark:text-slate-100">deep focus sessions</span> with the Pomodoro timer.
            </li>
            <li>
                Actively <span className="font-semibold text-slate-700 dark:text-slate-100">create insightful notes</span> to organize your knowledge.
            </li>
             <li>
                Earn <span className="font-semibold text-slate-700 dark:text-slate-100">XP</span> and climb the ranks through consistent effort.
            </li>
        </ul>
        <p className="pt-2">
            Think of it as my way of giving you a high-five! Keep up the fantastic work.
        </p>
      </div>
      <div className="mt-6 text-right">
        <button onClick={onClose} className="px-5 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 text-slate-900 font-semibold transition-transform hover:scale-105">
            Got it!
        </button>
      </div>
    </div>
  );
};

export default AIRatingInfoModal;