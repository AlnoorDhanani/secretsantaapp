# Secret Santa Offline MVP — Technical Design Document

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Data Models](#data-models)
5. [Assignment Algorithm](#assignment-algorithm)
6. [UI/UX Design](#uiux-design)
7. [Privacy & Security](#privacy--security)
8. [Extension Points](#extension-points)
9. [Implementation Roadmap](#implementation-roadmap)

---

## Overview

### Product Summary
A lightweight, private, offline Secret Santa assignment tool that:
- Runs entirely on a single device without network access
- Supports exclusion constraints between participants
- Generates cryptographically random, valid assignments
- Provides privacy-conscious distribution mechanisms
- Persists data locally with save/load functionality

### Key Design Principles
1. **Offline-First**: Zero network dependencies; all functionality works without internet
2. **Privacy-Minimizing**: Organizer sees only what's necessary; accidental exposure prevented
3. **Fail-Fast**: Invalid configurations detected early with actionable error messages
4. **Future-Ready**: Clean interfaces for adding SMS/email/hosted links later

---

## Technology Stack

### Recommended Stack: Electron + React + TypeScript

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Runtime** | Electron | True offline desktop app; file system access; cross-platform |
| **UI Framework** | React 18+ | Component-based; excellent tooling; wide adoption |
| **Language** | TypeScript | Type safety for data models; better maintainability |
| **State Management** | Zustand | Lightweight; TypeScript-friendly; no boilerplate |
| **Styling** | Tailwind CSS | Rapid UI development; consistent design system |
| **PDF Generation** | jsPDF + html2canvas | Offline PDF generation for printable slips |
| **File Format** | JSON (.secretsanta) | Human-readable; easily extensible |
| **Build Tool** | Vite | Fast builds; excellent Electron integration |
| **Testing** | Vitest + React Testing Library | Fast unit/integration tests |

### Alternative Stack: Pure Web App (PWA)

If simpler distribution is preferred:
- Vite + React + TypeScript
- Service Worker for offline capability
- IndexedDB for persistence (via Dexie.js)
- File System Access API for save/load (with fallback to download/upload)

**Recommendation**: Start with Electron for better file handling and true offline guarantees. PWA can be added later sharing 95% of the codebase.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Electron Shell                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                     React Application                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │   Home   │  │Participants│ │Exclusions│  │ Generate │ │ │
│  │  │  Screen  │  │  Screen   │ │  Screen  │  │  Screen  │ │ │
│  │  └────┬─────┘  └────┬──────┘ └────┬─────┘  └────┬─────┘ │ │
│  │       │              │             │             │       │ │
│  │  ┌────┴──────────────┴─────────────┴─────────────┴────┐  │ │
│  │  │                   State Store (Zustand)            │  │ │
│  │  └────┬──────────────┬─────────────┬─────────────────┘  │ │
│  │       │              │             │                     │ │
│  │  ┌────┴────┐   ┌─────┴─────┐  ┌────┴─────┐              │ │
│  │  │ Draw    │   │Assignment │  │ Audit    │              │ │
│  │  │ Service │   │ Engine    │  │ Logger   │              │ │
│  │  └────┬────┘   └───────────┘  └──────────┘              │ │
│  │       │                                                  │ │
│  │  ┌────┴─────────────────────────────────────────────┐   │ │
│  │  │            Persistence Layer (File I/O)           │   │ │
│  │  └───────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
secretsantaapp/
├── docs/
│   └── DESIGN.md
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts
│   │   ├── fileHandlers.ts      # Save/Load file operations
│   │   └── preload.ts
│   ├── renderer/                # React application
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # Base components (Button, Input, etc.)
│   │   │   ├── ParticipantList.tsx
│   │   │   ├── ExclusionPicker.tsx
│   │   │   ├── VaultWarningModal.tsx
│   │   │   ├── AssignmentCard.tsx
│   │   │   └── PrintableSlips.tsx
│   │   ├── screens/             # Page-level components
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ParticipantsScreen.tsx
│   │   │   ├── ExclusionsScreen.tsx
│   │   │   ├── GenerateScreen.tsx
│   │   │   ├── DistributionScreen.tsx
│   │   │   └── VaultScreen.tsx
│   │   ├── store/               # Zustand state management
│   │   │   ├── drawStore.ts
│   │   │   ├── uiStore.ts
│   │   │   └── auditStore.ts
│   │   ├── services/            # Business logic
│   │   │   ├── assignmentEngine.ts
│   │   │   ├── constraintValidator.ts
│   │   │   ├── messageGenerator.ts
│   │   │   ├── pdfGenerator.ts
│   │   │   ├── csvImporter.ts
│   │   │   └── phoneNormalizer.ts
│   │   ├── types/               # TypeScript type definitions
│   │   │   ├── draw.ts
│   │   │   ├── participant.ts
│   │   │   ├── assignment.ts
│   │   │   └── notification.ts
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useClipboard.ts
│   │   │   └── useVaultAccess.ts
│   │   └── utils/               # Utility functions
│   │       ├── validation.ts
│   │       └── formatting.ts
│   └── shared/                  # Shared between main/renderer
│       └── constants.ts
├── tests/
│   ├── unit/
│   │   ├── assignmentEngine.test.ts
│   │   ├── constraintValidator.test.ts
│   │   └── phoneNormalizer.test.ts
│   └── integration/
│       └── drawFlow.test.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron-builder.json
└── README.md
```

---

## Data Models

### Core Types

```typescript
// src/renderer/types/participant.ts

export interface Participant {
  id: string;                    // UUID v4
  name: string;                  // Display name (required, trimmed)
  phoneNumber?: string;          // E.164 format (+1XXXXXXXXXX) or undefined
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}

// Normalized name for duplicate detection
export function normalizeNameForComparison(name: string): string {
  return name.trim().toLowerCase();
}
```

```typescript
// src/renderer/types/draw.ts

export interface Draw {
  id: string;                    // UUID v4
  version: number;               // Schema version (1 for MVP)
  name: string;                  // Draw name (required)
  year?: string;                 // Optional year/label
  budget?: string;               // Optional budget notes
  notes?: string;                // Optional general notes
  participants: Participant[];   // All participants
  exclusions: ExclusionMap;      // Giver ID -> Set of excluded recipient IDs
  assignments?: AssignmentMap;   // Only present if generated & saved
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
  generatedAt?: string;          // When assignments were last generated
}

export type ExclusionMap = Record<string, string[]>;  // giverId -> recipientId[]
export type AssignmentMap = Record<string, string>;   // giverId -> recipientId
```

```typescript
// src/renderer/types/assignment.ts

export interface Assignment {
  giverId: string;
  recipientId: string;
}

export interface GenerationResult {
  success: boolean;
  assignments?: Assignment[];
  error?: GenerationError;
}

export interface GenerationError {
  type: 'UNSATISFIABLE' | 'TOO_FEW_PARTICIPANTS' | 'INTERNAL_ERROR';
  message: string;
  details?: string[];            // Actionable suggestions
  problematicParticipants?: string[]; // IDs of participants causing issues
}
```

```typescript
// src/renderer/types/audit.ts

export interface AuditEntry {
  timestamp: string;             // ISO 8601
  action: AuditAction;
  details?: string;
}

export type AuditAction =
  | 'VAULT_ENTERED'
  | 'VAULT_SHOW_ALL'
  | 'ASSIGNMENT_REVEALED'
  | 'ASSIGNMENT_COPIED'
  | 'PRINT_INITIATED'
  | 'DRAW_GENERATED'
  | 'DRAW_REGENERATED';
```

### File Format

The `.secretsanta` file is a JSON file with the following structure:

```typescript
// src/renderer/types/fileFormat.ts

export interface SecretSantaFile {
  formatVersion: 1;              // File format version
  application: 'SecretSantaApp';
  draw: Draw;
  auditLog: AuditEntry[];
  savedAt: string;               // ISO 8601 timestamp
}
```

Example file:
```json
{
  "formatVersion": 1,
  "application": "SecretSantaApp",
  "draw": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 1,
    "name": "Smith Family 2024",
    "year": "2024",
    "budget": "$50",
    "participants": [
      {
        "id": "p1",
        "name": "Alice",
        "phoneNumber": "+15551234567",
        "createdAt": "2024-11-15T10:30:00Z",
        "updatedAt": "2024-11-15T10:30:00Z"
      }
    ],
    "exclusions": {
      "p1": ["p2"]
    },
    "assignments": null,
    "createdAt": "2024-11-15T10:30:00Z",
    "updatedAt": "2024-11-15T10:35:00Z"
  },
  "auditLog": [],
  "savedAt": "2024-11-15T10:35:00Z"
}
```

---

## Assignment Algorithm

### Problem Definition

The Secret Santa assignment problem is equivalent to finding a **random derangement** (permutation with no fixed points) that also respects exclusion constraints. This is a variant of the **bipartite perfect matching** problem.

### Algorithm Selection

| Algorithm | Time Complexity | Handles Exclusions | Randomness | Recommendation |
|-----------|----------------|-------------------|------------|----------------|
| Naive shuffle + retry | O(n! worst) | Yes | Good | No - can hang on constrained inputs |
| Hopcroft-Karp | O(E√V) | Yes | Needs post-shuffle | Good for validation |
| Randomized constraint propagation | O(n²) average | Yes | Excellent | **Recommended** |
| SAT solver | O(complex) | Yes | Needs randomization | Overkill for n≤25 |

### Recommended Algorithm: Randomized Constraint Satisfaction

```typescript
// src/renderer/services/assignmentEngine.ts

import { Participant, ExclusionMap, Assignment, GenerationResult } from '../types';

/**
 * Generates Secret Santa assignments using randomized constraint propagation.
 *
 * Algorithm:
 * 1. Build adjacency matrix of valid assignments (who can give to whom)
 * 2. Check if a perfect matching is possible (Hopcroft-Karp or DFS)
 * 3. If possible, generate random perfect matching using randomized DFS
 * 4. If not possible, identify problematic constraints
 */
export function generateAssignments(
  participants: Participant[],
  exclusions: ExclusionMap
): GenerationResult {
  const n = participants.length;

  // Edge case: need at least 2 participants
  if (n < 2) {
    return {
      success: false,
      error: {
        type: 'TOO_FEW_PARTICIPANTS',
        message: 'Need at least 2 participants for Secret Santa.',
        details: ['Add more participants to create a valid draw.']
      }
    };
  }

  // Build adjacency list: who can each giver give to?
  const canGiveTo = buildAdjacencyList(participants, exclusions);

  // Validate that a perfect matching exists
  const validation = validateMatchingPossible(participants, canGiveTo);
  if (!validation.possible) {
    return {
      success: false,
      error: validation.error
    };
  }

  // Generate random perfect matching
  const assignments = findRandomPerfectMatching(participants, canGiveTo);

  if (!assignments) {
    // This shouldn't happen if validation passed, but handle gracefully
    return {
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Failed to generate assignments despite valid configuration.',
        details: ['Please try again or report this issue.']
      }
    };
  }

  return {
    success: true,
    assignments
  };
}

/**
 * Builds adjacency list of valid giver -> recipient pairs.
 * Excludes self-assignments and explicit exclusions.
 */
function buildAdjacencyList(
  participants: Participant[],
  exclusions: ExclusionMap
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  const participantIds = new Set(participants.map(p => p.id));

  for (const giver of participants) {
    const excluded = new Set(exclusions[giver.id] || []);
    excluded.add(giver.id); // No self-assignment

    const validRecipients = participants
      .filter(r => !excluded.has(r.id))
      .map(r => r.id);

    adjacency.set(giver.id, validRecipients);
  }

  return adjacency;
}

/**
 * Validates that a perfect matching is possible using Hall's theorem check.
 * For each subset S of givers, |N(S)| >= |S| must hold.
 *
 * For practical purposes with n<=25, we use iterative DFS matching.
 */
function validateMatchingPossible(
  participants: Participant[],
  canGiveTo: Map<string, string[]>
): { possible: boolean; error?: GenerationError } {
  const n = participants.length;
  const participantIds = participants.map(p => p.id);

  // Quick check: each giver must have at least one valid recipient
  for (const giver of participants) {
    const validRecipients = canGiveTo.get(giver.id) || [];
    if (validRecipients.length === 0) {
      return {
        possible: false,
        error: {
          type: 'UNSATISFIABLE',
          message: `"${giver.name}" has no valid recipients.`,
          details: [
            `Remove some exclusions for ${giver.name}`,
            'Or add more participants to the draw'
          ],
          problematicParticipants: [giver.id]
        }
      };
    }
  }

  // Try to find a perfect matching using augmenting paths
  const matching = findMaximumMatching(participantIds, canGiveTo);

  if (matching.size < n) {
    // Find who couldn't be matched
    const unmatched = participantIds.filter(id => !matching.has(id));
    const unmatchedNames = unmatched
      .map(id => participants.find(p => p.id === id)?.name || id);

    return {
      possible: false,
      error: {
        type: 'UNSATISFIABLE',
        message: 'The current exclusions make a valid assignment impossible.',
        details: [
          `Problem involves: ${unmatchedNames.join(', ')}`,
          'Try removing some exclusions between these participants',
          'Or add more participants to the draw'
        ],
        problematicParticipants: unmatched
      }
    };
  }

  return { possible: true };
}

/**
 * Finds maximum matching using Hungarian algorithm / augmenting paths.
 * Returns map of giverId -> recipientId.
 */
function findMaximumMatching(
  giverIds: string[],
  canGiveTo: Map<string, string[]>
): Map<string, string> {
  const matching = new Map<string, string>();      // giver -> recipient
  const reverseMatching = new Map<string, string>(); // recipient -> giver

  for (const giverId of giverIds) {
    const visited = new Set<string>();
    augmentPath(giverId, canGiveTo, matching, reverseMatching, visited);
  }

  return matching;
}

/**
 * Attempts to find an augmenting path from the given giver.
 */
function augmentPath(
  giverId: string,
  canGiveTo: Map<string, string[]>,
  matching: Map<string, string>,
  reverseMatching: Map<string, string>,
  visited: Set<string>
): boolean {
  const recipients = canGiveTo.get(giverId) || [];

  for (const recipientId of recipients) {
    if (visited.has(recipientId)) continue;
    visited.add(recipientId);

    const currentGiver = reverseMatching.get(recipientId);

    if (!currentGiver || augmentPath(currentGiver, canGiveTo, matching, reverseMatching, visited)) {
      matching.set(giverId, recipientId);
      reverseMatching.set(recipientId, giverId);
      return true;
    }
  }

  return false;
}

/**
 * Generates a random perfect matching.
 * Shuffles the order of exploration to ensure randomness.
 */
function findRandomPerfectMatching(
  participants: Participant[],
  canGiveTo: Map<string, string[]>
): Assignment[] | null {
  const n = participants.length;
  const giverIds = shuffle([...participants.map(p => p.id)]);

  // Shuffle each giver's recipient list for randomness
  const randomizedAdjacency = new Map<string, string[]>();
  for (const [giverId, recipients] of canGiveTo) {
    randomizedAdjacency.set(giverId, shuffle([...recipients]));
  }

  // Find matching with randomized exploration order
  const matching = new Map<string, string>();
  const reverseMatching = new Map<string, string>();

  for (const giverId of giverIds) {
    const visited = new Set<string>();
    if (!augmentPath(giverId, randomizedAdjacency, matching, reverseMatching, visited)) {
      return null; // Should not happen if validation passed
    }
  }

  // Convert to Assignment array
  return participants.map(p => ({
    giverId: p.id,
    recipientId: matching.get(p.id)!
  }));
}

/**
 * Fisher-Yates shuffle for cryptographically-fair randomness.
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    // Use crypto.getRandomValues for better randomness
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    const j = randomBuffer[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

### Constraint Validation (Pre-Generation)

```typescript
// src/renderer/services/constraintValidator.ts

export interface ConstraintValidation {
  status: 'valid' | 'warning' | 'error';
  messages: ValidationMessage[];
}

export interface ValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  participantIds?: string[];
}

/**
 * Validates exclusion constraints before generation.
 * Returns actionable feedback on potential issues.
 */
export function validateConstraints(
  participants: Participant[],
  exclusions: ExclusionMap
): ConstraintValidation {
  const messages: ValidationMessage[] = [];
  const n = participants.length;

  if (n < 2) {
    return {
      status: 'error',
      messages: [{
        type: 'error',
        message: 'Need at least 2 participants'
      }]
    };
  }

  // Check each participant's exclusion count
  for (const p of participants) {
    const excludedCount = (exclusions[p.id] || []).length;
    const maxAllowed = n - 2; // Can exclude all but self and one other

    if (excludedCount > maxAllowed) {
      messages.push({
        type: 'error',
        message: `${p.name} has excluded too many people (${excludedCount}/${maxAllowed} max)`,
        participantIds: [p.id]
      });
    } else if (excludedCount === maxAllowed) {
      messages.push({
        type: 'warning',
        message: `${p.name} can only give to one person`,
        participantIds: [p.id]
      });
    }
  }

  // Check for mutual exclusion clusters
  const clusters = findMutualExclusionClusters(participants, exclusions);
  for (const cluster of clusters) {
    if (cluster.length >= n / 2) {
      const names = cluster.map(id =>
        participants.find(p => p.id === id)?.name || id
      );
      messages.push({
        type: 'warning',
        message: `High exclusion density among: ${names.join(', ')}`,
        participantIds: cluster
      });
    }
  }

  // Determine overall status
  const hasErrors = messages.some(m => m.type === 'error');
  const hasWarnings = messages.some(m => m.type === 'warning');

  return {
    status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid',
    messages
  };
}

/**
 * Finds groups of participants with high mutual exclusions.
 */
function findMutualExclusionClusters(
  participants: Participant[],
  exclusions: ExclusionMap
): string[][] {
  // Simple heuristic: group participants who mutually exclude each other
  const clusters: string[][] = [];
  const visited = new Set<string>();

  for (const p of participants) {
    if (visited.has(p.id)) continue;

    const cluster = [p.id];
    visited.add(p.id);

    const pExclusions = new Set(exclusions[p.id] || []);

    for (const other of participants) {
      if (other.id === p.id || visited.has(other.id)) continue;

      const otherExclusions = new Set(exclusions[other.id] || []);

      // Check if they mutually exclude each other
      if (pExclusions.has(other.id) && otherExclusions.has(p.id)) {
        cluster.push(other.id);
        visited.add(other.id);
      }
    }

    if (cluster.length > 1) {
      clusters.push(cluster);
    }
  }

  return clusters;
}
```

---

## UI/UX Design

### Screen Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                           HOME SCREEN                             │
│  ┌────────────────────┐  ┌─────────────────────┐                 │
│  │  + Create New Draw │  │  Open Saved Draw    │                 │
│  └─────────┬──────────┘  └──────────┬──────────┘                 │
│            │                         │                            │
│            ▼                         ▼                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    DRAW WIZARD / EDITOR                      │ │
│  │                                                               │ │
│  │  ┌─────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐  │ │
│  │  │ 1. Info │→│2. Participants│→│3. Exclusions│→│4. Generate │  │ │
│  │  └─────────┘  └────────────┘  └───────────┘  └─────┬──────┘  │ │
│  │                                                     │         │ │
│  │                                                     ▼         │ │
│  │                                           ┌─────────────────┐ │ │
│  │                                           │  Distribution   │ │ │
│  │                                           │    Screen       │ │ │
│  │                                           └────────┬────────┘ │ │
│  │                                                    │          │ │
│  │                          ┌─────────────────────────┤          │ │
│  │                          │                         │          │ │
│  │                          ▼                         ▼          │ │
│  │                   ┌─────────────┐          ┌─────────────┐    │ │
│  │                   │ Copy Message│          │  Vault      │    │ │
│  │                   │ (per person)│          │  (Protected)│    │ │
│  │                   └─────────────┘          └─────────────┘    │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Wireframes

#### 1. Home Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  🎁 Secret Santa                                    [Settings]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     Welcome to Secret Santa!                     │
│         A private, offline gift exchange organizer               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                                                              ││
│  │     [ + Create New Draw ]    [ 📁 Open Saved Draw ]         ││
│  │                                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Recent Draws:                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  📋 Smith Family 2024          12 participants   Nov 15   │  │
│  │  📋 Office Party 2024          8 participants    Nov 10   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 2. Participants Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Smith Family 2024              [Save] [Save As...]   │
├─────────────────────────────────────────────────────────────────┤
│  ○ Info   ● Participants   ○ Exclusions   ○ Generate            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Participants (8)                    [Import CSV] [+ Add]       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Name                    Phone (optional)         Actions │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │  Alice Smith             +1 (555) 123-4567       [✏️] [🗑️] │  │
│  │  Bob Smith               +1 (555) 234-5678       [✏️] [🗑️] │  │
│  │  Carol Smith             —                        [✏️] [🗑️] │  │
│  │  David Smith             +1 (555) 345-6789       [✏️] [🗑️] │  │
│  │  ...                                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  + Add participant:                                        │  │
│  │  Name: [________________]  Phone: [(___) ___-____]  [Add] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                              [ ← Previous ]  [ Next: Exclusions →]│
└─────────────────────────────────────────────────────────────────┘
```

#### 3. Exclusions Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Smith Family 2024              [Save] [Save As...]   │
├─────────────────────────────────────────────────────────────────┤
│  ○ Info   ○ Participants   ● Exclusions   ○ Generate            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Set up exclusions: Who can NOT give to whom?                   │
│                                                                  │
│  ┌──────────────────────┐  ┌────────────────────────────────┐   │
│  │ Giver                │  │ Cannot give to:                │   │
│  │ ┌──────────────────┐ │  │ ┌────────────────────────────┐ │   │
│  │ │ ► Alice Smith    │ │  │ │ ☑ Bob Smith (spouse)       │ │   │
│  │ │   Bob Smith      │ │  │ │ ☐ Carol Smith              │ │   │
│  │ │   Carol Smith    │ │  │ │ ☐ David Smith              │ │   │
│  │ │   David Smith    │ │  │ │ ☐ Emma Smith               │ │   │
│  │ │   Emma Smith     │ │  │ │ ☐ Frank Smith              │ │   │
│  │ │   Frank Smith    │ │  │ └────────────────────────────┘ │   │
│  │ └──────────────────┘ │  │                                │   │
│  └──────────────────────┘  └────────────────────────────────┘   │
│                                                                  │
│  Constraint Status: 🟢 Valid — All constraints satisfiable      │
│                                                                  │
│                         [ ← Previous ]  [ Next: Generate → ]    │
└─────────────────────────────────────────────────────────────────┘
```

#### 4. Generate Screen

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Smith Family 2024              [Save] [Save As...]   │
├─────────────────────────────────────────────────────────────────┤
│  ○ Info   ○ Participants   ○ Exclusions   ● Generate            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Ready to Generate!                                              │
│                                                                  │
│  Summary:                                                        │
│  • 8 participants                                                │
│  • 4 exclusion rules                                             │
│  • Constraints: 🟢 Valid                                         │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │              [ 🎲 Generate Assignments ]                   │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ⚠️ Assignments are randomized. Once generated, you can         │
│     distribute them or regenerate with different pairings.      │
│                                                                  │
│                                         [ ← Previous ]          │
└─────────────────────────────────────────────────────────────────┘
```

#### 5. Distribution Screen (Post-Generation)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    Smith Family 2024              [Save] [Save As...]   │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Assignments Generated!                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Distribute Assignments                                          │
│                                                                  │
│  Select a participant to copy their message:                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👤 Alice Smith                    [ 📋 Copy Message ]    │  │
│  │  👤 Bob Smith                      [ 📋 Copy Message ]    │  │
│  │  👤 Carol Smith                    [ 📋 Copy Message ]    │  │
│  │  👤 David Smith                    [ 📋 Copy Message ]    │  │
│  │  ...                                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Distribution progress: 0 / 8 copied                            │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  Other options:                                                  │
│  [ 🖨️ Print Slips (PDF) ]     [ 🔓 Open Vault (reveal all) ]   │
│  [ 🔄 Regenerate ]                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 6. Vault Screen (Protected)

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back    🔒 Assignment Vault                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  ⚠️  WARNING                                               │  │
│  │                                                            │  │
│  │  This section reveals Secret Santa assignments.            │  │
│  │  Only proceed if you need to:                              │  │
│  │    • View assignments for troubleshooting                  │  │
│  │    • Print physical slips                                  │  │
│  │                                                            │  │
│  │  Type REVEAL to continue: [____________]                   │  │
│  │                                                            │  │
│  │                    [ Cancel ]  [ Enter Vault ]             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

After entering vault:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Exit Vault    🔓 Assignment Vault                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Reveal Individual Assignments:                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  👤 Alice Smith         [👁️ Reveal]  [ 📋 Copy ]          │  │
│  │  👤 Bob Smith           [👁️ Reveal]  [ 📋 Copy ]          │  │
│  │  👤 Carol Smith         → David      [ 📋 Copy ]  ✓       │  │
│  │  👤 David Smith         [👁️ Reveal]  [ 📋 Copy ]          │  │
│  │  ...                                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  ⚠️ Show All Assignments                                        │
│  [ Show All ] (requires second confirmation)                    │
│                                                                  │
│  [ 🖨️ Print All Slips (PDF) ]                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```typescript
// Component tree

App
├── Router
│   ├── HomeScreen
│   │   ├── WelcomeHero
│   │   ├── ActionButtons (Create, Open)
│   │   └── RecentDrawsList
│   │
│   ├── DrawEditor
│   │   ├── DrawHeader (name, save buttons)
│   │   ├── StepIndicator (Info, Participants, Exclusions, Generate)
│   │   └── StepContent
│   │       ├── InfoStep
│   │       │   └── DrawInfoForm
│   │       ├── ParticipantsStep
│   │       │   ├── ParticipantList
│   │       │   ├── ParticipantForm
│   │       │   └── ImportModal
│   │       ├── ExclusionsStep
│   │       │   ├── GiverList
│   │       │   ├── ExclusionPicker
│   │       │   └── ConstraintStatus
│   │       └── GenerateStep
│   │           ├── DrawSummary
│   │           └── GenerateButton
│   │
│   ├── DistributionScreen
│   │   ├── ParticipantDistributionList
│   │   ├── CopyMessageButton
│   │   ├── ProgressIndicator
│   │   └── SecondaryActions
│   │
│   └── VaultScreen
│       ├── VaultWarningModal
│       ├── IndividualRevealList
│       ├── ShowAllSection
│       └── PrintSlipsButton
│
├── Modals
│   ├── ConfirmationModal
│   ├── ImportCSVModal
│   ├── DuplicateResolutionModal
│   └── RegenerateWarningModal
│
└── UI Components
    ├── Button
    ├── Input
    ├── Checkbox
    ├── Modal
    ├── Toast
    └── Tooltip
```

---

## Privacy & Security

### Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|------------|--------|------------|
| Organizer accidentally sees all assignments | High | Medium | Vault with confirmation barriers |
| Saved file accessed by others | Medium | Medium | Warning when saving assignments |
| Clipboard contents seen | Medium | Low | Optional "privacy mode" for copy |
| Screen visible to others during use | Medium | Medium | No default "show all" view |

### Privacy Controls Implementation

```typescript
// src/renderer/hooks/useVaultAccess.ts

import { useState, useCallback } from 'react';
import { useAuditStore } from '../store/auditStore';

export interface VaultAccessState {
  isUnlocked: boolean;
  revealedParticipants: Set<string>;
  showAllEnabled: boolean;
}

export function useVaultAccess() {
  const [state, setState] = useState<VaultAccessState>({
    isUnlocked: false,
    revealedParticipants: new Set(),
    showAllEnabled: false
  });

  const { logAction } = useAuditStore();

  const unlock = useCallback((confirmationText: string): boolean => {
    if (confirmationText.toUpperCase() === 'REVEAL') {
      setState(s => ({ ...s, isUnlocked: true }));
      logAction('VAULT_ENTERED');
      return true;
    }
    return false;
  }, [logAction]);

  const lock = useCallback(() => {
    setState({
      isUnlocked: false,
      revealedParticipants: new Set(),
      showAllEnabled: false
    });
  }, []);

  const revealParticipant = useCallback((participantId: string) => {
    setState(s => ({
      ...s,
      revealedParticipants: new Set([...s.revealedParticipants, participantId])
    }));
    logAction('ASSIGNMENT_REVEALED', participantId);
  }, [logAction]);

  const enableShowAll = useCallback((confirmed: boolean) => {
    if (confirmed) {
      setState(s => ({ ...s, showAllEnabled: true }));
      logAction('VAULT_SHOW_ALL');
    }
  }, [logAction]);

  return {
    ...state,
    unlock,
    lock,
    revealParticipant,
    enableShowAll
  };
}
```

### Audit Logging

```typescript
// src/renderer/store/auditStore.ts

import { create } from 'zustand';
import { AuditEntry, AuditAction } from '../types/audit';

interface AuditStore {
  entries: AuditEntry[];
  logAction: (action: AuditAction, details?: string) => void;
  getEntries: () => AuditEntry[];
  clearEntries: () => void;
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  entries: [],

  logAction: (action, details) => {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action,
      details
    };
    set(state => ({
      entries: [...state.entries, entry]
    }));
  },

  getEntries: () => get().entries,

  clearEntries: () => set({ entries: [] })
}));
```

---

## Extension Points

### Notification Provider Interface

Designed for future SMS/email integration:

```typescript
// src/renderer/services/notificationProvider.ts

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface NotificationProvider {
  readonly name: string;
  readonly requiresNetwork: boolean;

  /**
   * Check if the provider is available and configured
   */
  isAvailable(): Promise<boolean>;

  /**
   * Send a single notification
   */
  send(
    participant: Participant,
    message: string
  ): Promise<NotificationResult>;

  /**
   * Send notifications to all participants
   */
  bulkSend(
    draw: Draw,
    assignments: Assignment[],
    messageTemplate: string
  ): Promise<Map<string, NotificationResult>>;
}
```

### MVP Implementation: Local Provider

```typescript
// src/renderer/services/localNotificationProvider.ts

export class LocalNotificationProvider implements NotificationProvider {
  readonly name = 'Local (Copy/Print)';
  readonly requiresNetwork = false;

  async isAvailable(): Promise<boolean> {
    return true; // Always available
  }

  async send(
    participant: Participant,
    message: string
  ): Promise<NotificationResult> {
    // Copy to clipboard
    await navigator.clipboard.writeText(message);
    return { success: true, messageId: `local-${Date.now()}` };
  }

  async bulkSend(
    draw: Draw,
    assignments: Assignment[],
    messageTemplate: string
  ): Promise<Map<string, NotificationResult>> {
    // For local provider, bulk send isn't supported
    // Return individual results requiring manual action
    const results = new Map<string, NotificationResult>();
    for (const assignment of assignments) {
      results.set(assignment.giverId, {
        success: false,
        error: 'Use individual copy for local distribution'
      });
    }
    return results;
  }
}
```

### Future: SMS Provider

```typescript
// src/renderer/services/smsNotificationProvider.ts (V2)

export class TwilioNotificationProvider implements NotificationProvider {
  readonly name = 'SMS (Twilio)';
  readonly requiresNetwork = true;

  constructor(
    private accountSid: string,
    private authToken: string,
    private fromNumber: string
  ) {}

  async isAvailable(): Promise<boolean> {
    // Check network and credentials
    return navigator.onLine && !!this.accountSid;
  }

  async send(
    participant: Participant,
    message: string
  ): Promise<NotificationResult> {
    if (!participant.phoneNumber) {
      return { success: false, error: 'No phone number' };
    }
    // Twilio API call would go here
    return { success: true, messageId: 'twilio-xxx' };
  }

  // ... bulkSend implementation
}
```

### Future: Hosted Reveal Links

```typescript
// src/renderer/services/hostedRevealProvider.ts (V2)

export interface RevealLink {
  participantId: string;
  token: string;
  url: string;
  expiresAt: string;
}

export interface HostedRevealProvider {
  /**
   * Generate unique reveal links for all participants
   * Organizer never sees assignments—links go directly to participants
   */
  generateLinks(
    draw: Draw,
    assignments: Assignment[]
  ): Promise<RevealLink[]>;

  /**
   * Revoke all links (e.g., if regenerating)
   */
  revokeLinks(drawId: string): Promise<void>;
}
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Foundation)

**Estimated Complexity: Medium**

- [ ] Project setup (Vite + Electron + React + TypeScript)
- [ ] Configure Tailwind CSS
- [ ] Set up Zustand stores (drawStore, uiStore, auditStore)
- [ ] Define TypeScript types for all data models
- [ ] Implement file save/load (Electron IPC)
- [ ] Create base UI components (Button, Input, Modal, etc.)

### Phase 2: Participant Management

**Estimated Complexity: Low-Medium**

- [ ] Home screen with create/open functionality
- [ ] Draw info form (name, year, budget, notes)
- [ ] Participant list component
- [ ] Add/edit/remove participant functionality
- [ ] Phone number normalization (E.164)
- [ ] Duplicate name detection with resolution UI
- [ ] CSV/XLSX import functionality

### Phase 3: Exclusions & Validation

**Estimated Complexity: Medium**

- [ ] Exclusion picker component (multi-select)
- [ ] Constraint validation service
- [ ] Real-time constraint status indicator
- [ ] Actionable error messages for invalid configurations

### Phase 4: Assignment Engine

**Estimated Complexity: Medium-High**

- [ ] Implement bipartite matching algorithm
- [ ] Add cryptographic randomization
- [ ] Handle edge cases (unsatisfiable, too few participants)
- [ ] Generate/Regenerate functionality
- [ ] Unit tests for algorithm correctness

### Phase 5: Distribution & Privacy

**Estimated Complexity: Medium**

- [ ] Distribution screen with per-participant copy
- [ ] Message template generation
- [ ] Vault access with confirmation barriers
- [ ] Per-participant reveal in vault
- [ ] "Show all" with second confirmation
- [ ] Audit logging for vault access

### Phase 6: Print & Export

**Estimated Complexity: Low-Medium**

- [ ] PDF generation for printable slips
- [ ] Print preview (with privacy warning)
- [ ] Export draw configuration as JSON
- [ ] Import draw from JSON

### Phase 7: Polish & Testing

**Estimated Complexity: Medium**

- [ ] End-to-end testing
- [ ] Error boundary and graceful error handling
- [ ] Keyboard navigation and accessibility
- [ ] Responsive design for tablet
- [ ] App packaging for Windows/macOS/Linux

---

## Appendix: Key Implementation Notes

### Phone Number Normalization

```typescript
// src/renderer/services/phoneNormalizer.ts

/**
 * Normalizes phone numbers to E.164 format.
 * Assumes US numbers if no country code provided.
 */
export function normalizePhoneNumber(input: string): string | null {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  if (digits.length === 0) return null;

  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Already has country code
  if (digits.length > 10) {
    return `+${digits}`;
  }

  return null; // Invalid
}

/**
 * Validates if a string is a valid phone number.
 */
export function isValidPhoneNumber(input: string): boolean {
  return normalizePhoneNumber(input) !== null;
}

/**
 * Formats phone number for display.
 */
export function formatPhoneForDisplay(e164: string): string {
  if (!e164.startsWith('+1') || e164.length !== 12) {
    return e164;
  }
  const digits = e164.slice(2);
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
```

### Message Templates

```typescript
// src/renderer/services/messageGenerator.ts

export interface MessageTemplate {
  id: string;
  name: string;
  template: string;
}

export const DEFAULT_TEMPLATE: MessageTemplate = {
  id: 'default',
  name: 'Standard',
  template: `🎁 Secret Santa time! You're gifting: {{recipient}}. Keep it secret! 🤫`
};

export function generateMessage(
  template: string,
  giver: Participant,
  recipient: Participant,
  draw: Draw
): string {
  return template
    .replace(/\{\{recipient\}\}/g, recipient.name)
    .replace(/\{\{giver\}\}/g, giver.name)
    .replace(/\{\{drawName\}\}/g, draw.name)
    .replace(/\{\{year\}\}/g, draw.year || '')
    .replace(/\{\{budget\}\}/g, draw.budget || '');
}
```

### Cryptographic Random Shuffle

```typescript
// src/renderer/utils/crypto.ts

/**
 * Cryptographically secure Fisher-Yates shuffle.
 * Uses Web Crypto API for randomness.
 */
export function cryptoShuffle<T>(array: T[]): T[] {
  const result = [...array];
  const randomValues = new Uint32Array(result.length);
  crypto.getRandomValues(randomValues);

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-31 | AI Agent | Initial design document |

---

*This design document serves as the technical specification for implementing the Secret Santa Offline MVP. It is intended to be comprehensive enough for an AI agent or developer to implement the full application.*
