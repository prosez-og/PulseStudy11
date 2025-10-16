
import React from 'react';
import type { Note, ModalContent } from '../types';

interface NotesSectionProps {
  notes: Note[];
  onOpenModal: (type: ModalContent['type'], data?: any) => void;
}

const NoteCard: React.FC<{ note: Note; onOpenModal: NotesSectionProps['onOpenModal'] }> = ({ note, onOpenModal }) => {
    const truncate = (str: string, len: number) => {
        return str.length > len ? str.substring(0, len) + "..." : str;
    };

    return (
        <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-cyan-500/30">
            <div>
                <div className="font-semibold text-slate-800 dark:text-white">{truncate(note.title, 30)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{new Date(note.created).toLocaleString()}</div>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 break-words">{truncate(note.body, 100)}</p>
                {note.file && (
                     <button
                        onClick={() => onOpenModal('fileEditor', { noteId: note.id, file: note.file })}
                        className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline mt-2 flex items-center gap-1 text-left"
                        aria-label={`Open editor for ${note.file.name}`}
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
                        <span>{truncate(note.file.name, 25)}</span>
                    </button>
                )}
            </div>
            <div className="mt-3 text-right">
                <button onClick={() => onOpenModal('note', note)} className="px-3 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors text-xs font-medium">
                    View / Edit
                </button>
            </div>
        </div>
    );
};

const NotesSection: React.FC<NotesSectionProps> = ({ notes, onOpenModal }) => {
  return (
    <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-white">Notes</h2>
        <button onClick={() => onOpenModal('note')} className="px-3 py-2 rounded-md bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors">+ New</button>
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {notes.length > 0 ? (
          notes.map((note) => (
            <NoteCard key={note.id} note={note} onOpenModal={onOpenModal} />
          ))
        ) : (
          <div className="sm:col-span-2 text-center py-8 text-slate-500">
            You have no notes. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesSection;