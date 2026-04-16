/**
 * Slack Notifier — Send execution summaries to a Slack channel via webhook.
 *
 * Subscribes to `execution.completed` events on the gateway event bus and
 * posts a compact summary to a Slack incoming-webhook URL configured via the
 * SLACK_WEBHOOK_URL environment variable. No-op when the env var is unset,
 * keeping the feature silently inert in dev/sandbox setups.
 *
 * Usage:
 *   import { initSlackNotifier } from './slack-notifier.js';
 *   initSlackNotifier();
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

import { eventBus } from './event-bus.js';
import { getPersonaExecution } from './persona-api.js';

let initialized = false;

/** Whitelist of skills that should trigger a Slack ping on completion. */
const NOTIFY_SKILLS = new Set<string>([
  'wf-007', // Blog From Brief
  'wf-008', // Blog From Whitepaper
  'wf-013', // LinkedIn Creative Generator
  'wf-001', // Webinar Campaign Generator
]);

/** Subscribe once; safe to call multiple times. */
export function initSlackNotifier(): void {
  if (initialized) return;
  initialized = true;

  eventBus.on('execution.completed', async (event) => {
    const webhook = process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    const { execId, persona, status } = (event.data ?? {}) as {
      execId?: string;
      persona?: string;
      status?: string;
    };
    if (!execId) return;

    const exec = getPersonaExecution(execId);
    if (!exec) return;

    // Only notify for allow-listed skills to avoid spamming the channel during
    // high-volume runs. Administrators can extend NOTIFY_SKILLS as needed.
    if (!NOTIFY_SKILLS.has(exec.skillId)) return;

    const duration = exec.totalLatencyMs ? `${(exec.totalLatencyMs / 1000).toFixed(1)}s` : 'n/a';
    const stepCount = exec.steps.length;
    const outcome = status === 'completed' ? ':white_check_mark: Succeeded' : `:warning: ${status ?? 'unknown'}`;

    const payload = {
      text: `AgentOS · *${exec.skillName}* · ${outcome}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${exec.skillName}* (${persona}) ${outcome}\n_${stepCount} steps · ${duration} · exec ${execId}_`,
          },
        },
        ...buildOutputBlocks(exec.outputs),
      ],
    };

    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('[slack-notifier] webhook non-200:', res.status, text.slice(0, 200));
      }
    } catch (err) {
      console.warn('[slack-notifier] delivery failed:', (err as Error).message);
    }
  });
}

/**
 * Render up to three output keys as preview blocks. Long outputs are truncated
 * so the Slack message stays within the 3000-char block limit.
 */
function buildOutputBlocks(outputs: Record<string, unknown> | undefined): unknown[] {
  if (!outputs) return [];
  const keys = Object.keys(outputs).slice(0, 3);
  return keys.map((key) => {
    const raw = typeof outputs[key] === 'string' ? (outputs[key] as string) : JSON.stringify(outputs[key]);
    const preview = raw.length > 700 ? raw.slice(0, 700) + '…' : raw;
    return {
      type: 'section',
      text: { type: 'mrkdwn', text: `*${key}*\n\`\`\`${preview}\`\`\`` },
    };
  });
}
