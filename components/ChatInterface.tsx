import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import CodeBlock from './CodeBlock';
import { PaperclipIcon, SendIcon, LoadingSpinnerIcon, CopyIcon } from './icons';
import type { Message, ProcessedFile, AppStatus, Settings } from '../types';
import { AVAILABLE_MODELS } from '../constants';

interface ChatInterfaceProps {
    messages: Message[];
    userMessages: Message[]; // We need the user messages to display them in conversation mode
    onSendMessage: (prompt: string, files: ProcessedFile[]) => void;
    status: AppStatus;
    settings: Settings;
    onSettingsChange: React.Dispatch<React.SetStateAction<Settings>>;
    attachedFiles: ProcessedFile[];
    onAttachmentModalOpen: () => void;
    chatSessionId: string;
    onNewChat: () => void;
}

const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown
        children={content}
        remarkPlugins={[remarkGfm]}
        components={{
            // FIX: The `inline` prop is not available in some versions of react-markdown's types.
            // The logic is simplified to check for a language match, which is sufficient to identify code blocks.
            code({ node, className, children, ...props }) {
                const match = /language-(\w+)(?:[:\s]([\w./-]+))?/.exec(className || '');
                if (match) {
                    const language = match[1];
                    const filePath = match[2];
                    return (
                        <CodeBlock language={language} filePath={filePath}>
                            {String(children).replace(/\n$/, '')}
                        </CodeBlock>
                    );
                }
                return (
                    <code className="bg-neutral-200 text-black px-1 rounded-none font-mono text-xs" {...props}>
                        {children}
                    </code>
                );
            },
            p: ({node, ...props}) => <p className="mb-2" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
            li: ({node, ...props}) => <li className="ml-4" {...props} />,
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-2 border-b border-black" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-bold mb-2 border-b border-black" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold mb-2" {...props} />,
        }}
    />
);

