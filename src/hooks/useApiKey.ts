'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  readStoredProvider,
  readStoredApiKey,
  validateApiSettings,
  persistApiSettings,
  clearApiSettings,
} from '@/lib/ApiKeyManager';
import type { AiProvider } from '@/lib/validation';

export function useApiKey() {
  const [provider, setProvider] = useState<AiProvider>(() => readStoredProvider());
  const [apiKey, setApiKey] = useState<string>(() => readStoredApiKey());

  const isSettingsValid = useMemo(
    () => validateApiSettings(provider, apiKey),
    [provider, apiKey],
  );

  const saveSettings = useCallback((newProvider: AiProvider, newKey: string): boolean => {
    const saved = persistApiSettings(newProvider, newKey);
    if (saved) {
      setProvider(newProvider);
      setApiKey(newKey);
    }
    return saved;
  }, []);

  const removeSettings = useCallback(() => {
    clearApiSettings();
    setProvider('google');
    setApiKey('');
  }, []);

  return { provider, apiKey, isSettingsValid, saveSettings, removeSettings };
}
