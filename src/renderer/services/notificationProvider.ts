/**
 * Notification Provider Interface
 *
 * Defines the interface for sending Secret Santa notifications.
 * MVP implements LocalProvider (copy/print).
 * Future versions can add SMS, email, and hosted link providers.
 */

import type { Participant, Draw, Assignment } from '../types';

/**
 * Result of a notification send operation.
 */
export interface NotificationResult {
  /** Whether the send was successful */
  success: boolean;
  /** Message ID if applicable */
  messageId?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Interface for notification providers.
 * Implementations handle different distribution methods (local, SMS, email, etc.).
 */
export interface NotificationProvider {
  /** Display name of the provider */
  readonly name: string;
  /** Whether this provider requires network access */
  readonly requiresNetwork: boolean;

  /**
   * Check if the provider is available and configured.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Send a notification to a single participant.
   *
   * @param participant - The recipient participant
   * @param message - The message to send
   */
  send(participant: Participant, message: string): Promise<NotificationResult>;

  /**
   * Send notifications to all participants.
   *
   * @param draw - The draw with participant data
   * @param assignments - The generated assignments
   * @param messageTemplate - Template for generating messages
   */
  bulkSend(
    draw: Draw,
    assignments: Assignment[],
    messageTemplate: string
  ): Promise<Map<string, NotificationResult>>;
}

/**
 * Local Notification Provider (MVP)
 *
 * Uses clipboard for distribution. No network required.
 */
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
    try {
      await navigator.clipboard.writeText(message);
      return {
        success: true,
        messageId: `local-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to copy to clipboard',
      };
    }
  }

  async bulkSend(
    _draw: Draw,
    _assignments: Assignment[],
    _messageTemplate: string
  ): Promise<Map<string, NotificationResult>> {
    // For local provider, bulk send isn't supported
    // Return results indicating manual action required
    const results = new Map<string, NotificationResult>();
    for (const assignment of _assignments) {
      results.set(assignment.giverId, {
        success: false,
        error: 'Use individual copy for local distribution',
      });
    }
    return results;
  }
}

// Future providers (V2) would be implemented similarly:
//
// export class TwilioNotificationProvider implements NotificationProvider {
//   readonly name = 'SMS (Twilio)';
//   readonly requiresNetwork = true;
//   // ... implementation
// }
//
// export class EmailNotificationProvider implements NotificationProvider {
//   readonly name = 'Email';
//   readonly requiresNetwork = true;
//   // ... implementation
// }
//
// export class HostedRevealLinkProvider {
//   // Generates unique reveal links instead of sending messages
//   generateLinks(draw: Draw, assignments: Assignment[]): Promise<RevealLink[]>;
//   revokeLinks(drawId: string): Promise<void>;
// }
