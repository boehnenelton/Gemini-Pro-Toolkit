
import React, { useState } from 'react';

interface CodeBlockProps {
    language: string;
    filePath?: string;
    children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, filePath, children }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = () => {
        if (typeof children === 'string') {
            navigator.clipboard.writeText(children);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };
    
    const codeString = children as string;

    return (
        <div className="bg-neutral-900 my-1 rounded-none">
            <div className="flex justify-between items-center px-2 py-1 bg-neutral-700 text-xs">
                <div className="flex items-center space-x-2">
                    <span className="text-neutral-300">{language}</span>
                    {filePath && <span className="text-blue-400 font-mono">{filePath}</span>}
                </div>
                <button onClick={handleCopy} className="text-neutral-300 hover:text-white text-xs">
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="p-2 text-sm overflow-x-auto">
                <code className="rounded-none">{codeString}</code>
            </pre>
        </div>
    );
};

export default CodeBlock;