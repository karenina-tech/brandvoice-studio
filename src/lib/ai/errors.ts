export type AiProviderError = Error & { readonly _tag: 'AiProviderError' };
export type ApiError = Error & { readonly _tag: 'ApiError'; readonly statusCode: number };

export function makeAiProviderError(message: string): AiProviderError {
  return Object.assign(new Error(message), { _tag: 'AiProviderError' as const });
}

export function isAiProviderError(e: unknown): e is AiProviderError {
  return e instanceof Error && (e as AiProviderError)._tag === 'AiProviderError';
}

export function makeApiError(message: string, statusCode: number): ApiError {
  return Object.assign(new Error(message), { _tag: 'ApiError' as const, statusCode });
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && (e as ApiError)._tag === 'ApiError';
}
