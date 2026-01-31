/**
 * Exclusions Step
 *
 * Third step: set up exclusion rules (who can't give to whom).
 */

import React, { useState } from 'react';
import { useDrawStore } from '../../store';
import { Checkbox } from '../../components/ui';
import { validateConstraints, getConstraintSummary } from '../../services';

export default function ExclusionsStep() {
  const { currentDraw, setExclusions } = useDrawStore();
  const [selectedGiverId, setSelectedGiverId] = useState<string | null>(
    currentDraw?.participants[0]?.id || null
  );

  if (!currentDraw) return null;

  const { participants, exclusions } = currentDraw;

  // Validate constraints
  const validation = validateConstraints(participants, exclusions);
  const summary = getConstraintSummary(participants, exclusions);

  const selectedGiver = participants.find((p) => p.id === selectedGiverId);
  const selectedExclusions = new Set(exclusions[selectedGiverId || ''] || []);

  const handleToggleExclusion = (recipientId: string) => {
    if (!selectedGiverId) return;

    const current = exclusions[selectedGiverId] || [];
    const newExclusions = selectedExclusions.has(recipientId)
      ? current.filter((id) => id !== recipientId)
      : [...current, recipientId];

    setExclusions(selectedGiverId, newExclusions);
  };

  // Get count of exclusions for each giver
  const getExclusionCount = (giverId: string) => {
    return (exclusions[giverId] || []).length;
  };

  if (participants.length < 2) {
    return (
      <div className="card p-12 text-center">
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
        <h3 className="text-lg font-medium text-gray-900 mb-1">Add more participants</h3>
        <p className="text-gray-500">You need at least 2 participants to set up exclusions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                validation.status === 'valid'
                  ? 'bg-green-100'
                  : validation.status === 'warning'
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}
            >
              {validation.status === 'valid' ? (
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : validation.status === 'warning' ? (
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {validation.status === 'valid'
                  ? 'Constraints look good!'
                  : validation.status === 'warning'
                  ? 'Constraints have warnings'
                  : 'Constraints have errors'}
              </h3>
              <p className="text-sm text-gray-500">
                {summary.totalExclusions} exclusion{summary.totalExclusions !== 1 ? 's' : ''} set
              </p>
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {validation.messages.length > 0 && (
          <div className="mt-4 space-y-2">
            {validation.messages.map((msg, index) => (
              <div
                key={index}
                className={`text-sm px-3 py-2 rounded-lg ${
                  msg.type === 'error'
                    ? 'bg-red-50 text-red-700'
                    : msg.type === 'warning'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {msg.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exclusion Editor */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Giver List */}
          <div>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Select Giver</h3>
              <p className="text-xs text-gray-500 mt-0.5">Who is giving the gift?</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {participants.map((participant) => {
                const count = getExclusionCount(participant.id);
                const isSelected = participant.id === selectedGiverId;
                const hasIssue = validation.messages.some((m) =>
                  m.participantIds?.includes(participant.id)
                );

                return (
                  <button
                    key={participant.id}
                    onClick={() => setSelectedGiverId(participant.id)}
                    className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-red-50 border-l-2 border-red-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          hasIssue ? 'bg-red-100' : 'bg-gray-100'
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            hasIssue ? 'text-red-600' : 'text-gray-600'
                          }`}
                        >
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{participant.name}</span>
                    </div>
                    {count > 0 && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        {count} excluded
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exclusion Picker */}
          <div>
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Cannot Give To</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedGiver ? `${selectedGiver.name} cannot give to:` : 'Select a giver'}
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {selectedGiver ? (
                participants
                  .filter((p) => p.id !== selectedGiverId)
                  .map((recipient) => (
                    <label
                      key={recipient.id}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedExclusions.has(recipient.id)}
                        onChange={() => handleToggleExclusion(recipient.id)}
                      />
                      <span className="text-gray-900">{recipient.name}</span>
                    </label>
                  ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Select a giver from the left to set their exclusions
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-sm text-gray-500 space-y-2">
        <p>
          <strong>Tip:</strong> Exclusions are directional. If Alice can't give to Bob, Bob can
          still give to Alice (unless you also exclude that).
        </p>
        <p>
          Common exclusions: spouses (can't give to each other), parents/children in large families,
          or people who gave to each other last year.
        </p>
      </div>
    </div>
  );
}
