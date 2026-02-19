/**
 * Twilio SMS Integration
 *
 * Provides SMS sending functionality for local development.
 * Supports dry-run mode for testing without actually sending messages.
 */

/* eslint-disable no-console */
import 'dotenv/config';
import Twilio from 'twilio';

const COMPLIANCE_FOOTER = '\n\nReply STOP to opt out. Msg & data rates may apply.';

/**
 * SMS configuration loaded from environment variables
 */
interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  dryRun: boolean;
}

/**
 * Result of an SMS send operation
 */
export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  dryRun: boolean;
}

/**
 * Loads SMS configuration from environment variables.
 * @throws Error if required credentials are missing (unless in dry-run mode)
 */
function getConfig(): SMSConfig {
  const dryRun =
  (process.env.TWILIO_DRY_RUN ?? 'true').trim().toLowerCase() !== 'false';

console.log('[ENV main TWILIO_DRY_RUN]', JSON.stringify(process.env.TWILIO_DRY_RUN), '→ dryRun =', dryRun);
  const config: SMSConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_PHONE_NUMBER || '',
    dryRun,
  };

  // Only require credentials if not in dry-run mode
  if (!dryRun) {
    if (!config.accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID environment variable is required');
    }
    if (!config.authToken) {
      throw new Error('TWILIO_AUTH_TOKEN environment variable is required');
    }
    if (!config.fromNumber) {
      throw new Error('TWILIO_PHONE_NUMBER environment variable is required');
    }
  }

  return config;
}

/**
 * Sends an SMS message via Twilio.
 *
 * @param to - The recipient phone number in E.164 format (e.g., +15551234567)
 * @param body - The message body
 * @returns SMSResult indicating success/failure
 *
 * @example
 * ```ts
 * const result = await sendSMS('+15551234567', 'Hello from Secret Santa!');
 * if (result.success) {
 *   console.log('Message sent:', result.messageId);
 * }
 * ```
 */
export async function sendSMS(to: string, body: string): Promise<SMSResult> {
  const config = getConfig();

  // Validate inputs
  if (!to || !to.startsWith('+')) {
    return {
      success: false,
      error: 'Invalid phone number. Must be in E.164 format (e.g., +15551234567)',
      dryRun: config.dryRun,
    };
  }

  if (!body || body.trim().length === 0) {
    return {
      success: false,
      error: 'Message body cannot be empty',
      dryRun: config.dryRun,
    };
  }

  const fullBody = body.trim() + COMPLIANCE_FOOTER;

  // Dry-run mode: log instead of sending
  if (config.dryRun) {
    console.log('[SMS DRY-RUN] Would send message:');
    console.log(`  To: ${to}`);
    console.log(`  From: ${config.fromNumber || '(not configured)'}`);
    console.log(`  Body: ${fullBody}`);
    console.log('---');

    return {
      success: true,
      messageId: `dry-run-${Date.now()}`,
      dryRun: true,
    };
  }

  // Send via Twilio
  try {
    const client = Twilio(config.accountSid, config.authToken);

    const message = await client.messages.create({
      to,
      from: config.fromNumber,
      body: fullBody,
    });

    console.log(`[SMS] Message sent successfully: ${message.sid}`);

    return {
      success: true,
      messageId: message.sid,
      dryRun: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[SMS] Failed to send message: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      dryRun: false,
    };
  }
}

/**
 * Checks if SMS is configured and ready to use.
 * In dry-run mode, always returns true.
 */
export function isSMSConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the current SMS configuration status (without exposing credentials).
 */
export function getSMSStatus(): { configured: boolean; dryRun: boolean; fromNumber?: string } {
 const dryRun =
  (process.env.TWILIO_DRY_RUN ?? 'true').trim().toLowerCase() !== 'false';

  return {
    configured: isSMSConfigured(),
    dryRun,
    fromNumber: dryRun ? undefined : process.env.TWILIO_PHONE_NUMBER,
  };
}
