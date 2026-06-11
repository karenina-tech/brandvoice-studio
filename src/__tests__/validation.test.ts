import {
  aiProviderSchema,
  aiApiKeySchema,
  brandVoiceInputSchema,
  brandVoiceRequestSchema,
  AI_PROVIDERS,
  AI_KEY_PATTERNS,
} from '@/lib/validation';

const VALID_KEYS: Record<string, string> = {
  google: 'AIza' + 'T'.repeat(35),
  openai: 'sk-' + 'a'.repeat(40),
  anthropic: 'sk-ant-' + 'a'.repeat(40),
};

const BASE_INPUT = {
  productName: 'Manta Estrella',
  fabricDetails: 'Muselina de algodón orgánico doble capa, color crema',
  instagramVibe: 'tarde de verano',
  outputLanguage: 'es' as const,
};

describe('aiProviderSchema', () => {
  it.each(AI_PROVIDERS)('accepts valid provider "%s"', (provider) => {
    expect(aiProviderSchema.safeParse(provider).success).toBe(true);
  });

  it('rejects unknown provider strings', () => {
    expect(aiProviderSchema.safeParse('gemini').success).toBe(false);
    expect(aiProviderSchema.safeParse('cohere').success).toBe(false);
    expect(aiProviderSchema.safeParse('').success).toBe(false);
  });
});

describe('aiApiKeySchema', () => {
  it('rejects an empty string', () => {
    expect(aiApiKeySchema.safeParse('').success).toBe(false);
  });

  it('rejects strings with spaces or HTML characters', () => {
    expect(aiApiKeySchema.safeParse('key with spaces').success).toBe(false);
    expect(aiApiKeySchema.safeParse('key<script>').success).toBe(false);
  });

  it('rejects strings longer than 300 characters', () => {
    expect(aiApiKeySchema.safeParse('a'.repeat(301)).success).toBe(false);
  });

  it('accepts a plausible alphanumeric key string', () => {
    expect(aiApiKeySchema.safeParse('sk-abc123-valid').success).toBe(true);
  });
});

describe('AI_KEY_PATTERNS', () => {
  it.each(Object.entries(VALID_KEYS))('pattern for "%s" matches its own valid key', (provider, key) => {
    expect(AI_KEY_PATTERNS[provider as keyof typeof AI_KEY_PATTERNS].test(key)).toBe(true);
  });

  it('google pattern rejects an OpenAI key', () => {
    expect(AI_KEY_PATTERNS.google.test(VALID_KEYS.openai!)).toBe(false);
  });

  it('openai pattern rejects a Google key', () => {
    expect(AI_KEY_PATTERNS.openai.test(VALID_KEYS.google!)).toBe(false);
  });

  it('anthropic pattern rejects an OpenAI key', () => {
    expect(AI_KEY_PATTERNS.anthropic.test(VALID_KEYS.openai!)).toBe(false);
  });
});

describe('brandVoiceRequestSchema — cross-field API key validation', () => {
  it.each(Object.entries(VALID_KEYS))('accepts a valid %s request', (provider, apiKey) => {
    const result = brandVoiceRequestSchema.safeParse({ ...BASE_INPUT, provider, apiKey });
    expect(result.success).toBe(true);
  });

  it('rejects a Google key submitted as the openai provider', () => {
    const result = brandVoiceRequestSchema.safeParse({
      ...BASE_INPUT,
      provider: 'openai',
      apiKey: VALID_KEYS.google,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const keyError = result.error.issues.find((i) => i.path.includes('apiKey'));
      expect(keyError).toBeDefined();
    }
  });

  it('rejects an Anthropic key submitted as the google provider', () => {
    const result = brandVoiceRequestSchema.safeParse({
      ...BASE_INPUT,
      provider: 'google',
      apiKey: VALID_KEYS.anthropic,
    });
    expect(result.success).toBe(false);
  });

  it('rejects requests without a provider field', () => {
    const result = brandVoiceRequestSchema.safeParse({
      ...BASE_INPUT,
      apiKey: VALID_KEYS.google,
    });
    expect(result.success).toBe(false);
  });

  it('rejects requests without an apiKey field', () => {
    const result = brandVoiceRequestSchema.safeParse({
      ...BASE_INPUT,
      provider: 'google',
    });
    expect(result.success).toBe(false);
  });
});

describe('brandVoiceInputSchema — XSS protection', () => {
  it('strips HTML tags from productName', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: '<script>alert(1)</script>MantaBebé',
      fabricDetails: 'Tela de algodón suave',
      instagramVibe: 'verano tranquilo',
      outputLanguage: 'es',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.productName).toBe('MantaBebé');
    }
  });

  it('strips HTML entities from fabricDetails', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: 'MantaBebé',
      fabricDetails: '&lt;b&gt;Tela suave&lt;/b&gt; con bordado floral',
      instagramVibe: 'cálido y acogedor',
      outputLanguage: 'es',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fabricDetails).not.toContain('&lt;');
    }
  });
});

describe('brandVoiceInputSchema — SQL injection protection', () => {
  it('rejects productName containing a SQL DROP statement', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: "'; DROP TABLE users; --",
      fabricDetails: 'Algodón orgánico',
      instagramVibe: 'playa',
    });
    expect(result.success).toBe(false);
  });

  it('rejects fabricDetails containing UNION SELECT', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: 'MantaBebé',
      fabricDetails: 'Algodón UNION SELECT * FROM secrets --',
      instagramVibe: 'verano',
    });
    expect(result.success).toBe(false);
  });
});

describe('brandVoiceInputSchema — field length validation', () => {
  it('rejects productName shorter than 2 characters', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: 'A',
      fabricDetails: 'Tela suave',
      instagramVibe: 'verano',
    });
    expect(result.success).toBe(false);
  });

  it('rejects fabricDetails longer than 500 characters', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: 'MantaBebé',
      fabricDetails: 'A'.repeat(501),
      instagramVibe: 'verano',
    });
    expect(result.success).toBe(false);
  });

  it('defaults outputLanguage to "es" when omitted', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: 'MantaBebé',
      fabricDetails: 'Tela de algodón suave',
      instagramVibe: 'verano',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.outputLanguage).toBe('es');
  });

  it('rejects an unsupported outputLanguage code', () => {
    const result = brandVoiceInputSchema.safeParse({
      productName: 'MantaBebé',
      fabricDetails: 'Tela suave',
      instagramVibe: 'verano',
      outputLanguage: 'zh',
    });
    expect(result.success).toBe(false);
  });
});
