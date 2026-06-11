const KEY_PATTERNS: readonly RegExp[] = [
  /AIza[0-9A-Za-z\-_]{0,35}/g,
  /sk-(?:ant-)?[A-Za-z0-9\-_]{8,}/g,
];

const MAX_LENGTH = 120;

export function sanitizeErrorMessage(message: string): string {
  return KEY_PATTERNS
    .reduce((msg, pattern) => msg.replace(pattern, '[REDACTED]'), message)
    .slice(0, MAX_LENGTH);
}
