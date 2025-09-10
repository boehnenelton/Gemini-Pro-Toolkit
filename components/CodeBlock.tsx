
import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
    language: string;
    filePath?: string;
    children: React.ReactNode;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, filePath, children }) => {
    const [isCopied, setIsCopied] = useState(false);
    const codeString = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(codeString);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    return (
        <div className="bg-neutral-900 my-1 rounded-none text-left">
            <div className="flex justify-between items-center px-2 py-1 bg-neutral-700 text-xs text-white">
                <div className="flex items-center space-x-2">
                    <span className="text-neutral-300">{language}</span>
                    {filePath && <span className="text-blue-400 font-mono">{filePath}</span>}
                </div>
                <button onClick={handleCopy} className="text-neutral-300 hover:text-white text-xs">
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <SyntaxHighlighter
                children={codeString}
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                customStyle={{ margin: 0, padding: '0.5rem', background: '#1E1E1E' }}
                codeTagProps={{ style: { fontFamily: 'monospace' } }}
            />
        </div>
    );
};

export default CodeBlock;