
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { NoteFile } from '../../types';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.min.mjs`;

interface FileEditorModalProps {
  file: NoteFile;
  onSave: (file: NoteFile) => void;
  onClose: () => void;
}

const base64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64.split(',')[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const FileEditorModal: React.FC<FileEditorModalProps> = ({ file, onSave, onClose }) => {
    const [fileName, setFileName] = useState(file.name);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState('#ef4444'); // red-500
    const [lineWidth, setLineWidth] = useState(5);

    // PDF specific state
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);
    const annotationsByPage = useRef<Record<number, string>>({});

    const renderPage = useCallback(async (pageNumber: number) => {
        if (!pdfDoc) return;
        setIsLoading(true);
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });

        const bgCanvas = bgCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;
        if (!bgCanvas || !drawingCanvas) return;
        
        bgCanvas.width = viewport.width;
        bgCanvas.height = viewport.height;
        drawingCanvas.width = viewport.width;
        drawingCanvas.height = viewport.height;

        const bgCtx = bgCanvas.getContext('2d');
        const drawingCtx = drawingCanvas.getContext('2d');
        if (!bgCtx || !drawingCtx) return;

        // Render PDF page to background canvas
        // FIX: The pdf.js render method in v4+ expects a `canvas` property instead of `canvasContext`.
        await page.render({ canvas: bgCanvas, viewport }).promise;

        // Restore annotations for this page
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        if (annotationsByPage.current[pageNumber]) {
            const img = new Image();
            img.onload = () => drawingCtx.drawImage(img, 0, 0);
            img.src = annotationsByPage.current[pageNumber];
        }
        setIsLoading(false);
    }, [pdfDoc]);
    
    // Initial file loading
    useEffect(() => {
        const loadFile = async () => {
            setIsLoading(true);
            const isPdf = file.type === 'application/pdf';
            const isImage = file.type.startsWith('image/');
            
            const bgCanvas = bgCanvasRef.current;
            if (!bgCanvas) return;
            const bgCtx = bgCanvas.getContext('2d');
            if (!bgCtx) return;

            if (isPdf) {
                try {
                    const loadingTask = pdfjsLib.getDocument(file.dataUrl);
                    const doc = await loadingTask.promise;
                    setPdfDoc(doc);
                    setTotalPages(doc.numPages);
                    setCurrentPage(1);
                    // Render is triggered by state update
                } catch (error) {
                    console.error('Error loading PDF:', error);
                    alert('Failed to load PDF file.');
                    onClose();
                }
            } else if (isImage) {
                const img = new Image();
                img.onload = () => {
                    bgCanvas.width = img.width;
                    bgCanvas.height = img.height;
                    drawingCanvasRef.current!.width = img.width;
                    drawingCanvasRef.current!.height = img.height;
                    bgCtx.drawImage(img, 0, 0);
                    setIsLoading(false);
                };
                img.src = file.dataUrl;
            } else {
                alert('This file type cannot be edited.');
                onClose();
            }
        };
        loadFile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);
    
    useEffect(() => {
        if(pdfDoc) {
            renderPage(currentPage);
        }
    }, [pdfDoc, currentPage, renderPage]);

    const getMousePos = (canvas: HTMLCanvasElement, evt: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const touch = (evt as TouchEvent).touches?.[0];
        const clientX = touch ? touch.clientX : (evt as MouseEvent).clientX;
        const clientY = touch ? touch.clientY : (evt as MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const draw = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        const canvas = drawingCanvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        const pos = getMousePos(canvas, e);
        
        ctx.beginPath();
        ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if(tool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = lineWidth * 4; // Make eraser bigger
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }
        
        ctx.stroke();
        lastPos.current = pos;
    }, [color, lineWidth, tool]);

    const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
        isDrawing.current = true;
        lastPos.current = getMousePos(drawingCanvasRef.current!, e);
    }, []);

    const stopDrawing = useCallback(() => {
        if (!isDrawing.current) return;
        isDrawing.current = false;
        lastPos.current = null;
        // Save annotation for current PDF page
        if(pdfDoc) {
            annotationsByPage.current[currentPage] = drawingCanvasRef.current!.toDataURL('image/png');
        }
    }, [pdfDoc, currentPage]);

    useEffect(() => {
        const canvas = drawingCanvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        
        canvas.addEventListener('touchstart', startDrawing);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseleave', stopDrawing);
            
            canvas.removeEventListener('touchstart', startDrawing);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopDrawing);
        };
    }, [startDrawing, draw, stopDrawing]);

    const handleSave = async () => {
        setIsSaving(true);
        let finalDataUrl = '';

        if (pdfDoc) {
            const pdfBytes = base64ToUint8Array(file.dataUrl);
            const newPdf = await PDFDocument.load(pdfBytes);
            
            for (const pageNumStr in annotationsByPage.current) {
                const pageNum = parseInt(pageNumStr, 10);
                const page = newPdf.getPages()[pageNum - 1];
                const annotationDataUrl = annotationsByPage.current[pageNum];
                const annotationBytes = await fetch(annotationDataUrl).then(res => res.arrayBuffer());
                const annotationImage = await newPdf.embedPng(annotationBytes);
                
                page.drawImage(annotationImage, {
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight(),
                });
            }
            const newPdfBytes = await newPdf.save();
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            finalDataUrl = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target!.result as string);
                reader.readAsDataURL(blob);
            });

        } else { // Image
            const bgCanvas = bgCanvasRef.current!;
            const drawingCanvas = drawingCanvasRef.current!;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = bgCanvas.width;
            tempCanvas.height = bgCanvas.height;
            const ctx = tempCanvas.getContext('2d')!;
            ctx.drawImage(bgCanvas, 0, 0);
            ctx.drawImage(drawingCanvas, 0, 0);
            finalDataUrl = tempCanvas.toDataURL(file.type);
        }

        onSave({ ...file, name: fileName, dataUrl: finalDataUrl });
        setIsSaving(false);
    };

    const nameInputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if(isEditingName) {
            nameInputRef.current?.focus();
            nameInputRef.current?.select();
        }
    }, [isEditingName]);

    return (
        <div className="fixed inset-0 z-[60] bg-slate-100 dark:bg-slate-900 flex flex-col animate-fade-in text-slate-800 dark:text-slate-200">
            {/* Header */}
            <header className="flex-shrink-0 h-16 bg-white/80 dark:bg-slate-800/50 backdrop-blur-md border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors" aria-label="Close editor">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414L8 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L6.586 10 3.293 6.707a1 1 0 011.414-1.414L8 8.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={fileName}
                            onChange={e => setFileName(e.target.value)}
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={e => e.key === 'Enter' && setIsEditingName(false)}
                            className="bg-transparent font-semibold text-slate-800 dark:text-white focus:outline-none ring-2 ring-violet-500 rounded px-2 py-1"
                        />
                    ) : (
                        <h2 onDoubleClick={() => setIsEditingName(true)} className="font-semibold text-slate-800 dark:text-white truncate cursor-pointer" title="Double-click to rename">{fileName}</h2>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-md bg-gradient-to-r from-cyan-500 to-violet-500 text-white dark:text-slate-900 font-semibold transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isSaving ? 'Saving...' : 'Save & Close'}
                    </button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex-shrink-0 h-14 bg-white dark:bg-slate-900 flex items-center justify-center px-4 gap-4 z-10 shadow-md">
                <button onClick={() => setTool('pen')} className={`p-2 rounded-full transition-colors ${tool === 'pen' ? 'bg-violet-500 text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`} aria-label="Pen Tool">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                </button>
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 bg-transparent border-none cursor-pointer" aria-label="Color Picker"/>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Size:</span>
                    <input type="range" min="1" max="50" value={lineWidth} onChange={e => setLineWidth(parseInt(e.target.value, 10))} className="w-24" aria-label="Line Width"/>
                </div>
            </div>

            {/* Canvas Area */}
            <main className="flex-1 bg-slate-200 dark:bg-slate-950 overflow-auto flex items-center justify-center p-4 relative">
                {(isLoading) && <div className="text-slate-500 dark:text-slate-400 animate-pulse">Loading document...</div>}
                <div className={`relative transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                    <canvas ref={bgCanvasRef} className="absolute top-0 left-0"></canvas>
                    <canvas ref={drawingCanvasRef} className="relative z-10 cursor-crosshair"></canvas>
                </div>
            </main>

            {/* Footer / Pagination */}
            {pdfDoc && totalPages > 1 && (
                <footer className="flex-shrink-0 h-12 bg-white dark:bg-slate-900 flex items-center justify-center gap-4 text-sm z-10 border-t border-slate-200 dark:border-white/10">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414L8 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L6.586 10 3.293 6.707a1 1 0 011.414-1.414L8 8.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                     <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                </footer>
            )}
        </div>
    );
};

export default FileEditorModal;