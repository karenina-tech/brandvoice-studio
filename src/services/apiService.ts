import { brandVoiceInputSchema } from '@/lib/validation';
import type { BrandVoiceInput, BrandVoiceResponse, AiProvider } from '@/lib/validation';
import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';
import { makeApiError } from '@/lib/ai/errors';

export type GenerateConfig =
  | { readonly mode: 'byok'; readonly provider: AiProvider; readonly apiKey: string }
  | { readonly mode: 'managed' };

export async function generatePrompt(
  input: BrandVoiceInput,
  config: GenerateConfig,
): Promise<Result<BrandVoiceResponse>> {
  const parsed = brandVoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return err(makeApiError('Invalid form data', 400));
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.mode === 'byok') {
    headers['X-AI-Provider'] = config.provider;
    headers['X-AI-Api-Key'] = config.apiKey;
  }

  let response: Response;
  try {
    response = await fetch('/api/generate', {
      method: 'POST',
      headers,
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return err(makeApiError('Network error. Check your connection.', 0));
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    const message: string =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'Request failed';
    return err(makeApiError(message, response.status));
  }

  return ok((await response.json()) as BrandVoiceResponse);
}
