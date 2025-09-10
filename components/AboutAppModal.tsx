import React from 'react';
import { XIcon } from './icons';

interface AboutAppModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutAppModal: React.FC<AboutAppModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white border border-neutral-300 text-black shadow-xl p-4 w-full max-w-md relative rounded-none">
                <button onClick={onClose} className="absolute top-2 right-2 p-1 hover:bg-neutral-200 rounded-none">
                    <XIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold mb-2">About Gemini Protools</h2>
                <div className="text-sm space-y-2 text-neutral-700">
                     <p>Gemini Protools - Version 1</p>
                     <p>Created by: Elton Boehnen</p>
                     <p>Contact: <a href="mailto:boehnenelton2024@gmail.com" className="text-blue-500 hover:underline">boehnenelton2024@gmail.com</a></p>
                     <p>Github: <a href="https://github.com/boehnenelton" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">github.com/boehnenelton</a></p>
                </div>
                <div className="text-center mt-4">
                    <button
                        onClick={onClose}
                        className="bg-black text-white font-bold py-1 px-3 rounded-none"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutAppModal;