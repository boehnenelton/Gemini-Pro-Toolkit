import React, { useState, useEffect } from 'react';
import type { Settings } from '../types';
import { XIcon, InfoIcon, SaveIcon, KeyIcon } from './icons';
import { AVAILABLE_MODELS } from '../constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: Settings) => void;
    currentSettings: Settings;
    onAboutOpen: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings, onAboutOpen }) => {
    const [settings, setSettings] = useState<Settings>(currentSettings);

    useEffect(() => {
        setSettings(currentSettings);
    }, [currentSettings, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setSettings(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number' || type === 'range') {
             setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
        }
        else {
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white border border-neutral-300 text-black shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh] rounded-none">
                <div className="flex justify-between items-center p-2 border-b border-neutral-200">
                    <h2 className="text-xl font-bold">Settings</h2>
                    <div>
                        <button onClick={onAboutOpen} className="p-1 hover:bg-neutral-200 mr-1 rounded-none">
                            <InfoIcon className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-1 hover:bg-neutral-200 rounded-none">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-grow p-2 space-y-2 text-sm">
                    <div>
                        <label className="block mb-1 font-semibold">Google Gemini API Key</label>
                        <div className="relative">
                            <KeyIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="password"
                                name="apiKey"
                                value={settings.apiKey}
                                onChange={handleChange}
                                placeholder="Enter your API Key here"
                                className="w-full p-2 pl-8 bg-white text-black border border-neutral-300 rounded-none"
                            />
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">Your key is stored securely in your browser's local storage and is never sent anywhere else.</p>
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold">Model</label>
                        <select name="model" value={settings.model} onChange={handleChange} className="w-full p-2 bg-white text-black border border-neutral-300 rounded-none">
                            {AVAILABLE_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1 font-semibold">System Instruction</label>
                        <textarea name="systemInstruction" value={settings.systemInstruction} onChange={handleChange} rows={4} className="w-full p-2 bg-white text-black border border-neutral-300 rounded-none font-mono text-xs"></textarea>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                            <label htmlFor="temperature" className="block mb-1 font-semibold">Temperature: {settings.temperature}</label>
                            <input type="range" id="temperature" name="temperature" min="0" max="1" step="0.05" value={settings.temperature} onChange={handleChange} className="w-full accent-black" />
                        </div>
                         <div>
                            <label htmlFor="topK" className="block mb-1 font-semibold">Top K</label>
                            <input type="number" id="topK" name="topK" value={settings.topK} onChange={handleChange} className="w-full p-2 bg-white text-black border border-neutral-300 rounded-none" />
                        </div>
                         <div>
                            <label htmlFor="topP" className="block mb-1 font-semibold">Top P</label>
                            <input type="number" id="topP" min="0" max="1" step="0.01" value={settings.topP} onChange={handleChange} className="w-full p-2 bg-white text-black border border-neutral-300 rounded-none" />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="flex items-center">
                            <input type="checkbox" name="usePrepend" checked={settings.usePrepend} onChange={handleChange} className="mr-2 h-4 w-4 rounded-none accent-black" />
                            Prepend message
                        </label>
                        {settings.usePrepend && <textarea name="prependMessage" value={settings.prependMessage} onChange={handleChange} rows={2} className="w-full p-2 bg-white text-black border border-neutral-300 rounded-none font-mono text-xs" placeholder="Content to prepend..."></textarea>}
                    </div>
                    
                     <div className="space-y-1">
                        <label className="flex items-center">
                            <input type="checkbox" name="useAppend" checked={settings.useAppend} onChange={handleChange} className="mr-2 h-4 w-4 rounded-none accent-black" />
                            Append message
                        </label>
                        {settings.useAppend && <textarea name="appendMessage" value={settings.appendMessage} onChange={handleChange} rows={2} className="w-full p-2 bg-white text-black border border-neutral-300 rounded-none font-mono text-xs" placeholder="Content to append..."></textarea>}
                    </div>

                </div>

                <div className="mt-2 text-right p-2 border-t border-neutral-200">
                    <button onClick={handleSave} className="bg-black hover:bg-neutral-800 text-white font-bold py-1 px-3 rounded-none flex items-center float-right transition-colors">
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
