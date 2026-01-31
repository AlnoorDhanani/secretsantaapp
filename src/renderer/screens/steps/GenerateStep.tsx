/**
 * Generate Step
 *
 * Fourth step: generate random assignments.
 */

import React, { useState } from 'react';
import { useDrawStore, useUIStore, useAuditStore } from '../../store';
import { Button } from '../../components/ui';
import { generateAssignments, validateConstraints, getConstraintSummary } from '../../services';

export default function GenerateStep() {
  const { currentDraw, setAssignments, clearAssignments } = useDrawStore();
  const { setStep } = useUIStore();
  const { logAction } = useAuditStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!currentDraw) return null;

  const { participants, exclusions, assignments, generatedAt } = currentDraw;
  const validation = validateConstraints(participants, exclusions);
  const summary = getConstraintSummary(participants, exclusions);

  const canGenerate = participants.length >= 2 && validation.status !== 'error';

  const handleGenerate = () => {
    setIsGenerating(true);
    setError(null);

    // Small delay for UI feedback
    setTimeout(() => {
      const result = generateAssignments(participants, exclusions);

      if (result.success && result.assignments) {
        // Convert to map
        const assignmentMap: Record<string, string> = {};
        for (const a of result.assignments) {
          assignmentMap[a.giverId] = a.recipientId;
        }

        setAssignments(assignmentMap);
        logAction(assignments ? 'DRAW_REGENERATED' : 'DRAW_GENERATED');
        setIsGenerating(false);

        // Navigate to distribution
        setStep('distribution');
      } else {
        setError(result.error?.message || 'Failed to generate assignments');
        setIsGenerating(false);
      }
    }, 500);
  };

  const handleRegenerate = () => {
    if (assignments) {
      if (
        !confirm(
          'This will create new random assignments. Any previously shared assignments will no longer be valid. Continue?'
        )
      ) {
        return;
      }
    }
    handleGenerate();
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ready to Generate</h2>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{participants.length}</div>
            <div className="text-sm text-gray-500 mt-1">Participants</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-900">{summary.totalExclusions}</div>
            <div className="text-sm text-gray-500 mt-1">Exclusions</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div
              className={`text-3xl font-bold ${
                validation.status === 'valid'
                  ? 'text-green-600'
                  : validation.status === 'warning'
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {validation.status === 'valid' ? '✓' : validation.status === 'warning' ? '!' : '✗'}
            </div>
            <div className="text-sm text-gray-500 mt-1">Constraints</div>
          </div>
        </div>

        {/* Validation Errors */}
        {validation.status === 'error' && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <h3 className="font-medium text-red-800 mb-2">Cannot generate assignments</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {validation.messages
                .filter((m) => m.type === 'error')
                .map((m, i) => (
                  <li key={i}>• {m.message}</li>
                ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {validation.status === 'warning' && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Warnings</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {validation.messages
                .filter((m) => m.type === 'warning')
                .map((m, i) => (
                  <li key={i}>• {m.message}</li>
                ))}
            </ul>
          </div>
        )}

        {/* Error from generation */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <h3 className="font-medium text-red-800">Generation failed</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="card p-8 text-center">
        {!assignments ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Random Assignments</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Click the button below to randomly assign each participant a person to give a gift to.
              The assignments will respect all your exclusion rules.
            </p>
            <Button size="lg" onClick={handleGenerate} disabled={!canGenerate} loading={isGenerating}>
              Generate Assignments
            </Button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-600"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Assignments Generated!</h3>
            <p className="text-gray-500 mb-2">
              Generated on {new Date(generatedAt!).toLocaleDateString()} at{' '}
              {new Date(generatedAt!).toLocaleTimeString()}
            </p>
            <p className="text-gray-500 mb-6">
              You can now distribute the assignments to participants.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleRegenerate} loading={isGenerating}>
                Regenerate
              </Button>
              <Button onClick={() => setStep('distribution')}>Go to Distribution</Button>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500 space-y-2">
        <p>
          <strong>How it works:</strong> The app uses a cryptographically secure random algorithm to
          ensure fair assignments. Each person is assigned exactly one recipient, and no one gets
          themselves.
        </p>
        {assignments && (
          <p>
            <strong>Note:</strong> If you regenerate, any messages you've already copied will have
            the old assignments. Make sure to re-distribute if you regenerate.
          </p>
        )}
      </div>
    </div>
  );
}