const ChatInterface: React.FC<ChatInterfaceProps> = (props) => {
    const { messages, userMessages, onSendMessage, status, settings, onSettingsChange, attachedFiles, onAttachmentModalOpen, chatSessionId, onNewChat } = props;
    const [prompt, setPrompt] = useState('');
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (settings.conversationMode) {
            scrollToBottom();
        }
    }, [messages, settings.conversationMode]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim() || attachedFiles.length > 0) {
            onSendMessage(prompt, attachedFiles);
            setPrompt('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
    };

    const handleSelectMessage = (id: string) => {
        setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
    };
    
    const handleExport = (format: 'md' | 'txt') => {
        const allMessages = [...userMessages, ...messages];
        const content = selectedMessageIds.map(id => {
            const msg = allMessages.find(m => m.id === id);
            if (!msg) return '';
            const header = `${msg.role.toUpperCase()} (${new Date(msg.timestamp).toLocaleString()})`;
            return `${header}\n-----------------\n${msg.content}`;
        }).join('\n\n');

        const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `export_${Date.now()}.${format}`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const renderMessage = (message: Message) => {
        const isUser = message.role === 'user';
        const isSystem = message.role === 'system';
        const isAlert = !!message.isAlert;

        const sender = isUser ? 'YOU' : isSystem ? 'SYSTEM' : 'GEMINI';
        const timestamp = new Date(message.timestamp).toLocaleTimeString();
        
        return (
            <div key={message.id} className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`w-full text-left font-mono text-sm py-1 ${isUser ? 'text-right' : ''}`}>
                    <div className={`flex items-center space-x-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {isAlert ? (
                             <div className="w-4 h-4"/>
                        ) : (
                            <input 
                                type="checkbox"
                                checked={selectedMessageIds.includes(message.id)}
                                onChange={() => handleSelectMessage(message.id)}
                                className="h-4 w-4 rounded-none accent-black"
                            />
                        )}

                        <span className={`font-bold ${isAlert ? 'text-red-500' : ''}`}>{sender}</span>
                        <span>({timestamp})</span>
                        <span>-</span>
                        { !isUser && <button onClick={() => handleCopy(message.content)} className="opacity-50 hover:opacity-100"><CopyIcon className="w-4 h-4"/></button> }
                    </div>
                    <div className={`mt-1 ${isAlert ? 'text-red-500' : ''}`}>
                        <MarkdownRenderer content={message.content} />
                    </div>
                </div>
            </div>
        );
    };

    const renderSingleResponse = (message: Message) => {
        return (
            <div className="p-4 font-mono text-sm">
                <div className="flex items-center space-x-2">
                    <span>GEMINI -</span>
                    <span>{new Date(message.timestamp).toLocaleTimeString()} -</span>
                    <span>{message.id}</span>
                    <input 
                        type="checkbox"
                        checked={selectedMessageIds.includes(message.id)}
                        onChange={() => handleSelectMessage(message.id)}
                        className="h-4 w-4 rounded-none accent-black"
                    />
                </div>
                <div className="mt-2">
                    <MarkdownRenderer content={message.content} />
                </div>
            </div>
        );
    }
    
    // Combine and sort messages for conversation mode
    const allMessages = [...userMessages, ...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="flex flex-col h-full bg-white text-black">
            <div className="p-2 border border-black flex-grow overflow-y-auto">
                {settings.conversationMode ? (
                     <div className="flex flex-col-reverse justify-end min-h-full">
                        <div ref={messagesEndRef} />
                        <div className="space-y-2">
                            {allMessages.map(renderMessage)}
                        </div>
                    </div>
                ) : (
                    messages.length > 0 ? renderSingleResponse(messages[0]) : (
                        <div className="h-full flex items-center justify-center text-neutral-400">
                             <p>SEND A MESSAGE TO GET A RESPONSE</p>
                        </div>
                    )
                )}
            </div>

             {/* Hover Footer */}
            <div className="group flex-shrink-0 bg-black text-white">
                <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                     <div className="p-1 px-2 flex justify-between items-center text-xs">
                        <div className="flex items-center space-x-2">
                            <span>Model:</span>
                            <select 
                                value={settings.model} 
                                onChange={(e) => onSettingsChange(s => ({ ...s, model: e.target.value }))}
                                className="bg-white text-black p-0.5 text-xs rounded-none"
                            >
                                {AVAILABLE_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <label className="flex items-center space-x-1">
                                <input type="checkbox" checked={settings.parseCodeBlocks} onChange={e => onSettingsChange(s => ({...s, parseCodeBlocks: e.target.checked}))} className="h-3 w-3 accent-white rounded-none"/>
                                <span>Parse Files</span>
                            </label>
                             <label className="flex items-center space-x-1">
                                <input type="checkbox" checked={settings.conversationMode} onChange={e => onSettingsChange(s => ({...s, conversationMode: e.target.checked}))} className="h-3 w-3 accent-white rounded-none"/>
                                <span>Conversation</span>
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                           <span className="font-mono">Chat Session: {chatSessionId}</span>
                           {settings.conversationMode && (
                                <button onClick={onNewChat} className="bg-white text-black text-xs font-bold px-2 py-0.5 hover:bg-red-500 hover:text-white rounded-none">
                                    New Chat
                                </button>
                           )}
                        </div>
                    </div>
                </div>

                {/* Main Footer */}
                <div className="p-1 border-t border-neutral-700">
                    {selectedMessageIds.length > 0 && (
                        <div className="p-1 text-xs flex justify-end items-center space-x-2">
                            <span>{selectedMessageIds.length} selected</span>
                            <button onClick={() => handleExport('md')} className="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 rounded-none">Export MD</button>
                            <button onClick={() => handleExport('txt')} className="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 rounded-none">Export TXT</button>
                            <button onClick={() => setSelectedMessageIds([])} className="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 rounded-none">Clear</button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex items-start space-x-1">
                        <button type="button" onClick={onAttachmentModalOpen} className="p-2.5 hover:bg-neutral-800 rounded-none relative">
                            <PaperclipIcon className="w-5 h-5 text-white" />
                            {attachedFiles.length > 0 && 
                                <span className="absolute top-0 right-0 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                    {attachedFiles.length}
                                </span>
                            }
                        </button>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message..."
                            rows={2}
                            className="flex-grow bg-white text-black rounded-none p-2 text-sm resize-none focus:outline-none focus:ring-0"
                            disabled={status === 'sending'}
                        />
                        <button type="submit" disabled={status === 'sending' || (!prompt.trim() && attachedFiles.length === 0)} className="p-2.5 bg-black hover:bg-neutral-800 text-white disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed rounded-none transition-colors">
                            {status === 'sending' ? <LoadingSpinnerIcon className="w-5 h-5 animate-spin" /> : <SendIcon className="w-5 h-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;