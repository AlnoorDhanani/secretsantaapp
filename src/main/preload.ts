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

// Expose APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  file: fileApi,
});

// Type declarations for renderer
export type ElectronAPI = {
  file: typeof fileApi;
};
