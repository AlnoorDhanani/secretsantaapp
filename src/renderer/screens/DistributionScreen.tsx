/**
 * Distribution Screen
 *
 * Allows organizer to copy messages for each participant.
 */

import React, { useState } from 'react';
import { useDrawStore, useUIStore, useAuditStore } from '../store';
import { Button } from '../components/ui';
import { generateMessage, DEFAULT_TEMPLATE } from '../services';

export default function DistributionScreen() {
  const { currentDraw } = useDrawStore();
  const { setStep, copiedParticipants, markCopied, unlockVault } = useUIStore();
  const { logAction } = useAuditStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentDraw || !currentDraw.assignments) return null;

  const { participants, assignments } = currentDraw;

  const handleCopyMessage = async (giverId: string) => {
    const giver = participants.find((p) => p.id === giverId);
    const recipientId = assignments[giverId];
    const recipient = participants.find((p) => p.id === recipientId);

    if (!giver || !recipient) return;

    const message = generateMessage(DEFAULT_TEMPLATE.template, giver, recipient, currentDraw);

    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(giverId);
      markCopied(giverId);
      logAction('ASSIGNMENT_COPIED', giverId);

      // Reset copied indicator after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      alert('Failed to copy to clipboard');
    }
  };

  const copiedCount = copiedParticipants.size;
  const totalCount = participants.length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep('generate')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to generate"
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
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Distribute Assignments</h1>
              <p className="text-sm text-gray-500">{currentDraw.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span
              className={`font-medium ${
                copiedCount === totalCount ? 'text-green-600' : 'text-gray-900'
              }`}
            >
              {copiedCount} / {totalCount}
            </span>
            <span>copied</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Instructions */}
          <div className="card p-4 bg-blue-50 border-blue-200">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900">How to distribute</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Click "Copy Message" for each participant, then paste and send it to them via text,
                  email, or any messaging app. The message contains their secret assignment.
                </p>
              </div>
            </div>
          </div>

          {/* Participant List */}
          <div className="card divide-y divide-gray-100">
            {participants.map((participant) => {
              const isCopied = copiedParticipants.has(participant.id);
              const justCopied = copiedId === participant.id;

              return (
                <div
                  key={participant.id}
                  className={`px-6 py-4 flex items-center justify-between ${
                    isCopied ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCopied ? 'bg-green-200' : 'bg-gray-100'
                      }`}
                    >
                      {isCopied ? (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium text-gray-600">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{participant.name}</div>
                      {isCopied && (
                        <div className="text-xs text-green-600">Message copied</div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={justCopied ? 'success' : isCopied ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => handleCopyMessage(participant.id)}
                  >
                    {justCopied ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Copied!
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
                        Copy Message
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Secondary Actions */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 mb-3">Other Options</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  unlockVault();
                }}
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
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                Open Vault (View All)
              </Button>
              <Button
                variant="outline"
                onClick={() => setStep('generate')}
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Regenerate
              </Button>
            </div>
          </div>

          {/* Progress */}
          {copiedCount === totalCount && (
            <div className="card p-6 bg-green-50 border-green-200 text-center">
              <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-green-900">All done!</h3>
              <p className="text-green-700 mt-1">
                You've copied messages for all {totalCount} participants.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
