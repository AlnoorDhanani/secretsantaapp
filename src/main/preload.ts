/**
 * Electron Preload Script
 *
 * Exposes safe APIs to the renderer process via contextBridge.
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * File operations API exposed to renderer
 */
const fileApi = {
  /**
   * Open a .secretsanta file
   */
  open: () => ipcRenderer.invoke('file:open'),

  /**
   * Save to a .secretsanta file
   */
  save: (data: unknown, filePath?: string) =>
    ipcRenderer.invoke('file:save', { data, filePath }),

  /**
   * Save as a new .secretsanta file
   */
  saveAs: (data: unknown) => ipcRenderer.invoke('file:saveAs', { data }),

  /**
   * Import participants from CSV
   */
  importCsv: () => ipcRenderer.invoke('file:importCsv'),
};

/**
 * SMS operations API exposed to renderer (local dev only)
 */
const smsApi = {
  /**
   * Send an SMS message via Twilio
   * @param to - Recipient phone number in E.164 format
   * @param body - Message body
   */
  send: (to: string, body: string) => ipcRenderer.invoke('sms:send', { to, body }),

  /**
   * Get SMS configuration status
   */
  getStatus: () => ipcRenderer.invoke('sms:status'),
};

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  file: fileApi,
  sms: smsApi,
});

// Type declarations for renderer
export type ElectronAPI = {
  file: typeof fileApi;
  sms: typeof smsApi;
};
