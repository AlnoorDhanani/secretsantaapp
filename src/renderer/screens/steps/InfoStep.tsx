/**
 * Info Step
 *
 * First step: basic draw information (name, year, budget, notes).
 */

import React from 'react';
import { useDrawStore } from '../../store';
import { Input } from '../../components/ui';

export default function InfoStep() {
  const { currentDraw, updateDrawInfo } = useDrawStore();

  if (!currentDraw) return null;

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Draw Information</h2>

      <div className="space-y-5 max-w-lg">
        <Input
          label="Draw Name"
          placeholder="e.g., Smith Family Secret Santa"
          value={currentDraw.name}
          onChange={(e) => updateDrawInfo({ name: e.target.value })}
        />

        <Input
          label="Year / Label (optional)"
          placeholder="e.g., 2024, Christmas, Holiday Party"
          value={currentDraw.year || ''}
          onChange={(e) => updateDrawInfo({ year: e.target.value || undefined })}
        />

        <Input
          label="Budget (optional)"
          placeholder="e.g., $50, $25-50"
          value={currentDraw.budget || ''}
          onChange={(e) => updateDrawInfo({ budget: e.target.value || undefined })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            rows={3}
            placeholder="Any additional notes for participants..."
            value={currentDraw.notes || ''}
            onChange={(e) => updateDrawInfo({ notes: e.target.value || undefined })}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Next Steps</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Add participants who will exchange gifts</li>
          <li>Set exclusions (who can't give to whom)</li>
          <li>Generate random assignments</li>
          <li>Distribute assignments to participants</li>
        </ol>
      </div>
    </div>
  );
}
