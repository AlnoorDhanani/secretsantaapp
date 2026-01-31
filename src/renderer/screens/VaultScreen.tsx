/**
 * Vault Screen
 *
 * Protected view for revealing assignments.
 */

import React, { useState } from 'react';
import { useDrawStore, useUIStore, useAuditStore } from '../store';
import { Button, Input, Modal } from '../components/ui';
import { generateMessage, DEFAULT_TEMPLATE } from '../services';

export default function VaultScreen() {
  const { currentDraw } = useDrawStore();
  const {
    lockVault,
    vaultUnlocked,
    revealedParticipants,
    revealParticipant,
    showAllEnabled,
    enableShowAll,
  } = useUIStore();
  const { logAction } = useAuditStore();

  const [showWarning, setShowWarning] = useState(!vaultUnlocked);
  const [confirmText, setConfirmText] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [showAllConfirm, setShowAllConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentDraw || !currentDraw.assignments) return null;

  const { participants, assignments } = currentDraw;

  const handleUnlock = () => {
    if (confirmText.toUpperCase() !== 'REVEAL') {
      setConfirmError('Please type REVEAL to continue');
      return;
    }
    setShowWarning(false);
    logAction('VAULT_ENTERED');
  };

  const handleReveal = (participantId: string) => {
    revealParticipant(participantId);
    logAction('ASSIGNMENT_REVEALED', participantId);
  };

  const handleShowAll = () => {
    enableShowAll();
    setShowAllConfirm(false);
    logAction('VAULT_SHOW_ALL');
  };

  const handleCopyMessage = async (giverId: string) => {
    const giver = participants.find((p) => p.id === giverId);
    const recipientId = assignments[giverId];
    const recipient = participants.find((p) => p.id === recipientId);

    if (!giver || !recipient) return;

    const message = generateMessage(DEFAULT_TEMPLATE.template, giver, recipient, currentDraw);

    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(giverId);
      logAction('ASSIGNMENT_COPIED', giverId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  const getRecipientName = (giverId: string) => {
    const recipientId = assignments[giverId];
    return participants.find((p) => p.id === recipientId)?.name || 'Unknown';
  };

  const isRevealed = (participantId: string) => {
    return showAllEnabled || revealedParticipants.has(participantId);
  };

  // Show warning modal on first access
  if (showWarning) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Warning: Assignment Vault</h2>
            <p className="text-gray-600 mb-6">
              This section reveals Secret Santa assignments. Only proceed if you need to view or
              troubleshoot assignments. If you're a participant, entering may spoil the surprise!
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="font-mono bg-gray-100 px-1">REVEAL</span> to continue:
              </label>
              <Input
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setConfirmError('');
                }}
                error={confirmError}
                placeholder="Type REVEAL"
                className="text-center font-mono"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnlock();
                  }
                }}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={lockVault}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleUnlock}
                disabled={!confirmText}
              >
                Enter Vault
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={lockVault}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              title="Exit vault"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <h1 className="text-lg font-semibold">Assignment Vault</h1>
            </div>
          </div>
          <div className="text-sm text-gray-400">{currentDraw.name}</div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Warning Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              You are viewing the Assignment Vault. Assignments revealed here should not be shared
              with participants directly — use the Distribution screen to send individual messages.
            </p>
          </div>

          {/* Assignment List */}
          <div className="card divide-y divide-gray-100">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-medium text-gray-900">Individual Assignments</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Click "Reveal" to see each assignment
              </p>
            </div>
            {participants.map((participant) => {
              const revealed = isRevealed(participant.id);
              const justCopied = copiedId === participant.id;

              return (
                <div key={participant.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{participant.name}</div>
                      {revealed ? (
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="text-gray-400">gives to:</span>
                          <span className="font-medium text-red-600">
                            {getRecipientName(participant.id)}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400">Not revealed</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!revealed && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReveal(participant.id)}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Reveal
                      </Button>
                    )}
                    <Button
                      variant={justCopied ? 'success' : 'ghost'}
                      size="sm"
                      onClick={() => handleCopyMessage(participant.id)}
                    >
                      {justCopied ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                          </svg>
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show All Section */}
          {!showAllEnabled && (
            <div className="card p-4 border-2 border-dashed border-gray-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Show All Assignments</h3>
                  <p className="text-sm text-gray-500">Reveal all assignments at once</p>
                </div>
                <Button variant="danger" onClick={() => setShowAllConfirm(true)}>
                  Show All
                </Button>
              </div>
            </div>
          )}

          {/* All Revealed */}
          {showAllEnabled && (
            <div className="card p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-800">
                  <strong>All assignments revealed.</strong> Be careful not to accidentally show
                  this screen to participants.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Show All Confirmation Modal */}
      <Modal
        isOpen={showAllConfirm}
        onClose={() => setShowAllConfirm(false)}
        title="Show All Assignments?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will reveal all {participants.length} assignments at once. This action is logged.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAllConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleShowAll}>
              Yes, Show All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
