'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AI_PROVIDERS } from '@/lib/validation';
import type { AiProvider } from '@/lib/validation';
import type { useApiKey } from '@/hooks/useApiKey';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hook: ReturnType<typeof useApiKey>;
}

const PROVIDER_HINT_KEY: Record<AiProvider, string> = {
  google: 'settings.format_hint_google',
  openai: 'settings.format_hint_openai',
  anthropic: 'settings.format_hint_anthropic',
};

const PROVIDER_PLACEHOLDER_KEY: Record<AiProvider, string> = {
  google: 'settings.key_placeholder_google',
  openai: 'settings.key_placeholder_openai',
  anthropic: 'settings.key_placeholder_anthropic',
};

export function SettingsPanel({ isOpen, onClose, hook }: Props) {
  const { t } = useTranslation();
  const { isSettingsValid, saveSettings, removeSettings, provider: savedProvider } = hook;
  const [draftProvider, setDraftProvider] = useState<AiProvider>(savedProvider);
  const [draftKey, setDraftKey] = useState('');
  const [feedback, setFeedback] = useState<'idle' | 'saved' | 'error'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraftProvider(savedProvider);
      setDraftKey('');
      setFeedback('idle');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, savedProvider]);

  function handleSave() {
    const ok = saveSettings(draftProvider, draftKey.trim());
    setFeedback(ok ? 'saved' : 'error');
    if (ok) setTimeout(onClose, 900);
  }

  function handleRemove() {
    removeSettings();
    setDraftKey('');
    setFeedback('idle');
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <h2 id="settings-title" className="font-display text-2xl font-bold text-gray-900 mb-2">
          {t('settings.title')}
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {t('settings.description')}
        </p>

        {isSettingsValid && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
            <span className="text-base">✓</span>
            <span>{t('settings.saved')}</span>
          </div>
        )}

        <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-1">
          {t('settings.provider_label')}
        </label>
        <select
          id="provider-select"
          value={draftProvider}
          onChange={(e) => {
            setDraftProvider(e.target.value as AiProvider);
            setFeedback('idle');
          }}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 transition mb-4"
        >
          {AI_PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {t(`settings.providers.${p}`)}
            </option>
          ))}
        </select>

        <label htmlFor="api-key-input" className="block text-sm font-medium text-gray-700 mb-1">
          {t('settings.key_label')}
        </label>
        <input
          ref={inputRef}
          id="api-key-input"
          type="password"
          autoComplete="off"
          value={draftKey}
          onChange={(e) => {
            setDraftKey(e.target.value);
            setFeedback('idle');
          }}
          placeholder={t(PROVIDER_PLACEHOLDER_KEY[draftProvider])}
          className={`w-full border rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 transition ${
            feedback === 'error'
              ? 'border-red-400 focus:ring-red-200'
              : 'border-gray-300 focus:ring-brand-200 focus:border-brand-400'
          }`}
        />
        <p className="mt-1.5 text-xs text-gray-400">{t(PROVIDER_HINT_KEY[draftProvider])}</p>

        {feedback === 'error' && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {t(PROVIDER_HINT_KEY[draftProvider])}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-300"
          >
            {t('settings.save')}
          </button>
          {isSettingsValid && (
            <button
              onClick={handleRemove}
              className="px-4 text-sm text-gray-500 hover:text-red-600 border border-gray-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
            >
              {t('settings.remove')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
