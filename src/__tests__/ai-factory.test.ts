/**
 * @jest-environment node
 */

import { generateBrandVoicePrompt } from '@/lib/ai/generateBrandVoice';
import { isOk, isErr } from '@/lib/result';
import { isAiProviderError } from '@/lib/ai/errors';
import type { BrandVoiceRequest } from '@/lib/validation';

const MOCK_RESPONSE = {
	instagramCaption: 'Esta manta es pura magia para las noches de verano 🌙✨',
	imageGenerationPrompt:
		'macro photography, double-layer organic muslin blanket, soft cream tones, natural cotton stitching detail'
};

jest.mock('ai', () => ({ generateObject: jest.fn() }));
jest.mock('@ai-sdk/google', () => ({
	createGoogleGenerativeAI: jest.fn(() => jest.fn(() => 'google-model-stub'))
}));
jest.mock('@ai-sdk/openai', () => ({
	createOpenAI: jest.fn(() => jest.fn(() => 'openai-model-stub'))
}));
jest.mock('@ai-sdk/anthropic', () => ({
	createAnthropic: jest.fn(() => jest.fn(() => 'anthropic-model-stub'))
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateObject } = require('ai') as { generateObject: jest.Mock };

function makeInput(overrides: Partial<BrandVoiceRequest> = {}): BrandVoiceRequest {
	return {
		provider: 'google',
		apiKey: 'AIza' + 'T'.repeat(35),
		productName: 'Manta Estrella',
		fabricDetails: 'Muselina de algodón orgánico doble capa, color crema',
		instagramVibe: 'noche tranquila de verano',
		outputLanguage: 'es',
		...overrides
	};
}

describe('generateBrandVoicePrompt — success', () => {
	beforeEach(() => jest.clearAllMocks());

	it.each([
		['google', 'AIza' + 'T'.repeat(35)],
		['openai', 'sk-' + 'a'.repeat(40)],
		['anthropic', 'sk-ant-' + 'a'.repeat(40)]
	] as const)('returns Ok tuple for provider "%s"', async (provider, apiKey) => {
		generateObject.mockResolvedValueOnce({ object: MOCK_RESPONSE });

		const result = await generateBrandVoicePrompt(makeInput({ provider, apiKey }));

		expect(isOk(result)).toBe(true);
		expect(result[1]?.instagramCaption).toBe(MOCK_RESPONSE.instagramCaption);
		expect(result[1]?.imageGenerationPrompt).toBe(MOCK_RESPONSE.imageGenerationPrompt);
	});
});

describe('generateBrandVoicePrompt — errors', () => {
	beforeEach(() => jest.clearAllMocks());

	it('returns Err tuple tagged as AiProviderError when the SDK throws', async () => {
		generateObject.mockRejectedValueOnce(new Error('API quota exceeded'));
		const result = await generateBrandVoicePrompt(makeInput());
		expect(isErr(result)).toBe(true);
		expect(isAiProviderError(result[0])).toBe(true);
	});

	it('error message includes the "AI generation failed" prefix', async () => {
		generateObject.mockRejectedValueOnce(new Error('Network timeout'));
		const result = await generateBrandVoicePrompt(makeInput());
		expect(isErr(result)).toBe(true);
		expect(result[0]?.message).toContain('AI generation failed');
	});

	it('does not expose a Google API key in sanitized error messages', async () => {
		const key = 'AIza' + 'T'.repeat(35);
		generateObject.mockRejectedValueOnce(new Error(`Request failed with key ${key} details`));
		const result = await generateBrandVoicePrompt(makeInput({ apiKey: key }));
		expect(isErr(result)).toBe(true);
		expect(result[0]?.message).not.toContain(key);
	});

	it('does not expose an OpenAI key in sanitized error messages', async () => {
		const key = 'sk-' + 'b'.repeat(40);
		generateObject.mockRejectedValueOnce(new Error(`Invalid key: ${key}`));
		const result = await generateBrandVoicePrompt(makeInput({ provider: 'openai', apiKey: key }));
		expect(isErr(result)).toBe(true);
		expect(result[0]?.message).not.toContain(key);
	});

	it('does not expose an Anthropic key in sanitized error messages', async () => {
		const key = 'sk-ant-' + 'c'.repeat(40);
		generateObject.mockRejectedValueOnce(new Error(`Auth error with key ${key}`));
		const result = await generateBrandVoicePrompt(makeInput({ provider: 'anthropic', apiKey: key }));
		expect(isErr(result)).toBe(true);
		expect(result[0]?.message).not.toContain(key);
	});
});
