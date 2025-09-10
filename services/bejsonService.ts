import type { Settings, Message } from '../types';

export const createConfigBejson = (settings: Settings, sessionId: string): string => {
  const bejson = {
    Format: "BEJson",
    Format_Version: "1-0-4",
    Format_Creator: "Gemini Toolbox",
    Parent_Hierarchy: `session_config_for_${sessionId}`,
    Records_Type: ["AppSetting"],
    Fields: [
      { name: "setting_key", type: "string" },
      { name: "setting_value", type: "string" }
    ],
    Values: Object.entries(settings).map(([key, value]) => ({
      setting_key: key,
      setting_value: JSON.stringify(value),
    })),
  };
  return JSON.stringify(bejson, null, 2);
};

export const createManifestBejson = (messages: Message[], sessionId: string): string => {
  const values: any[] = [];
  
  messages.forEach((msg, index) => {
    values.push({
      record_type: 'Message',
      message_index: index,
      role: msg.role,
      timestamp: msg.timestamp,
      content_path: `messages/message_${index}/content.md`,
      file_path: null,
      file_size: null
    });
    
    if (msg.files) {
      msg.files.forEach(file => {
        values.push({
          record_type: 'File',
          message_index: index,
          role: msg.role,
          timestamp: msg.timestamp,
          content_path: null,
          file_path: `messages/message_${index}/files/${file.path}`,
          file_size: file.size,
        });
      });
    }
  });

  const bejson = {
    Format: "BEJson",
    Format_Version: "1-0-4",
    Format_Creator: "Gemini Toolbox Session Exporter",
    Parent_Hierarchy: sessionId,
    Records_Type: ["Message", "File"],
    Fields: [
      { name: "record_type", type: "string" },
      { name: "message_index", type: "integer" },
      { name: "role", type: "string" },
      { name: "timestamp", type: "string" },
      { name: "content_path", type: "string" },
      { name: "file_path", type: "string" },
      { name: "file_size", type: "integer" },
    ],
    Values: values,
  };

  return JSON.stringify(bejson, null, 2);
};
