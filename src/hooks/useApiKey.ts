'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  readStoredProvider,
  readStoredApiKey,
  readStoredMode,
  validateApiSettings,
  persistApiSettings,
  clearApiSettings,
  persistMode,
} from '@/lib/ApiKeyManager';
import type { AppMode } from '@/lib/ApiKeyManager';
import type { AiProvider } from '@/lib/validation';

export function useApiKey() {
  const [mode, setModeState] = useState<AppMode>(() => readStoredMode());
  const [provider, setProvider] = useState<AiProvider>(() => readStoredProvider());
  const [apiKey, setApiKey] = useState<string>(() => readStoredApiKey());

  const isSettingsValid = useMemo(
    () => mode === 'managed' || validateApiSettings(provider, apiKey),
    [mode, provider, apiKey],
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

  const switchMode = useCallback((newMode: AppMode) => {
    persistMode(newMode);
    setModeState(newMode);
  }, []);

  return { mode, provider, apiKey, isSettingsValid, saveSettings, removeSettings, switchMode };
}
