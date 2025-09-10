
import React, { useState } from 'react';
import type { ProcessedFile } from '../types';
import { XIcon, SendIcon } from './icons';
import { formatBytes } from '../services/utils';

interface ImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    fileData: { file: ProcessedFile; messageId: string | null } | null;
    onResend: (file: ProcessedFile, prompt: string) => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ isOpen, onClose, fileData, onResend }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen || !fileData) return null;

    const { file } = fileData;
    const imageUrl = `data:${file.mimeType};base64,${file.content}`;

    const handleResend = () => {
        if (prompt.trim()) {
            onResend(file, prompt);
            setPrompt('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
            <div className="bg-black border border-neutral-700 text-white shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] rounded-none">
                <div className="flex justify-between items-center p-2 border-b border-neutral-700">
                    <div className="font-mono text-sm">
                        {file.path} ({formatBytes(file.size)})
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-700 rounded-none">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-2 flex-grow overflow-auto flex justify-center items-center">
                    <img src={imageUrl} alt={file.path} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="p-2 border-t border-neutral-700">
                    <div className="flex items-center space-x-1">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={`Ask a question about ${file.path}...`}
                            className="flex-grow bg-white text-black rounded-none p-2 text-sm focus:outline-none focus:ring-0"
                            onKeyDown={(e) => e.key === 'Enter' && handleResend()}
                        />
                        <button onClick={handleResend} disabled={!prompt.trim()} className="bg-white hover:bg-black text-black hover:text-white disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed p-2 rounded-none transition-colors">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageViewer;