
import React, { useState } from 'react';

const CalculatorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | number>('0');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const exp = e.target.value;
    setExpression(exp);
    if (!exp) {
      setResult('0');
      return;
    }
    // Basic validation to prevent unsafe eval characters
    if (/[^0-9+\-*/().\s]/.test(exp)) {
        setResult('Invalid Input');
        return;
    }
    try {
        // eslint-disable-next-line no-eval
        const evalResult = eval(exp);
        setResult(Number.isFinite(evalResult) ? evalResult : 'Error');
    } catch (error) {
        setResult('Error');
    }
  };

  return (
    <div className="bg-slate-200 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-300 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg text-slate-800 dark:text-white">Calculator</h4>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">✕</button>
      </div>
      <div className="mt-4">
        <input
          type="text"
          value={expression}
          onChange={handleInputChange}
          placeholder="e.g., 5 * (10 + 2)"
          className="w-full p-3 rounded-md bg-transparent border border-slate-400 dark:border-white/20 focus:ring-2 focus:ring-violet-500 focus:outline-none transition text-right text-lg"
          autoFocus
        />
        <div className="mt-4 text-right text-4xl font-bold text-slate-800 dark:text-white break-all">
          <span>{result}</span>
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;