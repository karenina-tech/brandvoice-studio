import { NextRequest, NextResponse } from 'next/server';
import { brandVoiceInputSchema, brandVoiceRequestSchema, aiProviderSchema } from '@/lib/validation';
import type { BrandVoiceRequest, AiProvider } from '@/lib/validation';
import { generateBrandVoicePrompt } from '@/lib/ai/generateBrandVoice';
import { isErr, isOk } from '@/lib/result';
import { isAiProviderError } from '@/lib/ai/errors';
import { isAllowed } from '@/lib/server/RateLimiter';
import type { RateRecord } from '@/lib/server/RateLimiter';
import { checkUserCredits, decrementUserCredit } from '@/services/db-service';

// Module-level Maps persist across requests on the same server process.
// For horizontally-scaled deployments, replace with @upstash/ratelimit backed by Redis.
const globalStore = new Map<string, RateRecord>();
const routeStore = new Map<string, RateRecord>();

function resolveProvider(raw: string): AiProvider {
  const parsed = aiProviderSchema.safeParse(raw);
  return parsed.success ? parsed.data : 'google';
}

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate body fields — common to both paths
  const bodyValidation = brandVoiceInputSchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: bodyValidation.error.flatten() },
      { status: 400 },
    );
  }

  const clientApiKey = request.headers.get('x-ai-api-key');

  // ── Path A: BYOK — client supplies their own key ──────────────────────────────
  if (clientApiKey) {
    const clientProvider = request.headers.get('x-ai-provider');
    if (!clientProvider) {
      return NextResponse.json({ error: 'Missing X-AI-Provider header' }, { status: 400 });
    }

    const fullValidation = brandVoiceRequestSchema.safeParse({
      ...bodyValidation.data,
      provider: clientProvider,
      apiKey: clientApiKey,
    });
    if (!fullValidation.success) {
      return NextResponse.json(
        { error: 'Invalid provider or API key', details: fullValidation.error.flatten() },
        { status: 400 },
      );
    }

    const result = await generateBrandVoicePrompt(fullValidation.data);
    if (isErr(result)) {
      const e = result[0];
      if (isAiProviderError(e)) return NextResponse.json({ error: e.message }, { status: 502 });
      console.error('[generate/byok] Unexpected error:', e.message);
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
    return NextResponse.json(isOk(result) ? result[1] : null, { status: 200 });
  }

  // ── Path B: Managed Credits — server uses master env-var key ─────────────────
  const masterApiKey = process.env.MASTER_AI_API_KEY ?? '';
  if (!masterApiKey) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  const creditsResult = await checkUserCredits(ip);
  if (isErr(creditsResult)) {
    return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
  }

  const { credits } = creditsResult[1];
  if (credits <= 0) {
    return NextResponse.json(
      {
        error:
          'Créditos agotados. Por favor, recarga tu saldo o añade una clave API para continuar.',
      },
      { status: 402 },
    );
  }

  const masterProvider = resolveProvider(process.env.MASTER_AI_PROVIDER ?? 'google');
  // Construct input with server-side keys — MASTER_AI_API_KEY is NEVER echoed in responses
  const managedInput: BrandVoiceRequest = {
    ...bodyValidation.data,
    provider: masterProvider,
    apiKey: masterApiKey,
  };

  const result = await generateBrandVoicePrompt(managedInput);
  if (isErr(result)) {
    const e = result[0];
    if (isAiProviderError(e)) return NextResponse.json({ error: e.message }, { status: 502 });
    console.error('[generate/managed] Unexpected error:', e.message);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }

  // Decrement only after confirmed successful generation — preserves credits on AI failures
  await decrementUserCredit(ip);
  return NextResponse.json(isOk(result) ? result[1] : null, { status: 200 });
}
