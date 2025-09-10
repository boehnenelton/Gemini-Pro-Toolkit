import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ProcessedFile, Settings, ProjectFile } from '../types';
import { XIcon, TrashIcon, UploadIcon, EyeIcon } from './icons';
import { fileToBase64, getMimeTypeFromPath } from '../services/utils';

interface AttachmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateAttachments: (files: ProcessedFile[]) => void;
    currentFiles: ProcessedFile[];
    settings: Settings;
    onSettingsChange: React.Dispatch<React.SetStateAction<Settings>>;
    projectFiles: ProjectFile[];
    onUpdateProjectFiles: React.Dispatch<React.SetStateAction<ProjectFile[]>>;
    onFileView: (file: ProjectFile, messageId: string | null, isProjectFile: boolean) => void;
}

interface FileSlot {
    id: number;
    file: ProcessedFile | null;
    enabled: boolean;
}

const AttachmentModal: React.FC<AttachmentModalProps> = (props) => {
    const { 
        isOpen, onClose, onUpdateAttachments, currentFiles, 
        settings, onSettingsChange, projectFiles, onUpdateProjectFiles,
        onFileView
    } = props;
    
    const [selectedProjectFileIds, setSelectedProjectFileIds] = useState<string[]>([]);
    
    const createInitialSlots = (): FileSlot[] => {
        const slots: FileSlot[] = [
            { id: 1, file: null, enabled: false },
            { id: 2, file: null, enabled: false },
            { id: 3, file: null, enabled: false },
        ];
        // Filter out project files from currentFiles to only populate temporary slots
        const tempFiles = currentFiles.filter(cf => !projectFiles.some(pf => pf.path === cf.path && pf.content === cf.content));
        tempFiles.forEach((file, index) => {
            if (index < 3) {
                slots[index].file = file;
                slots[index].enabled = true;
            }
        });
        return slots;
    };
    
    const [slots, setSlots] = useState<FileSlot[]>(createInitialSlots);
    const tempFileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
    const projectFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setSlots(createInitialSlots());
            // Pre-select project files that are already in the main attachment list
            const currentProjectFileIds = currentFiles
                .map(cf => projectFiles.find(pf => pf.path === cf.path && pf.content === cf.content)?.id)
                .filter((id): id is string => id !== undefined);
            setSelectedProjectFileIds(currentProjectFileIds);
        }
    }, [isOpen, currentFiles, projectFiles]);

    if (!isOpen) return null;

    const handleTempFileChange = async (event: React.ChangeEvent<HTMLInputElement>, slotId: number) => {
        const file = event.target.files?.[0];
        if (file) {
            const content = await fileToBase64(file);
            const processedFile: ProcessedFile = {
                path: file.name,
                content: content,
                size: file.size,
                mimeType: file.type || getMimeTypeFromPath(file.name),
            };
            setSlots(prev => prev.map(s => s.id === slotId ? { ...s, file: processedFile, enabled: true } : s));
        }
    };
    
    const handleProjectFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const newProjectFiles: ProjectFile[] = await Promise.all(
                Array.from(files).map(async (file) => {
                    const content = await fileToBase64(file);
                    return {
                        id: uuidv4(),
                        version: 1,
                        path: file.name,
                        content: content,
                        size: file.size,
                        mimeType: file.type || getMimeTypeFromPath(file.name),
                    };
                })
            );
            onUpdateProjectFiles(prev => [...prev, ...newProjectFiles]);
        }
    };

    const handleRemoveTempFile = (slotId: number) => {
         setSlots(prev => prev.map(s => s.id === slotId ? { ...s, file: null, enabled: false } : s));
    };

    const handleRemoveProjectFile = (fileId: string) => {
        onUpdateProjectFiles(prev => prev.filter(pf => pf.id !== fileId));
        setSelectedProjectFileIds(prev => prev.filter(id => id !== fileId));
    };

    const handleToggleTempEnabled = (slotId: number) => {
        setSlots(prev => prev.map(s => s.id === slotId ? { ...s, enabled: !s.enabled } : s));
    };

    const handleToggleProjectSelected = (fileId: string) => {
        setSelectedProjectFileIds(prev => 
            // FIX: Correctly reference fileId instead of an undefined 'id'.
            prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
        );
    };

    const handlePersistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onSettingsChange(prev => ({ ...prev, persistAttachments: e.target.checked }));
    };

    const handleDone = () => {
        const activeTempFiles = slots.filter(s => s.enabled && s.file).map(s => s.file!);
        const activeProjectFiles = projectFiles.filter(pf => selectedProjectFileIds.includes(pf.id));
        onUpdateAttachments([...activeTempFiles, ...activeProjectFiles]);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white border border-neutral-300 text-black shadow-xl w-full max-w-2xl relative rounded-none flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-2 border-b border-neutral-200 flex-shrink-0">
                    <h2 className="text-lg font-bold">Manage Attachments</h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-200 rounded-none">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto">
                    {/* Temporary Attachments */}
                    <div className="p-2">
                        <h3 className="font-bold text-sm mb-1">Temporary Attachments</h3>
                        <div className="space-y-1">
                            {slots.map((slot, index) => (
                                <div key={slot.id} className="flex items-center space-x-2 border border-neutral-300 p-1">
                                    <input type="checkbox" checked={slot.enabled} onChange={() => handleToggleTempEnabled(slot.id)} disabled={!slot.file} className="h-4 w-4 rounded-none accent-black"/>
                                    <div className="flex-grow">
                                        {slot.file ? (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-mono truncate" title={slot.file.path}>{slot.file.path}</span>
                                                <button onClick={() => handleRemoveTempFile(slot.id)} className="p-1 text-neutral-500 hover:text-red-600">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => tempFileInputRefs[index].current?.click()} className="w-full text-left text-sm text-neutral-500 p-1 hover:bg-neutral-100">
                                                Click to attach a file...
                                            </button>
                                        )}
                                    </div>
                                    <input type="file" ref={tempFileInputRefs[index]} onChange={(e) => handleTempFileChange(e, slot.id)} className="hidden" />
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {/* Project Files */}
                    <div className="p-2 border-t border-neutral-200">
                        <div className="flex justify-between items-center mb-1">
                             <h3 className="font-bold text-sm">Project Files</h3>
                             <button onClick={() => projectFileInputRef.current?.click()} className="flex items-center text-xs bg-neutral-200 hover:bg-neutral-300 text-black font-bold py-1 px-2 rounded-none">
                                <UploadIcon className="w-4 h-4 mr-1"/>
                                Import
                             </button>
                             <input type="file" multiple ref={projectFileInputRef} onChange={handleProjectFileImport} className="hidden" />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1 border border-neutral-300 p-1">
                            {projectFiles.length > 0 ? projectFiles.map(pf => (
                               <div key={pf.id} className="flex items-center space-x-2 bg-neutral-100 p-1">
                                    <input type="checkbox" checked={selectedProjectFileIds.includes(pf.id)} onChange={() => handleToggleProjectSelected(pf.id)} className="h-4 w-4 rounded-none accent-black"/>
                                    <div className="flex-grow flex items-center justify-between text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-mono truncate" title={pf.path}>{pf.path}</span>
                                            <span className="text-xs bg-neutral-300 px-1 font-bold">v{pf.version}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <button onClick={() => onFileView(pf, null, true)} className="p-1 text-neutral-600 hover:text-black">
                                                <EyeIcon className="w-4 h-4"/>
                                            </button>
                                            <button onClick={() => handleRemoveProjectFile(pf.id)} className="p-1 text-neutral-500 hover:text-red-600">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                               </div>
                            )) : <p className="text-sm text-neutral-500 text-center py-4">No project files. Import to get started.</p>}
                        </div>
                    </div>

                </div>

                <div className="p-2 border-t border-neutral-200 flex justify-between items-center flex-shrink-0">
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={settings.persistAttachments} onChange={handlePersistChange} className="h-4 w-4 rounded-none accent-black" />
                        <span>Persist Attachments</span>
                    </label>
                    <button onClick={handleDone} className="bg-black text-white font-bold py-1 px-4 rounded-none">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttachmentModal;