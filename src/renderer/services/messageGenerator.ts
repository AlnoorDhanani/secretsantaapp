/**
 * Message Generator
 *
 * Generates personalized messages for Secret Santa distribution.
 */

import type { Participant, Draw } from '../types';

export interface MessageTemplate {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Template string with placeholders */
  template: string;
}

/**
 * Default message template.
 */
export const DEFAULT_TEMPLATE: MessageTemplate = {
  id: 'default',
  name: 'Standard',
  template: `🎁 Secret Santa time! You're gifting: {{recipient}}. Keep it secret! 🤫`,
};

/**
 * Alternative templates.
 */
export const TEMPLATES: MessageTemplate[] = [
  DEFAULT_TEMPLATE,
  {
    id: 'formal',
    name: 'Formal',
    template: `You have been assigned to give a gift to {{recipient}} for {{drawName}}. Please keep this confidential.`,
  },
  {
    id: 'detailed',
    name: 'Detailed',
    template: `🎄 {{drawName}} Assignment 🎄

Hi {{giver}}!

You've been selected to give a gift to: {{recipient}}

Budget: {{budget}}

Remember to keep it a secret until the exchange!`,
  },
];

/**
 * Generates a message from a template and participant data.
 *
 * Available placeholders:
 * - {{recipient}} - Recipient's name
 * - {{giver}} - Giver's name
 * - {{drawName}} - Name of the draw
 * - {{year}} - Year/label of the draw
 * - {{budget}} - Budget notes
 *
 * @param template - Message template string
 * @param giver - The giver participant
 * @param recipient - The recipient participant
 * @param draw - The draw containing metadata
 * @returns Formatted message string
 */
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
    .replace(/\{\{budget\}\}/g, draw.budget || 'not specified');
}

/**
 * Generates messages for all participants.
 *
 * @param draw - The draw with participants and assignments
 * @param template - Message template to use
 * @returns Map of participant ID to generated message
 */
export function generateAllMessages(
  draw: Draw,
  template: string = DEFAULT_TEMPLATE.template
): Map<string, string> {
  const messages = new Map<string, string>();

  if (!draw.assignments) {
    return messages;
  }

  for (const [giverId, recipientId] of Object.entries(draw.assignments)) {
    const giver = draw.participants.find((p) => p.id === giverId);
    const recipient = draw.participants.find((p) => p.id === recipientId);

    if (giver && recipient) {
      messages.set(giverId, generateMessage(template, giver, recipient, draw));
    }
  }

  return messages;
}
