/**
 * Phone Number Normalizer
 *
 * Utilities for normalizing and validating phone numbers.
 * Supports common US formats and E.164 international format.
 */

/**
 * Normalizes phone numbers to E.164 format.
 * Assumes US numbers if no country code provided.
 *
 * @param input - Raw phone number input
 * @returns E.164 formatted number or null if invalid
 */
export function normalizePhoneNumber(input: string): string | null {
  // Remove all non-digit characters
  const digits = input.replace(/\D/g, '');

  if (digits.length === 0) return null;

  // Handle US numbers (10 digits)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Handle US numbers with country code (11 digits starting with 1)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // Already has country code (> 10 digits)
  if (digits.length > 10) {
    return `+${digits}`;
  }

  return null; // Invalid - too few digits
}

/**
 * Validates if a string is a valid phone number.
 *
 * @param input - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(input: string): boolean {
  return normalizePhoneNumber(input) !== null;
}

/**
 * Formats a phone number for display.
 * Converts E.164 to (XXX) XXX-XXXX format for US numbers.
 *
 * @param e164 - E.164 formatted phone number
 * @returns Formatted display string
 */
export function formatPhoneForDisplay(e164: string): string {
  // Handle US numbers (+1XXXXXXXXXX)
  if (e164.startsWith('+1') && e164.length === 12) {
    const digits = e164.slice(2);
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // For other formats, just return as-is
  return e164;
}

/**
 * Parses common phone number formats.
 * Extracts digits and validates structure.
 *
 * Supported formats:
 * - (XXX) XXX-XXXX
 * - XXX-XXX-XXXX
 * - XXX.XXX.XXXX
 * - XXX XXX XXXX
 * - XXXXXXXXXX
 * - 1XXXXXXXXXX
 * - +1XXXXXXXXXX
 *
 * @param input - Raw phone number input
 * @returns Parsed result with normalized number or validation error
 */
export function parsePhoneNumber(input: string): {
  valid: boolean;
  normalized?: string;
  display?: string;
  error?: string;
} {
  const trimmed = input.trim();

  if (trimmed === '') {
    return { valid: true }; // Empty is valid (phone is optional)
  }

  const normalized = normalizePhoneNumber(trimmed);

  if (!normalized) {
    return {
      valid: false,
      error: 'Invalid phone number format. Please use a valid US number.',
    };
  }

  return {
    valid: true,
    normalized,
    display: formatPhoneForDisplay(normalized),
  };
}
