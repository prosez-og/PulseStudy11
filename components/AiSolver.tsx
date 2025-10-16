import React, { useState, useRef, useEffect } from 'react';
import { getAIChatResponseStream } from '../services/geminiService';
import { AI_SAMPLE_PROMPTS } from '../constants';
import { TaskPriority, ChatMessage } from '../types';

type Message = ChatMessage;

interface AiSolverProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
  onAddTask: (title: string, priority: TaskPriority, dueDate?: number) => void;
}

const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
  // Simple regex for **bold** and *italic*
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          return <em key={index}>{part.slice(1, -1)}</em>;
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
};


const AiSolver: React.FC<AiSolverProps> = ({ isOpen, onClose, userName, setUserName, onAddTask }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Prompt for name if not set and focus input when chat opens
  useEffect(() => {
    if (isOpen) {
        if (!userName) {
            const name = window.prompt("What should I call you? This will personalize your experience.");
            if (name) {
                setUserName(name);
            }
        }
        setTimeout(() => inputRef.current?.focus(), 300); // After animation
    }
  }, [isOpen, userName, setUserName]);

  const handleSend = async (promptText?: string) => {
    const trimmedInput = promptText || input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = { text: trimmedInput, from: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    if (!promptText) {
        setInput('');
    }
    setIsLoading(true);

    try {
        const stream = await getAIChatResponseStream(newMessages);
        
        let functionCalls: any[] = [];
        let hasAddedAIMessage = false;

        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                if (!hasAddedAIMessage) {
                    setMessages(prev => [...prev, { text: '', from: 'ai' }]);
                    hasAddedAIMessage = true;
                }
                
                // Animate typing
                for (const char of chunkText) {
                    setMessages(prev => {
                        const updated = [...prev];
                        const lastMsg = updated[updated.length - 1];
                        if (lastMsg && lastMsg.from === 'ai') {
                           lastMsg.text += char;
                        }
                        return updated;
                    });
                    await new Promise(res => setTimeout(res, 20)); // Typing speed
                }
            }
            if (chunk.functionCalls) {
                functionCalls.push(...chunk.functionCalls);
            }
        }

        if (functionCalls.length > 0) {
            let confirmationText = '';
            for (const fc of functionCalls) {
                if (fc.name === 'createTask') {
                    const { title, priority, dueDate } = fc.args as { title: string; priority?: TaskPriority; dueDate?: number };
                    onAddTask(title, priority || 'medium', dueDate);
                    confirmationText += `✅ Task added: "${title}"\n`;
                }
            }

            const lastMessageText = messages[messages.length - 1]?.text?.trim() || '';

            if (confirmationText.trim() && !lastMessageText) {
                const confirmationMessage: Message = { text: confirmationText.trim(), from: 'ai' };
                if (hasAddedAIMessage) {
                    setMessages(prev => {
                        const updatedMessages = [...prev];
                        updatedMessages[updatedMessages.length - 1] = confirmationMessage;
                        return updatedMessages;
                    });
                } else {
                    setMessages(prev => [...prev, confirmationMessage]);
                }
            }
        }

    } catch (e) {
        const errorMessage: Message = { text: "Sorry, I encountered an error. Please try again.", from: 'ai' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-slate-200/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col transition-opacity duration-300 ease-in-out
      ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-300 dark:border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white dark:text-slate-900 font-bold text-sm">
            AI
          </div>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-white">AI Doubt Solver</h3>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition" aria-label="Close AI Chat">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </header>

      {/* Chat Body */}
      <div ref={chatBoxRef} className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center animate-fade-in-up">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-white dark:text-slate-900 font-bold text-3xl shadow-lg">
              P
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Hello, {userName || 'Student'}! How can I help you today?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-md">
              I'm Pulse, your AI tutor. Ask me anything from complex theories to simple definitions. You can also ask me to create tasks for you, like "add a task to read chapter 5 by tomorrow".
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
              {AI_SAMPLE_PROMPTS.map((prompt, i) => (
                <button 
                  key={i}
                  onClick={() => handleSend(prompt)}
                  className="p-4 rounded-lg bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-left font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200 text-sm text-slate-600 dark:text-slate-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-sm max-w-3xl mx-auto py-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'ai' && (
                  <div className="w-7 h-7 flex-shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 dark:text-cyan-400 text-xs font-bold">
                    P
                  </div>
                )}
                <div className={`p-3 rounded-xl max-w-[85%] ${msg.from === 'user' ? 'bg-violet-500 text-white rounded-br-none' : 'bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                  <div className="whitespace-pre-wrap">
                    <MarkdownRenderer text={msg.text} />
                    {msg.from === 'ai' && isLoading && index === messages.length - 1 && (
                        <span className="blinking-cursor">|</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (messages.length === 0 || messages[messages.length - 1].from === 'user') && (
                <div className="flex items-start gap-3 justify-start">
                     <div className="w-7 h-7 flex-shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                        P
                     </div>
                     <div className="p-3 rounded-xl max-w-[85%] bg-slate-300 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                            <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-4 border-t border-slate-300 dark:border-white/10 flex-shrink-0">
        <div className="flex gap-2 max-w-3xl mx-auto">
            <input
                ref={inputRef}
                id="doubtInput"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your doubt or ask to add a task..."
                disabled={isLoading}
                className="flex-1 p-3 rounded-md bg-transparent border border-slate-300 dark:border-white/20 focus:ring-2 focus:ring-violet-500 focus:outline-none transition disabled:opacity-50"
            />
            <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 text-white dark:text-slate-900 font-semibold transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                aria-label="Send message"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
        </div>
      </div>
    </div>
  );
};

export default AiSolver;