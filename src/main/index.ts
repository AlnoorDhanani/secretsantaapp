/**
 * Electron Main Process
 *
 * Handles window creation, file dialogs, and IPC communication.
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { sendSMS, getSMSStatus } from './sms'

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Show window when ready to prevent flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers for file operations

/**
 * Open file dialog and read .secretsanta file
 */
ipcMain.handle('file:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Open Secret Santa Draw',
    filters: [
      { name: 'Secret Santa Files', extensions: ['secretsanta'] },
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  const filePath = result.filePaths[0];

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return { success: true, data, filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
    };
  }
});

/**
 * Save file dialog and write .secretsanta file
 */
ipcMain.handle('file:save', async (_event, { data, filePath }) => {
  let targetPath = filePath;

  // If no path provided, show save dialog
  if (!targetPath) {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: 'Save Secret Santa Draw',
      defaultPath: 'draw.secretsanta',
      filters: [
        { name: 'Secret Santa Files', extensions: ['secretsanta'] },
        { name: 'JSON Files', extensions: ['json'] },
      ],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    targetPath = result.filePath;
  }

  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(targetPath, content, 'utf-8');
    return { success: true, filePath: targetPath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save file',
    };
  }
});

/**
 * Show save-as dialog
 */
ipcMain.handle('file:saveAs', async (_event, { data }) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    title: 'Save Secret Santa Draw As',
    defaultPath: 'draw.secretsanta',
    filters: [
      { name: 'Secret Santa Files', extensions: ['secretsanta'] },
      { name: 'JSON Files', extensions: ['json'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true };
  }

  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(result.filePath, content, 'utf-8');
    return { success: true, filePath: result.filePath };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save file',
    };
  }
});

/**
 * Import CSV file
 */
ipcMain.handle('file:importCsv', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Import Participants from CSV',
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, canceled: true };
  }

  try {
    const content = fs.readFileSync(result.filePaths[0], 'utf-8');
    return { success: true, content };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read CSV',
    };
  }
});

// IPC Handlers for SMS operations (local dev only)

/**
 * Send SMS via Twilio
 * POST /api/sms equivalent via IPC
 */
ipcMain.handle('sms:send', async (_event, { to, body }) => {
  console.log('[IPC sms:send]', { to, body }); // <-- add this line
  return sendSMS(to, body);
});

/**
 * Get SMS configuration status
 */
ipcMain.handle('sms:status', async () => {
  return getSMSStatus();
});
