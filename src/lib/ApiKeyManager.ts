import { aiProviderSchema, aiApiKeySchema, AI_KEY_PATTERNS } from '@/lib/validation';
import type { AiProvider } from '@/lib/validation';

export type AppMode = 'byok' | 'managed';

const STORAGE_KEYS = {
  provider: 'ai_provider',
  apiKey: 'ai_api_key',
  mode: 'ai_mode',
} as const;

function safeLocalStorageRead(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function readStoredProvider(): AiProvider {
  const stored = safeLocalStorageRead(STORAGE_KEYS.provider, 'google');
  return aiProviderSchema.safeParse(stored).success ? (stored as AiProvider) : 'google';
}

export function readStoredApiKey(): string {
  return safeLocalStorageRead(STORAGE_KEYS.apiKey, '');
}

export function readStoredMode(): AppMode {
  const raw = safeLocalStorageRead(STORAGE_KEYS.mode, 'byok');
  return raw === 'managed' ? 'managed' : 'byok';
}

export function validateApiSettings(provider: AiProvider, apiKey: string): boolean {
  return aiApiKeySchema.safeParse(apiKey).success && AI_KEY_PATTERNS[provider].test(apiKey);
}

export function persistApiSettings(provider: AiProvider, apiKey: string): boolean {
  if (!aiProviderSchema.safeParse(provider).success) return false;
  const parsed = aiApiKeySchema.safeParse(apiKey);
  if (!parsed.success) return false;
  if (!AI_KEY_PATTERNS[provider].test(parsed.data)) return false;
  try {
    localStorage.setItem(STORAGE_KEYS.provider, provider);
    localStorage.setItem(STORAGE_KEYS.apiKey, parsed.data);
    return true;
  } catch {
    return false;
  }
}

export function clearApiSettings(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.provider);
    localStorage.removeItem(STORAGE_KEYS.apiKey);
  } catch {
    // localStorage unavailable
  }
}

export function persistMode(mode: AppMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.mode, mode);
  } catch {
    // localStorage unavailable
  }
}
