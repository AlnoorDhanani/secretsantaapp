/**
 * Draw Editor
 *
 * Main editor with step-based navigation for creating/editing a draw.
 */

import React from 'react';
import { useDrawStore, useUIStore, useAuditStore } from '../store';
import { Button } from '../components/ui';
import { createSecretSantaFile } from '../types';
import InfoStep from './steps/InfoStep';
import ParticipantsStep from './steps/ParticipantsStep';
import ExclusionsStep from './steps/ExclusionsStep';
import GenerateStep from './steps/GenerateStep';
import DistributionScreen from './DistributionScreen';
import VaultScreen from './VaultScreen';

type Step = 'info' | 'participants' | 'exclusions' | 'generate' | 'distribution';

const STEPS: { id: Step; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'participants', label: 'Participants' },
  { id: 'exclusions', label: 'Exclusions' },
  { id: 'generate', label: 'Generate' },
];

export default function DrawEditor() {
  const { currentDraw, isDirty, filePath, markSaved, reset } = useDrawStore();
  const { currentStep, setStep, vaultUnlocked, lockVault } = useUIStore();
  const { entries: auditEntries } = useAuditStore();

  if (!currentDraw) return null;

  // If vault is unlocked, show vault screen
  if (vaultUnlocked) {
    return <VaultScreen />;
  }

  // If assignments exist and we're on distribution step, show distribution
  if (currentDraw.assignments && currentStep === 'distribution') {
    return <DistributionScreen />;
  }

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleSave = async () => {
    const fileData = createSecretSantaFile(currentDraw, auditEntries);

    if (window.electronAPI?.file) {
      const result = await window.electronAPI.file.save(fileData, filePath || undefined);
      if (result.success) {
        markSaved(result.filePath);
      } else if (result.error) {
        alert(`Error saving: ${result.error}`);
      }
    } else {
      // Web fallback: download file
      const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentDraw.name.replace(/\s+/g, '-').toLowerCase()}.secretsanta`;
      a.click();
      URL.revokeObjectURL(url);
      markSaved();
    }
  };

  const handleSaveAs = async () => {
    const fileData = createSecretSantaFile(currentDraw, auditEntries);

    if (window.electronAPI?.file) {
      const result = await window.electronAPI.file.saveAs(fileData);
      if (result.success) {
        markSaved(result.filePath);
      } else if (result.error) {
        alert(`Error saving: ${result.error}`);
      }
    } else {
      // Same as save for web
      handleSave();
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    reset();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'info':
        return <InfoStep />;
      case 'participants':
        return <ParticipantsStep />;
      case 'exclusions':
        return <ExclusionsStep />;
      case 'generate':
        return <GenerateStep />;
      default:
        return <InfoStep />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close draw"
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
              <h1 className="text-lg font-semibold text-gray-900">
                {currentDraw.name}
                {isDirty && <span className="text-gray-400 ml-1">*</span>}
              </h1>
              {currentDraw.year && (
                <p className="text-sm text-gray-500">{currentDraw.year}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSaveAs}>
              Save As...
            </Button>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => {
            const isActive = step.id === currentStep;
            const isComplete = index < currentStepIndex;
            const isClickable = index <= currentStepIndex + 1;

            return (
              <React.Fragment key={step.id}>
                {index > 0 && (
                  <div
                    className={`w-12 h-0.5 ${
                      index <= currentStepIndex ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  />
                )}
                <button
                  onClick={() => isClickable && setStep(step.id)}
                  disabled={!isClickable}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
                    ${isActive ? 'bg-red-50' : ''}
                    ${isClickable ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-50'}
                  `}
                >
                  <div
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium
                      ${isActive ? 'bg-red-600 text-white' : ''}
                      ${isComplete ? 'bg-green-600 text-white' : ''}
                      ${!isActive && !isComplete ? 'bg-gray-200 text-gray-500' : ''}
                    `}
                  >
                    {isComplete ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive ? 'text-red-600' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {renderStepContent()}
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              const prevIndex = currentStepIndex - 1;
              if (prevIndex >= 0) {
                setStep(STEPS[prevIndex].id);
              }
            }}
            disabled={currentStepIndex === 0}
          >
            Previous
          </Button>

          {currentStepIndex < STEPS.length - 1 ? (
            <Button
              onClick={() => {
                const nextIndex = currentStepIndex + 1;
                if (nextIndex < STEPS.length) {
                  setStep(STEPS[nextIndex].id);
                }
              }}
            >
              Next: {STEPS[currentStepIndex + 1]?.label}
            </Button>
          ) : (
            <div /> // Placeholder for spacing
          )}
        </div>
      </footer>
    </div>
  );
}
