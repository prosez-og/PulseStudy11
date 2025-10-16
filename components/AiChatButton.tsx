import React from 'react';

interface AiChatButtonProps {
    onClick: () => void;
}

const AiChatButton: React.FC<AiChatButtonProps> = ({ onClick }) => {
    return (
        <button 
            onClick={onClick} 
            className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shadow-lg transition-transform duration-200 ease-in-out hover:scale-110 focus:outline-none focus:ring-4 focus:ring-violet-500/50"
            aria-label="Open AI Doubt Solver"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.486 2 2 5.589 2 10c0 2.908 1.897 5.515 5 6.934V22l5.34-4.005C17.697 17.852 22 14.32 22 10c0-4.411-4.486-8-10-8zm0 14h-.333L7 19.333V17h-.5c-4.411 0-8-2.691-8-7s3.589-7 8-7 8 2.691 8 7-3.589 7-8 7z"/><path d="M12 6c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4zm0 6c-1.103 0-2-.897-2-2s.897-2 2-2 2 .897 2 2-.897 2-2 2z"/>
            </svg>
        </button>
    )
}

export default AiChatButton;
