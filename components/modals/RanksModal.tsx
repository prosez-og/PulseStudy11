import React from 'react';
import { ranks } from '../../constants';
import RankBadge from '../RankBadge';

interface RanksModalProps {
  onClose: () => void;
}

const RanksModal: React.FC<RanksModalProps> = ({ onClose }) => {
  return (
    <div className="bg-slate-200 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-300 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up w-full max-w-md">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg text-slate-800 dark:text-white">Rank Progression</h4>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">✕</button>
      </div>
      <ul className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
        {ranks.map((rank, index) => (
            <li key={rank.name} className="flex items-center gap-4 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-transparent hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                <RankBadge rank={rank} />
                <div className="flex-1">
                    <div className="font-bold text-slate-800 dark:text-white">{rank.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                        {rank.max < 999999 ? `${rank.min.toLocaleString()} - ${rank.max.toLocaleString()} XP` : `${rank.min.toLocaleString()}+ XP`}
                    </div>
                    {rank.description && <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">{rank.description}</div>}
                </div>
            </li>
        ))}
      </ul>
    </div>
  );
};

export default RanksModal;