/**
 * Participants Step
 *
 * Second step: add/edit/remove participants.
 */

import React, { useState } from 'react';
import { useDrawStore } from '../../store';
import { Button, Input, Modal } from '../../components/ui';
import { normalizePhoneNumber as _normalizePhoneNumber, formatPhoneForDisplay, parsePhoneNumber } from '../../services';
import { normalizeNameForComparison } from '../../types';

export default function ParticipantsStep() {
  const { currentDraw, addParticipant, updateParticipant, removeParticipant } = useDrawStore();

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [editPhoneError, setEditPhoneError] = useState('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  if (!currentDraw) return null;

  const validateName = (name: string, excludeId?: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Name is required';
    }

    const normalized = normalizeNameForComparison(trimmed);
    const duplicate = currentDraw.participants.find(
      (p) => normalizeNameForComparison(p.name) === normalized && p.id !== excludeId
    );

    if (duplicate) {
      return `"${duplicate.name}" already exists`;
    }

    return null;
  };

  const handleAdd = () => {
    const nameErr = validateName(newName);
    if (nameErr) {
      setNameError(nameErr);
      return;
    }

    const phoneResult = parsePhoneNumber(newPhone);
    if (!phoneResult.valid) {
      setPhoneError(phoneResult.error || 'Invalid phone number');
      return;
    }

    addParticipant(newName.trim(), phoneResult.normalized);
    setNewName('');
    setNewPhone('');
    setNameError('');
    setPhoneError('');
  };

  const handleStartEdit = (id: string) => {
    const participant = currentDraw.participants.find((p) => p.id === id);
    if (participant) {
      setEditingId(id);
      setEditName(participant.name);
      setEditPhone(participant.phoneNumber ? formatPhoneForDisplay(participant.phoneNumber) : '');
      setEditNameError('');
      setEditPhoneError('');
    }
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const nameErr = validateName(editName, editingId);
    if (nameErr) {
      setEditNameError(nameErr);
      return;
    }

    const phoneResult = parsePhoneNumber(editPhone);
    if (!phoneResult.valid) {
      setEditPhoneError(phoneResult.error || 'Invalid phone number');
      return;
    }

    updateParticipant(editingId, {
      name: editName.trim(),
      phoneNumber: phoneResult.normalized,
    });

    setEditingId(null);
  };

  const handleImport = () => {
    const lines = importText.split('\n').filter((line) => line.trim());
    let added = 0;
    let skipped = 0;

    for (const line of lines) {
      // Try to parse as CSV (name, phone) or just name
      const parts = line.split(',').map((p) => p.trim());
      const name = parts[0];
      const phone = parts[1];

      if (!name) continue;

      const nameErr = validateName(name);
      if (nameErr) {
        skipped++;
        continue;
      }

      const phoneResult = parsePhoneNumber(phone || '');
      addParticipant(name, phoneResult.normalized);
      added++;
    }

    setShowImportModal(false);
    setImportText('');

    if (skipped > 0) {
      alert(`Added ${added} participants. Skipped ${skipped} (duplicates or invalid).`);
    }
  };

  const handleImportFromFile = async () => {
    if (window.electronAPI?.file) {
      const result = await window.electronAPI.file.importCsv();
      if (result.success && result.content) {
        setImportText(result.content);
      }
    } else {
      // Web fallback
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.txt';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          setImportText(text);
        }
      };
      input.click();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Participants</h2>
            <p className="text-sm text-gray-500 mt-1">
              {currentDraw.participants.length} participant
              {currentDraw.participants.length !== 1 ? 's' : ''} added
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            Import CSV
          </Button>
        </div>

        {/* Add Form */}
        <div className="flex gap-3 items-start">
          <div className="flex-1">
            <Input
              placeholder="Name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setNameError('');
              }}
              error={nameError}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                }
              }}
            />
          </div>
          <div className="w-48">
            <Input
              placeholder="Phone (optional)"
              value={newPhone}
              onChange={(e) => {
                setNewPhone(e.target.value);
                setPhoneError('');
              }}
              error={phoneError}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAdd();
                }
              }}
            />
          </div>
          <Button onClick={handleAdd}>Add</Button>
        </div>
      </div>

      {/* Participant List */}
      {currentDraw.participants.length > 0 && (
        <div className="card divide-y divide-gray-100">
          {currentDraw.participants.map((participant) => (
            <div
              key={participant.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              {editingId === participant.id ? (
                <div className="flex-1 flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        setEditNameError('');
                      }}
                      error={editNameError}
                      autoFocus
                    />
                  </div>
                  <div className="w-48">
                    <Input
                      placeholder="Phone (optional)"
                      value={editPhone}
                      onChange={(e) => {
                        setEditPhone(e.target.value);
                        setEditPhoneError('');
                      }}
                      error={editPhoneError}
                    />
                  </div>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{participant.name}</div>
                      {participant.phoneNumber && (
                        <div className="text-sm text-gray-500">
                          {formatPhoneForDisplay(participant.phoneNumber)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartEdit(participant.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${participant.name}" from the draw?`)) {
                          removeParticipant(participant.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {currentDraw.participants.length === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No participants yet</h3>
          <p className="text-gray-500">Add participants above or import from a CSV file.</p>
        </div>
      )}

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportText('');
        }}
        title="Import Participants"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter participants, one per line. Optionally include phone numbers separated by a comma.
          </p>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleImportFromFile}>
              Load from file...
            </Button>
          </div>
          <textarea
            className="w-full h-48 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono"
            placeholder="Alice Smith, (555) 123-4567
Bob Smith, 555-234-5678
Carol Smith
David Smith"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowImportModal(false);
                setImportText('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!importText.trim()}>
              Import
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
