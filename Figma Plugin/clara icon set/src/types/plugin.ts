// Basic plugin types
export interface PluginMessage {
  type: string;
  [key: string]: any;
}

export interface PluginResponse {
  type: string;
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}
