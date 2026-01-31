/**
 * Home Screen
 *
 * Entry point for creating new draws or opening existing ones.
 */

import React, { useState } from 'react';
import { useDrawStore, useAuditStore, useUIStore } from '../store';
import { Button, Input, Modal } from '../components/ui';
import { isValidSecretSantaFile } from '../types';

// Declare electron API type
declare global {
  interface Window {
    electronAPI?: {
      file: {
        open: () => Promise<{ success: boolean; data?: unknown; filePath?: string; canceled?: boolean; error?: string }>;
        save: (data: unknown, filePath?: string) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
        saveAs: (data: unknown) => Promise<{ success: boolean; filePath?: string; canceled?: boolean; error?: string }>;
        importCsv: () => Promise<{ success: boolean; content?: string; canceled?: boolean; error?: string }>;
      };
    };
  }
}

export default function HomeScreen() {
  const [showNewDrawModal, setShowNewDrawModal] = useState(false);
  const [newDrawName, setNewDrawName] = useState('');
  const [error, setError] = useState('');

  const { createNewDraw, loadDraw } = useDrawStore();
  const { loadEntries } = useAuditStore();
  const { resetUI } = useUIStore();

  const handleCreateNew = () => {
    if (!newDrawName.trim()) {
      setError('Please enter a name for your draw');
      return;
    }
    createNewDraw(newDrawName.trim());
    resetUI();
    setShowNewDrawModal(false);
    setNewDrawName('');
    setError('');
  };

  const handleOpenFile = async () => {
    // Check if running in Electron
    if (window.electronAPI?.file) {
      const result = await window.electronAPI.file.open();
      if (result.success && result.data) {
        if (isValidSecretSantaFile(result.data)) {
          loadDraw(result.data.draw, result.filePath);
          loadEntries(result.data.auditLog);
          resetUI();
        } else {
          alert('Invalid file format');
        }
      } else if (result.error) {
        alert(`Error opening file: ${result.error}`);
      }
    } else {
      // Fallback for web: use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.secretsanta,.json';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (isValidSecretSantaFile(data)) {
              loadDraw(data.draw);
              loadEntries(data.auditLog);
              resetUI();
            } else {
              alert('Invalid file format');
            }
          } catch {
            alert('Error reading file');
          }
        }
      };
      input.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="pt-8 pb-4 px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Secret Santa</h1>
            <p className="text-sm text-gray-500">Private gift exchange organizer</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Organize Your Gift Exchange
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A private, offline Secret Santa tool. Set up participants, add exclusions,
              and generate random assignments — all without sharing your data.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Create New */}
            <button
              onClick={() => setShowNewDrawModal(true)}
              className="card p-8 text-left hover:shadow-md transition-shadow group"
            >
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-200 transition-colors">
                <svg
                  className="w-7 h-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create New Draw
              </h3>
              <p className="text-sm text-gray-500">
                Start fresh with a new Secret Santa draw for your group.
              </p>
            </button>

            {/* Open Existing */}
            <button
              onClick={handleOpenFile}
              className="card p-8 text-left hover:shadow-md transition-shadow group"
            >
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <svg
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Open Saved Draw
              </h3>
              <p className="text-sm text-gray-500">
                Continue working on a previously saved Secret Santa file.
              </p>
            </button>
          </div>

          {/* Features */}
          <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Fully Private</h4>
              <p className="text-sm text-gray-500">
                Your data stays on your device. No accounts or cloud storage.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Smart Exclusions</h4>
              <p className="text-sm text-gray-500">
                Set rules for who can't give to whom (spouses, etc.).
              </p>
            </div>
            <div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Fair & Random</h4>
              <p className="text-sm text-gray-500">
                Cryptographically random assignments every time.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* New Draw Modal */}
      <Modal
        isOpen={showNewDrawModal}
        onClose={() => {
          setShowNewDrawModal(false);
          setNewDrawName('');
          setError('');
        }}
        title="Create New Draw"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Draw Name"
            placeholder="e.g., Smith Family 2024"
            value={newDrawName}
            onChange={(e) => {
              setNewDrawName(e.target.value);
              setError('');
            }}
            error={error}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNew();
              }
            }}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewDrawModal(false);
                setNewDrawName('');
                setError('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateNew}>Create Draw</Button>
          </div>
        </div>
      </Modal>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 text-center text-sm text-gray-400">
        Secret Santa App — Offline & Private
      </footer>
    </div>
  );
}
