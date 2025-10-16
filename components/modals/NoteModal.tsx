import React, { useState, useEffect } from 'react';
import type { Note, NoteFile, ModalContent } from '../../types';

interface NoteModalProps {
  note: Note | null;
  onSave: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onClose: () => void;
  onOpenModal: (type: ModalContent['type'], data?: any) => void;
}

const FileAttachment: React.FC<{ file: NoteFile, onOpen: () => void }> = ({ file, onOpen }) => {
    const isImage = file.type.startsWith('image/');
    return (
        <button onClick={onOpen} className="w-full p-3 rounded-lg bg-black/20 border border-white/10 flex items-center gap-4 text-left hover:bg-black/30 transition-colors">
            {isImage ? (
                <img src={file.dataUrl} alt={file.name} className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
            ) : (
                <div className="w-12 h-12 flex-shrink-0 bg-slate-700 rounded-md flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
            <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-400">Click to view & annotate</p>
            </div>
        </button>
    )
}

const NoteModal: React.FC<NoteModalProps> = ({ note, onSave, onDelete, onClose, onOpenModal }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [currentFile, setCurrentFile] = useState<NoteFile | undefined>(undefined);
  const [fileError, setFileError] = useState<string>('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setBody(note.body);
      setCurrentFile(note.file);
    }
  }, [note]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeBytes = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSizeBytes) {
      setFileError('File size exceeds 50MB limit.');
      e.target.value = '';
      return;
    }
    setFileError('');

    const reader = new FileReader();
    reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCurrentFile({ name: file.name, type: file.type, dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const noteToSave: Note = {
      id: note?.id || Date.now().toString(),
      title: title.trim() || 'Untitled',
      body: body.trim(),
      file: currentFile,
      created: note?.created || Date.now()
    };
    onSave(noteToSave);
  };

  const handleDelete = () => {
    if (note && window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
        onDelete(note.id);
    }
  };

  return (
    <div className="bg-slate-200 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-300 dark:border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-in-up">
      <div className="flex items-start justify-between">
        <h4 className="font-semibold text-lg text-slate-800 dark:text-white">{note ? 'Edit Note' : 'New Note'}</h4>
        <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">✕</button>
      </div>

      <div className="mt-4 space-y-4">
        {currentFile && note && <FileAttachment file={currentFile} onOpen={() => onOpenModal('fileEditor', {noteId: note.id, file: currentFile })} />}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full p-3 rounded-md bg-transparent border border-slate-400 dark:border-white/20 focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Write your note..."
          className="w-full p-3 rounded-md bg-transparent border border-slate-400 dark:border-white/20 focus:ring-2 focus:ring-violet-500 focus:outline-none transition"
        ></textarea>
        
        <div>
          <label htmlFor="noteFile" className="text-sm text-slate-500 dark:text-slate-400">
            {currentFile ? 'Change attachment' : 'Attach File'} (PDF, image, etc. - Max 50 MB)
          </label>
          <div className="flex items-center gap-3 mt-1">
            <input
              type="file"
              id="noteFile"
              onChange={handleFileChange}
              className="w-full p-2 text-sm rounded-md bg-transparent border border-slate-400 dark:border-white/20 text-slate-600 dark:text-slate-300 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-violet-500/20 file:text-violet-300 hover:file:bg-violet-500/40"
            />
            {currentFile && <button onClick={() => { setCurrentFile(undefined); (document.getElementById('noteFile') as HTMLInputElement).value = '' }} className="text-xs text-red-500 hover:underline">Remove</button>}
          </div>
          {fileError && <div className="text-xs text-red-500 mt-1">{fileError}</div>}
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-6">
        <div>
          {note && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-md text-red-500 dark:text-red-400 hover:bg-red-500/10 font-semibold transition-colors text-sm"
            >
              Delete Note
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors font-medium">Cancel</button>
          <button type="button" onClick={handleSave} className="px-5 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 text-white dark:text-slate-900 font-semibold transition-transform hover:scale-105">Save</button>
        </div>
      </div>
    </div>
  );
};

export default NoteModal;