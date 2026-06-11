import { NextRequest, NextResponse } from 'next/server';
import { brandVoiceRequestSchema } from '@/lib/validation';
import { generateBrandVoicePrompt } from '@/lib/ai/generateBrandVoice';
import { isErr, isOk } from '@/lib/result';
import { isAiProviderError } from '@/lib/ai/errors';
import { isAllowed } from '@/lib/server/RateLimiter';
import type { RateRecord } from '@/lib/server/RateLimiter';

// Module-level Maps persist across requests on the same server process.
// For horizontally-scaled deployments, replace with @upstash/ratelimit backed by Redis.
const globalStore = new Map<string, RateRecord>();
const routeStore = new Map<string, RateRecord>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (!isAllowed(globalStore, 15 * 60 * 1000, 10, ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  if (!isAllowed(routeStore, 60 * 1000, 3, ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const contentLength = parseInt(request.headers.get('content-length') ?? '0', 10);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  const provider = request.headers.get('x-ai-provider');
  const apiKey = request.headers.get('x-ai-api-key');

  if (!provider) {
    return NextResponse.json({ error: 'Missing X-AI-Provider header' }, { status: 401 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing X-AI-Api-Key header' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = brandVoiceRequestSchema.safeParse({
    ...(body as object),
    provider,
    apiKey,
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const result = await generateBrandVoicePrompt(validation.data);

  if (isErr(result)) {
    const error = result[0];
    if (isAiProviderError(error)) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error('[generate] Unexpected error:', error.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 },
    );
  }

  return NextResponse.json(isOk(result) ? result[1] : null, { status: 200 });
}
