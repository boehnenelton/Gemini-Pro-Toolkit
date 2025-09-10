
import React, { useState } from 'react';
import type { Message } from '../types';
import { XIcon, SaveIcon } from './icons';

interface MessageEditorProps {
    message: Message;
    onSave: (editedContent: string) => void;
    onCancel: () => void;
}

const MessageEditor: React.FC<MessageEditorProps> = ({ message, onSave, onCancel }) => {
    const [content, setContent] = useState(message.content);

    const handleSave = () => {
        onSave(content);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white border border-neutral-300 text-black shadow-xl w-full max-w-3xl flex flex-col max-h-[90vh] rounded-none">
                <div className="flex justify-between items-center p-2 border-b border-neutral-200">
                    <h2 className="text-xl font-bold">Edit Message</h2>
                    <button onClick={onCancel} className="p-1 hover:bg-neutral-200 rounded-none">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-2 flex-grow overflow-y-auto">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full h-full bg-white text-black border border-neutral-300 rounded-none p-2 text-sm font-mono resize-none"
                        rows={20}
                    />
                </div>
                <div className="flex justify-end p-2 border-t border-neutral-200 space-x-2">
                    <button
                        onClick={onCancel}
                        className="bg-neutral-200 hover:bg-neutral-300 text-black font-bold py-1 px-3 rounded-none"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-black hover:bg-neutral-800 text-white font-bold py-1 px-3 rounded-none flex items-center transition-colors"
                    >
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MessageEditor;