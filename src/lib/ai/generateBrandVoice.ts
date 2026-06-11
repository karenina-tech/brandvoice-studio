import { generateObject } from 'ai';
import { brandVoiceResponseSchema } from '@/lib/validation';
import type { BrandVoiceRequest, BrandVoiceResponse } from '@/lib/validation';
import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';
import { createProviderModel } from './createModel';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import { sanitizeErrorMessage } from './sanitize';
import { makeAiProviderError } from './errors';

export async function generateBrandVoicePrompt(
  input: BrandVoiceRequest,
): Promise<Result<BrandVoiceResponse>> {
  const model = createProviderModel(input.provider, input.apiKey);
  try {
    const { object } = await generateObject({
      model,
      schema: brandVoiceResponseSchema,
      system: buildSystemPrompt(input.outputLanguage),
      prompt: buildUserPrompt(input),
      maxTokens: 512,
      temperature: 0.85,
    });
    return ok(object);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown AI error';
    return err(makeAiProviderError(`AI generation failed: ${sanitizeErrorMessage(message)}`));
  }
}
