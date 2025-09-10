import React, { useState, useEffect } from 'react';
import type { ProcessedFile, ProjectFile } from '../types';
import { XIcon, SaveIcon, SendIcon } from './icons';
import { formatBytes } from '../services/utils';

interface TextViewerProps {
    isOpen: boolean;
    onClose: () => void;
    fileData: { file: ProcessedFile | ProjectFile; messageId: string | null; isProjectFile: boolean } | null;
    onSave: (messageId: string, filePath: string, newBase64Content: string) => void;
    onResend: (file: ProcessedFile, prompt: string) => void;
    onUpdateProjectFile: (fileId: string, newBase64Content: string) => void;
}

const TextViewer: React.FC<TextViewerProps> = ({ isOpen, onClose, fileData, onSave, onResend, onUpdateProjectFile }) => {
    const [content, setContent] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [prompt, setPrompt] = useState('');

    useEffect(() => {
        if (fileData) {
            try {
                const decodedContent = atob(fileData.file.content);
                setContent(decodedContent);
                setIsDirty(false);
            } catch (e) {
                console.error("Failed to decode base64 content", e);
                setContent("Error: Could not display file content. It may not be valid base64.");
            }
        }
    }, [fileData]);

    if (!isOpen || !fileData) return null;
    
    const { file, messageId, isProjectFile } = fileData;
    const projectFile = isProjectFile ? file as ProjectFile : null;

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        setIsDirty(true);
    };

    const handleMessageFileSave = () => {
        if (messageId && isDirty) {
            const newBase64Content = btoa(content);
            onSave(messageId, file.path, newBase64Content);
            setIsDirty(false);
        }
    };

    const handleProjectFileSave = () => {
        if (projectFile && isDirty) {
            const newBase64Content = btoa(content);
            onUpdateProjectFile(projectFile.id, newBase64Content);
            setIsDirty(false);
        }
    }

    const handleDiscardChanges = () => {
        setContent(atob(file.content));
        setIsDirty(false);
    }

    const handleResend = () => {
        if (prompt.trim()) {
            const currentFileState = { ...file, content: btoa(content), size: new Blob([content]).size };
            onResend(currentFileState, prompt);
            setPrompt('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-40 flex justify-center items-center p-4">
            <div className="bg-black border border-neutral-700 text-white shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] rounded-none">
                <div className="flex justify-between items-center p-2 border-b border-neutral-700">
                    <div className="font-mono text-sm flex items-center space-x-2">
                        <span>{file.path} ({formatBytes(file.size)})</span>
                        {projectFile && <span className="text-xs bg-neutral-700 px-1.5 py-0.5 font-bold">v{projectFile.version}</span>}
                    </div>
                    <div className="flex items-center space-x-2">
                        {isDirty && (
                             <button onClick={handleDiscardChanges} className="text-sm bg-neutral-600 hover:bg-neutral-500 text-white px-3 py-1 rounded-none transition-colors">
                                Discard
                            </button>
                        )}
                        {isProjectFile ? (
                            <button onClick={handleProjectFileSave} disabled={!isDirty} className="flex items-center text-sm bg-white hover:bg-black text-black hover:text-white disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed px-3 py-1 rounded-none transition-colors">
                                <SaveIcon className="w-4 h-4 mr-1" />
                                {isDirty ? `Save (v${projectFile!.version + 1})` : 'Saved'}
                            </button>
                        ) : (
                             messageId && (
                                 <button onClick={handleMessageFileSave} disabled={!isDirty} className="flex items-center text-sm bg-white hover:bg-black text-black hover:text-white disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed px-3 py-1 rounded-none transition-colors">
                                    <SaveIcon className="w-4 h-4 mr-1" />
                                    {isDirty ? 'Save' : 'Saved'}
                                </button>
                            )
                        )}
                        <button onClick={onClose} className="p-1 hover:bg-neutral-700 rounded-none">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="p-2 flex-grow overflow-auto">
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        className="w-full h-full bg-white text-black border border-neutral-600 rounded-none p-2 text-sm font-mono resize-none"
                    />
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

export default TextViewer;
