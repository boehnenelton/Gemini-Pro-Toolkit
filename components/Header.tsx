import React from 'react';
import { HamburgerIcon, SettingsIcon, InfoIcon } from './icons';

interface HeaderProps {
    onToggleSidePanel: () => void;
    onSettingsOpen: () => void;
    onAboutOpen: () => void;
    appSessionId: string | null;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidePanel, onSettingsOpen, onAboutOpen, appSessionId }) => {
    return (
        <header className="flex items-center justify-between p-1 bg-black text-white shadow-md z-10 border-b border-neutral-700">
            <div className="flex items-center">
                <button onClick={onToggleSidePanel} className="p-2 hover:bg-neutral-700 rounded-none">
                    <HamburgerIcon className="h-5 w-5" />
                </button>
                 <button onClick={onSettingsOpen} className="p-2 hover:bg-neutral-700 rounded-none">
                    <SettingsIcon className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-heading ml-2">Gemini Protools</h1>
            </div>
            <div className="flex items-center text-xs">
                 <button onClick={onAboutOpen} className="p-2 hover:bg-neutral-700 rounded-none">
                    <InfoIcon className="h-5 w-5" />
                </button>
                <span className="font-mono text-white ml-2">App Session:</span>
                <div className="font-mono bg-white text-black px-2 py-1 ml-2 rounded-none font-bold">{appSessionId}</div>
            </div>
        </header>
    );
};

export default Header;