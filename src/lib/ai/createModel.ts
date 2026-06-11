import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';
import type { AiProvider } from '@/lib/validation';

// claude-3-5-haiku-20241022 was retired Feb 2026; using current Haiku model.
const MODEL_IDS: Record<AiProvider, string> = {
  google: 'gemini-1.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
} as const;

export function createProviderModel(provider: AiProvider, apiKey: string): LanguageModel {
  switch (provider) {
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(MODEL_IDS.google) as LanguageModel;
    case 'openai':
      return createOpenAI({ apiKey })(MODEL_IDS.openai) as LanguageModel;
    case 'anthropic':
      return createAnthropic({ apiKey })(MODEL_IDS.anthropic) as LanguageModel;
  }
}
