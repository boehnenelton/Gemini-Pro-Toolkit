import React from 'react';
import type { AppStatus } from '../types';
import { LoadingSpinnerIcon } from './icons';

interface StatusBarProps {
    status: AppStatus;
    errorMessage: string | null;
    successMessage: string | null;
    onNewChat: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, errorMessage, successMessage, onNewChat }) => {
    const getStatusContent = () => {
        switch (status) {
            case 'sending':
                return (
                    <div className="flex items-center text-yellow-300">
                        <LoadingSpinnerIcon className="w-3 h-3 mr-2 animate-spin" />
                        <span>Sending...</span>
                    </div>
                );
            case 'success':
                return <span className="text-green-400">{successMessage || 'Ready.'}</span>;
            case 'error':
                return <span className="text-red-400 truncate" title={errorMessage || ''}>Error: {errorMessage}</span>;
            case 'idle':
            default:
                return <span>Ready.</span>;
        }
    };

    return (
        <div className="flex items-center justify-between text-xs px-2 py-0 bg-black border-t border-neutral-700 text-white">
            <div className="flex-1 min-w-0">{getStatusContent()}</div>
            <button onClick={onNewChat} className="ml-2 px-2 text-xs rounded-none bg-neutral-700 hover:bg-neutral-600 text-white">
                New Chat
            </button>
        </div>
    );
};

export default StatusBar;