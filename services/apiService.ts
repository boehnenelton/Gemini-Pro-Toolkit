import { GoogleGenAI, GenerateContentResponse, Modality, Part, Content } from "@google/genai";
import type { Message, Settings } from '../types';
import { isImageMimeType } from './utils';

export const generateContent = async (
    history: Message[],
    newMessage: Message,
    settings: Settings
): Promise<GenerateContentResponse> => {
    
    if (!settings.apiKey) {
      throw new Error("API Key not provided. Please set it in the application settings.");
    }
    
    const ai = new GoogleGenAI({ apiKey: settings.apiKey });
    const modelToUse = settings.model;

    const userMessageParts: Part[] = [{ text: newMessage.content }];
    if (newMessage.files) {
        for (const file of newMessage.files) {
            if(isImageMimeType(file.mimeType)) {
                userMessageParts.push({
                    inlineData: {
                        data: file.content,
                        mimeType: file.mimeType,
                    },
                });
            }
        }
    }

    const config: any = {
        temperature: settings.temperature,
        topK: settings.topK,
        topP: settings.topP,
    };

    if (settings.systemInstruction) {
        config.systemInstruction = settings.systemInstruction;
    }

    let contents: Content[] | { parts: Part[] };

    if (modelToUse === 'gemini-2.5-flash-image-preview') {
        config.responseModalities = [Modality.IMAGE, Modality.TEXT];
        delete config.temperature;
        delete config.topK;
        delete config.topP;
        delete config.systemInstruction;
        contents = { parts: userMessageParts };
    } else {
        const conversationHistory: Content[] = history.map(msg => {
            const parts: Part[] = [{ text: msg.content }];
            if (msg.files) {
                msg.files.forEach(file => {
                    if (isImageMimeType(file.mimeType)) {
                        parts.push({
                            inlineData: { data: file.content, mimeType: file.mimeType }
                        });
                    }
                });
            }
            return { role: msg.role, parts };
        });
        
        contents = [
            ...conversationHistory,
            { role: 'user', parts: userMessageParts }
        ];
    }

    const request = {
        model: modelToUse,
        contents,
        config,
    };

    try {
        const response = await ai.models.generateContent(request);
        return response;
    } catch (error) {
        console.error("API call failed:", error);
         if (error instanceof Error && error.message.includes('API key not valid')) {
            throw new Error('Your API key is not valid. Please check it in the settings.');
        }
        throw error;
    }
};
