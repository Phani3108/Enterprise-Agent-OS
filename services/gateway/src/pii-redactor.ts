/**
 * PII Redactor — Regex-based scrub for common PII + secrets in LLM I/O.
 *
 * Deliberately lightweight and pluggable. Not a substitute for a full DLP,
 * but closes the CISO-question "what happens when someone pastes a credit
 * card into a prompt" in a defensible way.
 *
 * Scope (v1):
 *   - Emails
 *   - US phone numbers (loose)
 *   - Credit-card-like numbers (13-19 digits, Luhn-validated)
 *   - US SSN format
 *   - AWS access key id / secret key patterns
 *   - Generic bearer tokens
 *   - JWT-shaped strings
 *
 * Observability: returns a redaction report so the caller can log to the
 * audit log for SOC2 evidence ("we saw 3 emails and 1 card and redacted them").
 *
 * @author Phani Marupaka <https://linkedin.com/in/phani-marupaka>
 * @copyright © 2026 Phani Marupaka. All rights reserved.
 */

export type RedactionType =
  | 'email'
  | 'phone'
  | 'credit_card'
  | 'ssn'
  | 'aws_access_key'
  | 'aws_secret_key'
  | 'bearer_token'
  | 'jwt';

export interface RedactionEvent {
  type: RedactionType;
  original: string;
  placeholder: string;
}

export interface RedactionResult {
  text: string;
  events: RedactionEvent[];
}

interface RedactionRule {
  type: RedactionType;
  pattern: RegExp;
  placeholder: (match: string, idx: number) => string;
  /** Optional extra validation (e.g., Luhn for credit cards). */
  validate?: (match: string) => boolean;
}

// Rules ordered so more specific patterns run first.
const RULES: RedactionRule[] = [
  {
    type: 'aws_access_key',
    pattern: /\bAKIA[0-9A-Z]{16}\b/g,
    placeholder: (_, i) => `[AWS_ACCESS_KEY_${i}]`,
  },
  {
    type: 'aws_secret_key',
    pattern: /\b[A-Za-z0-9/+=]{40}\b/g,
    placeholder: (_, i) => `[AWS_SECRET_${i}]`,
    // Require ~40-char mixed-case+digits blob to reduce false positives.
    validate: (m) => /[A-Z]/.test(m) && /[a-z]/.test(m) && /[0-9]/.test(m) && /[/+=]/.test(m),
  },
  {
    type: 'jwt',
    pattern: /\beyJ[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\.[a-zA-Z0-9_-]{5,}\b/g,
    placeholder: (_, i) => `[JWT_${i}]`,
  },
  {
    type: 'bearer_token',
    pattern: /\bBearer\s+[A-Za-z0-9._\-+/=]{16,}\b/gi,
    placeholder: (_, i) => `[BEARER_${i}]`,
  },
  {
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    placeholder: (_, i) => `[EMAIL_${i}]`,
  },
  {
    type: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    placeholder: (_, i) => `[SSN_${i}]`,
  },
  {
    type: 'credit_card',
    pattern: /\b(?:\d[ -]?){12,19}\b/g,
    placeholder: (_, i) => `[CC_${i}]`,
    validate: (raw) => {
      const digits = raw.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) return false;
      return luhnValid(digits);
    },
  },
  {
    type: 'phone',
    // Loose US/international phone; runs after credit card to avoid eating them.
    pattern: /\+?\d{1,3}?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    placeholder: (_, i) => `[PHONE_${i}]`,
  },
];

function luhnValid(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]!, 10);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/** Redact PII in-place; returns scrubbed text + list of events. */
export function redact(text: string | null | undefined): RedactionResult {
  if (!text) return { text: text ?? '', events: [] };
  let scrubbed = text;
  const events: RedactionEvent[] = [];

  for (const rule of RULES) {
    scrubbed = scrubbed.replace(rule.pattern, (match) => {
      if (rule.validate && !rule.validate(match)) return match;
      const placeholder = rule.placeholder(match, events.length + 1);
      events.push({ type: rule.type, original: match, placeholder });
      return placeholder;
    });
  }

  return { text: scrubbed, events };
}

/** Returns true if text appears to contain PII. Cheap pre-scan. */
export function containsPII(text: string | null | undefined): boolean {
  if (!text) return false;
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0; // reset stateful /g regex
    if (rule.pattern.test(text)) {
      if (!rule.validate) return true;
      // Re-scan with validation.
      rule.pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = rule.pattern.exec(text)) !== null) {
        if (rule.validate(m[0])) return true;
      }
    }
  }
  return false;
}
