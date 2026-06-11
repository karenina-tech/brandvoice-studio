import { brandVoiceInputSchema } from '@/lib/validation';
import type { BrandVoiceInput, BrandVoiceResponse, AiProvider } from '@/lib/validation';
import { ok, err } from '@/lib/result';
import type { Result } from '@/lib/result';
import { makeApiError } from '@/lib/ai/errors';

export async function generatePrompt(
	input: BrandVoiceInput,
	provider: AiProvider,
	apiKey: string
): Promise<Result<BrandVoiceResponse>> {
	const parsed = brandVoiceInputSchema.safeParse(input);
	if (!parsed.success) {
		return err(makeApiError('Invalid form data', 400));
	}

	let response: Response;
	try {
		response = await fetch('/api/generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-AI-Provider': provider,
				'X-AI-Api-Key': apiKey
			},
			body: JSON.stringify(parsed.data)
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
