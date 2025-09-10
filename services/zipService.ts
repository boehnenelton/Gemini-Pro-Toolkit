import JSZip from 'jszip';
import saveAs from 'file-saver';
import type { ProcessedFile, Message, Settings, SessionData } from '../types';
import { fileToBase64, getMimeTypeFromPath } from './utils';
import { createConfigBejson, createManifestBejson } from './bejsonService';

export const decompressZip = async (zipFile: File): Promise<ProcessedFile[]> => {
  const zip = await JSZip.loadAsync(zipFile);
  const processedFiles: ProcessedFile[] = [];

  const filePromises = Object.keys(zip.files).map(async (relativePath) => {
    const file = zip.files[relativePath];
    if (!file.dir) {
      const blob = await file.async('blob');
      const content = await fileToBase64(blob);
      return {
        path: relativePath,
        content: content,
        size: blob.size,
        mimeType: getMimeTypeFromPath(relativePath),
      };
    }
    return null;
  });

  const allFiles = await Promise.all(filePromises);
  return allFiles.filter((file): file is ProcessedFile => file !== null);
};

export const createZip = async (files: { path: string; content: string, isBase64?: boolean }[], zipFileName: string): Promise<void> => {
  const zip = new JSZip();
  files.forEach(file => {
    zip.file(file.path, file.content, { base64: !!file.isBase64 });
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, zipFileName);
};

export const parseResponseForFiles = (content: string): { path: string; content: string }[] => {
  const files: { path: string; content: string }[] = [];
  const codeBlockRegex = /```(\w+)(?:[:\s]([\w./-]+))?\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [, , filePath, code] = match;
    if (filePath) {
      files.push({
        path: filePath.trim(),
        content: code.trim(),
      });
    }
  }
  return files;
};

export const exportSessionAsZip = async (messages: Message[], settings: Settings, appSessionId: string): Promise<void> => {
    const zip = new JSZip();
    
    // Create BEJSON files
    const configBejson = createConfigBejson(settings, appSessionId);
    const manifestBejson = createManifestBejson(messages, appSessionId);
    zip.file('config.bejson', configBejson);
    zip.file('manifest.bejson', manifestBejson);
    
    // Add messages and files
    const messagesFolder = zip.folder('messages');
    if (messagesFolder) {
        messages.forEach((msg, index) => {
            const msgFolder = messagesFolder.folder(`message_${index}`);
            if (msgFolder) {
                msgFolder.file('content.md', msg.content);
                if (msg.files && msg.files.length > 0) {
                    const filesFolder = msgFolder.folder('files');
                    if (filesFolder) {
                        msg.files.forEach(file => {
                            filesFolder.file(file.path, file.content, { base64: true });
                        });
                    }
                }
            }
        });
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `session_${appSessionId}.zip`);
};

export const importSessionFromZip = async (zipFile: File): Promise<SessionData> => {
    const zip = await JSZip.loadAsync(zipFile);

    const configFile = zip.file('config.bejson');
    if (!configFile) throw new Error('config.bejson not found in zip.');
    const configContent = await configFile.async('string');
    const configBejson = JSON.parse(configContent);
    const settings = configBejson.Values.reduce((acc: any, { setting_key, setting_value }: any) => {
        acc[setting_key] = JSON.parse(setting_value);
        return acc;
    }, {});

    const manifestFile = zip.file('manifest.bejson');
    if (!manifestFile) throw new Error('manifest.bejson not found in zip.');
    const manifestContent = await manifestFile.async('string');
    const manifestBejson = JSON.parse(manifestContent);

    const messages: Message[] = [];
    const messageRecords = manifestBejson.Values.filter((v: any) => v.record_type === 'Message');

    for (const record of messageRecords) {
        const contentPath = record.content_path;
        const msgFile = zip.file(contentPath);
        if (!msgFile) throw new Error(`File not found in zip: ${contentPath}`);
        
        const content = await msgFile.async('string');
        const msg: Message = {
            id: record.timestamp + record.message_index,
            role: record.role,
            content,
            timestamp: record.timestamp,
            files: []
        };
        messages[record.message_index] = msg;
    }
    
    const fileRecords = manifestBejson.Values.filter((v: any) => v.record_type === 'File');
    for (const record of fileRecords) {
        const filePath = record.file_path;
        const file = zip.file(filePath);
        if (!file) throw new Error(`File not found in zip: ${filePath}`);

        const base64Content = await file.async('base64');
        const shortPath = filePath.substring(filePath.indexOf('/files/') + 7);
        const processedFile: ProcessedFile = {
            path: shortPath,
            content: base64Content,
            size: record.file_size,
            mimeType: getMimeTypeFromPath(shortPath)
        };
        
        const msg = messages[record.message_index];
        if (msg) {
            if (!msg.files) msg.files = [];
            msg.files.push(processedFile);
        }
    }

    return { settings, messages };
};