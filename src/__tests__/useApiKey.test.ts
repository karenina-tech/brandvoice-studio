import { renderHook, act } from '@testing-library/react';
import { useApiKey } from '@/hooks/useApiKey';

const VALID_GOOGLE_KEY = 'AIza' + 'K'.repeat(35);
const VALID_OPENAI_KEY = 'sk-' + 'a'.repeat(40);
const VALID_ANTHROPIC_KEY = 'sk-ant-' + 'a'.repeat(40);
const INVALID_KEY = 'not-a-valid-key';

describe('useApiKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with google provider and empty key when localStorage is empty', () => {
    const { result } = renderHook(() => useApiKey());
    expect(result.current.provider).toBe('google');
    expect(result.current.apiKey).toBe('');
    expect(result.current.isSettingsValid).toBe(false);
  });

  it('saves valid Google settings to localStorage and updates state', () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      const ok = result.current.saveSettings('google', VALID_GOOGLE_KEY);
      expect(ok).toBe(true);
    });
    expect(result.current.provider).toBe('google');
    expect(result.current.apiKey).toBe(VALID_GOOGLE_KEY);
    expect(result.current.isSettingsValid).toBe(true);
    expect(localStorage.getItem('ai_provider')).toBe('google');
    expect(localStorage.getItem('ai_api_key')).toBe(VALID_GOOGLE_KEY);
  });

  it('saves valid OpenAI settings', () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      expect(result.current.saveSettings('openai', VALID_OPENAI_KEY)).toBe(true);
    });
    expect(result.current.provider).toBe('openai');
    expect(result.current.isSettingsValid).toBe(true);
    expect(localStorage.getItem('ai_provider')).toBe('openai');
  });

  it('saves valid Anthropic settings', () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      expect(result.current.saveSettings('anthropic', VALID_ANTHROPIC_KEY)).toBe(true);
    });
    expect(result.current.provider).toBe('anthropic');
    expect(result.current.isSettingsValid).toBe(true);
  });

  it('rejects a Google key submitted for the openai provider and returns false', () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      const ok = result.current.saveSettings('openai', VALID_GOOGLE_KEY);
      expect(ok).toBe(false);
    });
    expect(result.current.apiKey).toBe('');
    expect(localStorage.getItem('ai_api_key')).toBeNull();
  });

  it('rejects a plainly invalid key and returns false', () => {
    const { result } = renderHook(() => useApiKey());
    act(() => {
      expect(result.current.saveSettings('google', INVALID_KEY)).toBe(false);
    });
    expect(result.current.apiKey).toBe('');
    expect(result.current.isSettingsValid).toBe(false);
  });

  it('clears both storage keys and resets to google on removeSettings', () => {
    localStorage.setItem('ai_provider', 'openai');
    localStorage.setItem('ai_api_key', VALID_OPENAI_KEY);
    const { result } = renderHook(() => useApiKey());
    expect(result.current.isSettingsValid).toBe(true);

    act(() => {
      result.current.removeSettings();
    });

    expect(result.current.provider).toBe('google');
    expect(result.current.apiKey).toBe('');
    expect(result.current.isSettingsValid).toBe(false);
    expect(localStorage.getItem('ai_provider')).toBeNull();
    expect(localStorage.getItem('ai_api_key')).toBeNull();
  });

  it('reads existing valid settings from localStorage on mount', () => {
    localStorage.setItem('ai_provider', 'anthropic');
    localStorage.setItem('ai_api_key', VALID_ANTHROPIC_KEY);
    const { result } = renderHook(() => useApiKey());
    expect(result.current.provider).toBe('anthropic');
    expect(result.current.apiKey).toBe(VALID_ANTHROPIC_KEY);
    expect(result.current.isSettingsValid).toBe(true);
  });

  it('defaults provider to "google" when the stored provider string is unrecognized', () => {
    localStorage.setItem('ai_provider', 'unknown-llm');
    localStorage.setItem('ai_api_key', VALID_GOOGLE_KEY);
    const { result } = renderHook(() => useApiKey());
    expect(result.current.provider).toBe('google');
  });
});
