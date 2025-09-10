import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Components
import Header from './components/Header';
import ChatInterface from './components/ChatInterface';
import StatusBar from './components/StatusBar';
import SettingsModal from './components/SettingsModal';
import AboutAppModal from './components/AboutAppModal';
import AboutSettingsModal from './components/AboutSettingsModal';
import SidePanel from './components/SidePanel';
import ImageViewer from './components/ImageViewer';
import TextViewer from './components/TextViewer';
import MessageEditor from './components/MessageEditor';
import AttachmentModal from './components/AttachmentModal';

// Types
import type { Message, Settings, ProcessedFile, ProjectFile, AppStatus, SessionData } from './types';

// Services & Constants
import { generateContent } from './services/apiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { DEFAULT_SETTINGS } from './constants';
import { parseResponseForFiles } from './services/zipService';
import { getMimeTypeFromPath } from './services/utils';

function App() {
  // State
  const [messages, setMessages] = useLocalStorage<Message[]>('chatMessages', []);
  const [settings, setSettings] = useLocalStorage<Settings>('chatSettings', DEFAULT_SETTINGS);
  const [attachedFiles, setAttachedFiles] = useState<ProcessedFile[]>([]);
  const [projectFiles, setProjectFiles] = useLocalStorage<ProjectFile[]>('projectFiles', []);

  const [appStatus, setAppStatus] = useState<AppStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutAppOpen, setIsAboutAppOpen] = useState(false);
  const [isAboutSettingsOpen, setIsAboutSettingsOpen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [isTextViewerOpen, setIsTextViewerOpen] = useState(false);
  const [isMessageEditorOpen, setIsMessageEditorOpen] = useState(false);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  const [viewingFile, setViewingFile] = useState<{ file: ProcessedFile | ProjectFile, messageId: string | null, isProjectFile: boolean } | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [appSessionId, setAppSessionId] = useState<string>('');
  const [chatSessionId, setChatSessionId] = useState<string>('');
  const [latestSingleResponse, setLatestSingleResponse] = useState<Message | null>(null);

  const generateNewChatSessionId = () => uuidv4().substring(0, 8);

  // Effects
  useEffect(() => {
    setAppSessionId(uuidv4().substring(0, 8).toUpperCase());
    setChatSessionId(generateNewChatSessionId());
  }, []);

  const resetStatus = () => {
    setAppStatus('idle');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setLatestSingleResponse(null);
    setAttachedFiles([]);
    setChatSessionId(generateNewChatSessionId());
    resetStatus();
    setSuccessMessage('New chat started.');
  }, [setMessages]);

  const handleNewAppSession = useCallback(() => {
    handleNewChat();
    setSettings(DEFAULT_SETTINGS);
    setProjectFiles([]);
    setAppSessionId(uuidv4().substring(0, 8).toUpperCase());
    setSuccessMessage('New app session started.');
  }, [handleNewChat, setSettings, setProjectFiles]);
  
  const handleSendMessage = useCallback(async (prompt: string, files: ProcessedFile[]) => {
    if (appStatus === 'sending') return;

    if (!settings.apiKey) {
      setErrorMessage("API Key is not set. Please set it in the settings.");
      setAppStatus('error');
      setIsSettingsOpen(true);
      return;
    }

    if (!settings.conversationMode) {
      setChatSessionId(generateNewChatSessionId());
    }

    resetStatus();
    setAppStatus('sending');

    const combinedPrompt = `${settings.usePrepend ? settings.prependMessage + '\n' : ''}${prompt}${settings.useAppend ? '\n' + settings.appendMessage : ''}`;

    const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: combinedPrompt,
        timestamp: new Date().toISOString(),
        files: files,
    };
    
    const messagesForApi = settings.conversationMode ? [...messages, userMessage] : [userMessage];
    setMessages(messagesForApi);

    if (!settings.persistAttachments) {
        setAttachedFiles([]);
    }
    
    try {
        const history = settings.conversationMode ? messages : [];
        const response = await generateContent(history, userMessage, settings);
        let modelResponseText = '';
        const modelResponseFiles: ProcessedFile[] = [];

        if (settings.model === 'gemini-2.5-flash-image-preview') {
            const parts = response.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                if (part.text) {
                    modelResponseText += part.text;
                } else if (part.inlineData) {
                    const newFile: ProcessedFile = {
                        path: `generated_image_${Date.now()}.${part.inlineData.mimeType.split('/')[1] || 'png'}`,
                        content: part.inlineData.data,
                        mimeType: part.inlineData.mimeType,
                        size: atob(part.inlineData.data).length,
                    };
                    modelResponseFiles.push(newFile);
                }
            }
        } else {
            modelResponseText = response.text;
        }

        if (settings.parseCodeBlocks) {
            const parsedFiles = parseResponseForFiles(modelResponseText);
            parsedFiles.forEach(pf => {
                modelResponseFiles.push({
                    path: pf.path,
                    content: btoa(pf.content),
                    size: pf.content.length,
                    mimeType: getMimeTypeFromPath(pf.path)
                });
            });
        }
        
        const modelMessage: Message = {
            id: uuidv4(),
            role: 'model',
            content: modelResponseText,
            timestamp: new Date().toISOString(),
            files: modelResponseFiles
        };
        
        if (settings.conversationMode) {
            setMessages(prev => [...prev, modelMessage]);
        } else {
            setMessages(prev => [...prev, modelMessage]); // still save to full history
            setLatestSingleResponse(modelMessage);
        }

        setAppStatus('success');
        setSuccessMessage('Response received.');
    } catch (error) {
        const errorMessageContent = error instanceof Error ? error.message : 'An unknown error occurred.';
        const errorAlert: Message = {
            id: uuidv4(),
            role: 'system',
            content: `API ERROR - ${errorMessageContent}`,
            timestamp: new Date().toISOString(),
            isAlert: true
        };

        if (settings.conversationMode) {
          setMessages(prev => [...prev, errorAlert]);
        } else {
          setMessages(prev => [...prev, errorAlert]);
          setLatestSingleResponse(errorAlert);
        }
        
        setAppStatus('error');
        setErrorMessage(errorMessageContent);
    }
  }, [appStatus, settings, messages, setMessages]);

  const onFileView = (file: ProcessedFile | ProjectFile, messageId: string | null, isProjectFile: boolean) => {
    setViewingFile({ file, messageId, isProjectFile });
    if (file.mimeType.startsWith('image/')) {
        setIsImageViewerOpen(true);
    } else {
        setIsTextViewerOpen(true);
    }
  };

  const handleResendWithFile = (file: ProcessedFile, prompt: string) => {
    handleSendMessage(prompt, [file]);
    setIsImageViewerOpen(false);
    setIsTextViewerOpen(false);
  };
  
  const handleSaveMessageFile = (messageId: string, filePath: string, newBase64Content: string) => {
    setMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id === messageId && msg.files) {
        const updatedFiles = msg.files.map(file => {
          if (file.path === filePath) {
            return { ...file, content: newBase64Content, size: atob(newBase64Content).length };
          }
          return file;
        });
        return { ...msg, files: updatedFiles };
      }
      return msg;
    }));
  };

  const handleUpdateProjectFile = (fileId: string, newBase64Content: string) => {
    setProjectFiles(prev => prev.map(pf => {
        if (pf.id === fileId) {
            const updatedFile = {
                ...pf,
                content: newBase64Content,
                size: atob(newBase64Content).length,
                version: pf.version + 1,
            };
            if (viewingFile && 'id' in viewingFile.file && viewingFile.file.id === fileId) {
                setViewingFile({ ...viewingFile, file: updatedFile });
            }
            return updatedFile;
        }
        return pf;
    }));
  };
  
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setIsMessageEditorOpen(true);
  };

  const handleSaveEditedMessage = (editedContent: string) => {
    if (editingMessage) {
      setMessages(messages.map(m => m.id === editingMessage.id ? { ...m, content: editedContent } : m));
    }
    setIsMessageEditorOpen(false);
    setEditingMessage(null);
  };
  
  const handleSessionImport = (sessionData: SessionData) => {
    setSettings(sessionData.settings);
    setMessages(sessionData.messages);
    setSuccessMessage("Session imported successfully.");
  };

  const getIntroMessages = (): Message[] => {
    const introMessages: Message[] = [];
    if (messages.length === 0 && settings.conversationMode) {
      introMessages.push({
          id: 'welcome-msg',
          role: 'system',
          content: 'WELCOME TO GEMINI PROTOOLS. THIS IS THE BEGINNING OF A NEW CHAT.',
          timestamp: new Date().toISOString(),
      });
    }
    if (!settings.apiKey) {
      introMessages.push({
        id: 'api-key-alert',
        role: 'system',
        content: 'API KEY REQUIRED - Please open the settings and enter your Google Gemini API key to begin.',
        timestamp: new Date().toISOString(),
        isAlert: true,
      });
    }
    return introMessages;
  };

  const messagesToDisplay = settings.conversationMode 
    ? [...getIntroMessages(), ...messages] 
    : (latestSingleResponse ? [latestSingleResponse] : []);


  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans">
      <Header 
        onToggleSidePanel={() => setIsSidePanelOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        onAboutOpen={() => setIsAboutAppOpen(true)}
        appSessionId={appSessionId}
      />
      <div className="flex-grow overflow-hidden">
        <ChatInterface 
          messages={messagesToDisplay}
          onSendMessage={handleSendMessage}
          status={appStatus}
          settings={settings}
          onSettingsChange={setSettings}
          attachedFiles={attachedFiles}
          onAttachmentModalOpen={() => setIsAttachmentModalOpen(true)}
          chatSessionId={chatSessionId}
          onNewChat={handleNewChat}
        />
      </div>
      <StatusBar 
        status={appStatus} 
        errorMessage={errorMessage}
        successMessage={successMessage}
        onNewChat={handleNewChat}
      />

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setSettings}
        currentSettings={settings}
        onAboutOpen={() => { setIsSettingsOpen(false); setIsAboutSettingsOpen(true); }}
      />
      <AboutAppModal 
        isOpen={isAboutAppOpen}
        onClose={() => setIsAboutAppOpen(false)}
      />
      <AboutSettingsModal
        isOpen={isAboutSettingsOpen}
        onClose={() => setIsAboutSettingsOpen(false)}
      />
      <SidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        onNewAppSession={handleNewAppSession}
        onSessionImport={handleSessionImport}
        messages={messages}
        settings={settings}
        onFileView={onFileView}
        onEditMessage={handleEditMessage}
        appSessionId={appSessionId}
      />
      <ImageViewer
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        fileData={viewingFile as { file: ProcessedFile, messageId: string | null } | null}
        onResend={handleResendWithFile}
      />
      <TextViewer
        isOpen={isTextViewerOpen}
        onClose={() => setIsTextViewerOpen(false)}
        fileData={viewingFile}
        onSave={handleSaveMessageFile}
        onResend={handleResendWithFile}
        onUpdateProjectFile={handleUpdateProjectFile}
      />
      {editingMessage && (
        <MessageEditor
            message={editingMessage}
            onSave={handleSaveEditedMessage}
            onCancel={() => { setIsMessageEditorOpen(false); setEditingMessage(null); }}
        />
      )}
      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        onUpdateAttachments={setAttachedFiles}
        currentFiles={attachedFiles}
        settings={settings}
        onSettingsChange={setSettings}
        projectFiles={projectFiles}
        onUpdateProjectFiles={setProjectFiles}
        onFileView={onFileView}
      />
    </div>
  );
}

export default App;