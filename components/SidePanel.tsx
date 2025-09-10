import React, { useState } from 'react';
import type { Message, Settings, ProcessedFile, SessionData } from '../types';
import { XIcon, DownloadIcon, UploadIcon, PencilIcon, EyeIcon, ArchiveIcon } from './icons';
import { exportSessionAsZip, importSessionFromZip } from '../services/zipService';
import { formatBytes } from '../services/utils';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    onNewAppSession: () => void;
    onSessionImport: (sessionData: SessionData) => void;
    messages: Message[];
    settings: Settings;
    onFileView: (file: ProcessedFile, messageId: string | null, isProjectFile: boolean) => void;
    onEditMessage: (message: Message) => void;
    appSessionId: string | null;
}

const SidePanel: React.FC<SidePanelProps> = (props) => {
    const { isOpen, onClose, onNewAppSession, onSessionImport, messages, settings, onFileView, onEditMessage, appSessionId } = props;
    
    const [activeTab, setActiveTab] = useState('files');
    const [selectedMessageId, setSelectedMessageId] = useState<string>('last');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    const handleExport = () => {
        if (appSessionId) {
            exportSessionAsZip(messages, settings, appSessionId);
        }
    };
    
    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const sessionData = await importSessionFromZip(file);
                onSessionImport(sessionData);
                onClose();
            } catch (error) {
                console.error("Failed to import session:", error);
                alert(`Error importing session: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
    
    const modelMessages = messages.filter(m => m.files && m.files.length > 0);
    const selectedMessage = selectedMessageId === 'last' 
        ? modelMessages[modelMessages.length - 1]
        : messages.find(m => m.id === selectedMessageId);

    const handleFileSelection = (filePath: string) => {
        setSelectedFiles(prev => 
            prev.includes(filePath) ? prev.filter(p => p !== filePath) : [...prev, filePath]
        );
    };

    const downloadFilesAsZip = async (all: boolean) => {
        if (!selectedMessage) return;

        const zip = new JSZip();
        
        const filesToZip = all 
            ? selectedMessage.files || []
            : (selectedMessage.files || []).filter(f => selectedFiles.includes(f.path));
        
        if (filesToZip.length === 0) return;

        filesToZip.forEach(file => {
            zip.file(file.path, file.content, { base64: true });
        });
        
        if (all) {
            zip.file('message.md', selectedMessage.content);
            zip.file('message.txt', selectedMessage.content.replace(/```/g, ''));
        }

        const blob = await zip.generateAsync({type: 'blob'});
        saveAs(blob, `files_${selectedMessage.id.substring(0, 5)}.zip`);
    };

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-70 z-30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed top-0 left-0 h-full bg-white border-r border-neutral-200 text-black w-80 shadow-xl z-40 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    
                    {/* TOP SECTION */}
                    <div className="flex-shrink-0 p-2 border-b border-neutral-200">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-bold">Panel</h2>
                            <button onClick={onClose} className="p-1 hover:bg-neutral-100 rounded-none">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>
                         <p className="text-xs text-neutral-500 mb-1 font-bold">App Session Management</p>
                        <div className="flex items-center space-x-1">
                            <button onClick={onNewAppSession} className="flex-1 text-center bg-black text-white font-bold py-1 px-2 rounded-none text-sm">
                               New App Session
                            </button>
                            <button onClick={handleExport} title="Export Session" className="p-2 bg-black text-white hover:bg-neutral-800 rounded-none">
                               <DownloadIcon className="w-4 h-4"/>
                            </button>
                            <label className="p-2 bg-black text-white hover:bg-neutral-800 rounded-none cursor-pointer" title="Import Session">
                               <UploadIcon className="w-4 h-4"/>
                               <input type="file" accept=".zip" className="hidden" onChange={handleImport} />
                            </label>
                        </div>
                    </div>

                    {/* BOTTOM SECTION - SCROLLABLE */}
                    <div className="flex flex-col flex-grow overflow-hidden">
                        <div className="flex-shrink-0 border-b border-neutral-200 p-2">
                             <div className="flex">
                                <button onClick={() => setActiveTab('files')} className={`flex-1 p-1 text-sm font-bold ${activeTab === 'files' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'} rounded-none`}>History & Files</button>
                                <button onClick={() => setActiveTab('session')} className={`flex-1 p-1 text-sm font-bold ${activeTab === 'session' ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100'} rounded-none`}>Session Log</button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto">
                            {activeTab === 'files' && (
                                <div className="p-2 space-y-2">
                                    <select value={selectedMessageId} onChange={e => setSelectedMessageId(e.target.value)} className="w-full p-1 bg-white text-black text-xs rounded-none border border-neutral-300">
                                        <option value="last">Last Message w/ Files</option>
                                        {messages.map((msg, idx) => (
                                            <option key={msg.id} value={msg.id}>
                                                {idx + 1}: {msg.role} - {msg.content.substring(0, 30)}...
                                            </option>
                                        ))}
                                    </select>
                                    
                                    <div className="space-y-1 text-xs">
                                        {selectedMessage?.files?.map(file => (
                                            <div key={file.path} className="flex items-center bg-neutral-100 border border-neutral-200 p-1">
                                                <input type="checkbox" checked={selectedFiles.includes(file.path)} onChange={() => handleFileSelection(file.path)} className="mr-2 h-3 w-3 rounded-none accent-black" />
                                                <span className="truncate font-mono flex-1" title={file.path}>{file.path}</span>
                                                <button onClick={() => onFileView(file, selectedMessage.id, false)} className="p-1 hover:bg-neutral-200 ml-1 rounded-none">
                                                     <EyeIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {(!selectedMessage || !selectedMessage.files || selectedMessage.files.length === 0) && (
                                            <div className="text-neutral-500 text-center py-4 text-xs">No files in selected message.</div>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        <button onClick={() => downloadFilesAsZip(false)} disabled={selectedFiles.length === 0} className="flex-1 flex items-center justify-center text-xs bg-black text-white p-1 rounded-none hover:bg-neutral-800 disabled:opacity-50">
                                            <ArchiveIcon className="w-3 h-3 mr-1"/> Zip Selected
                                        </button>
                                        <button onClick={() => downloadFilesAsZip(true)} disabled={!selectedMessage?.files || selectedMessage.files.length === 0} className="flex-1 flex items-center justify-center text-xs bg-black text-white p-1 rounded-none hover:bg-neutral-800 disabled:opacity-50">
                                            <DownloadIcon className="w-3 h-3 mr-1"/> Zip All
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'session' && (
                                <div className="p-2">
                                    <ul className="space-y-1">
                                        {messages.map(msg => (
                                            <li key={msg.id} className="bg-neutral-100 border border-neutral-200 p-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-xs text-neutral-800 flex-grow pr-1">
                                                        <strong className="capitalize">{msg.role}: </strong>
                                                        <span className="line-clamp-2">{msg.content.startsWith('API ERROR') ? <span className="text-red-500">{msg.content}</span> : msg.content}</span>
                                                    </p>
                                                    <button onClick={() => onEditMessage(msg)} className="p-1 hover:bg-neutral-200 flex-shrink-0 rounded-none">
                                                        <PencilIcon className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SidePanel;