/**
 * File format type definitions for .secretsanta files
 */

import type { Draw } from './draw';
import type { AuditEntry } from './audit';

export interface SecretSantaFile {
  /** File format version */
  formatVersion: 1;
  /** Application identifier */
  application: 'SecretSantaApp';
  /** The draw data */
  draw: Draw;
  /** Audit log entries */
  auditLog: AuditEntry[];
  /** ISO 8601 timestamp of when file was saved */
  savedAt: string;
}

/**
 * Creates a SecretSantaFile structure for saving.
 */
export function createSecretSantaFile(
  draw: Draw,
  auditLog: AuditEntry[]
): SecretSantaFile {
  return {
    formatVersion: 1,
    application: 'SecretSantaApp',
    draw,
    auditLog,
    savedAt: new Date().toISOString(),
  };
}

/**
 * Validates that a parsed object is a valid SecretSantaFile.
 */
export function isValidSecretSantaFile(obj: unknown): obj is SecretSantaFile {
  if (typeof obj !== 'object' || obj === null) return false;

  const file = obj as Record<string, unknown>;

  return (
    file.formatVersion === 1 &&
    file.application === 'SecretSantaApp' &&
    typeof file.draw === 'object' &&
    Array.isArray(file.auditLog) &&
    typeof file.savedAt === 'string'
  );
}
