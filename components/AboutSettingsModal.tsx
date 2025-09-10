
import React from 'react';
import { XIcon } from './icons';

interface AboutSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AboutSettingsModal: React.FC<AboutSettingsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white border border-neutral-300 text-black shadow-xl w-full max-w-2xl relative flex flex-col max-h-[90vh] rounded-none">
                <div className="flex justify-between items-center p-2 border-b border-neutral-200">
                    <h2 className="text-lg font-bold">About Settings</h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-200 rounded-none">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="space-y-2 text-sm max-h-[70vh] overflow-y-auto p-2">
                    <p><strong>API Key:</strong> Your secret key for accessing the Google Gemini API is read from the `process.env.API_KEY` environment variable for security.</p>
                    <p><strong>Model:</strong> Select the Gemini model to use for generating responses. Different models have different capabilities and costs.</p>
                    <p><strong>System Instruction:</strong> A top-level instruction that guides the model's behavior for the entire conversation. It sets the context, persona, or rules for the AI.</p>
                    <p><strong>Temperature:</strong> Controls randomness. Lower values (e.g., 0.2) make the output more deterministic and focused. Higher values (e.g., 0.9) make it more creative and diverse.</p>
                    <p><strong>Top K:</strong> The model considers the top K most likely tokens at each step of generation. A lower value narrows the choices, making the output less random.</p>
                    <p><strong>Top P:</strong> The model considers tokens from a cumulative probability distribution. A value of 0.95 means it picks from tokens that make up the top 95% of the probability mass. It's an alternative to Top K for controlling randomness.</p>
                    <p><strong>Prepend/Append Message:</strong> Automatically add custom text to the beginning or end of every message you send. Useful for repeating instructions or formatting.</p>
                    <p><strong>Parse Code Blocks:</strong> If enabled, the app will try to find markdown code blocks in the model's response and treat them as files that can be viewed or downloaded.</p>
                    <p><strong>Conversation Mode:</strong> When enabled, previous messages are sent as context. When disabled, each message is treated as a new, independent request (history is still saved).</p>
                </div>
                 <div className="text-center mt-auto p-2 border-t border-neutral-200">
                    <button
                        onClick={onClose}
                        className="bg-black hover:bg-neutral-800 text-white font-bold py-1 px-3 rounded-none transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AboutSettingsModal;