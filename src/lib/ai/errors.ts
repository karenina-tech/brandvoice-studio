export type AiProviderError = Error & { readonly _tag: 'AiProviderError' };
export type ApiError = Error & { readonly _tag: 'ApiError'; readonly statusCode: number };
export type CreditError = Error & { readonly _tag: 'CreditError' };

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

export function makeCreditError(message: string): CreditError {
  return Object.assign(new Error(message), { _tag: 'CreditError' as const });
}

export function isCreditError(e: unknown): e is CreditError {
  return e instanceof Error && (e as CreditError)._tag === 'CreditError';
}
