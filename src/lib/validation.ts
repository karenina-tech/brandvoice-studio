import { z } from 'zod';

const stripHtml = (value: string): string =>
  value.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, '').trim();

const blockSqlPatterns = (value: string): boolean => {
  const sqlPattern =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|DECLARE|CAST|CONVERT|CHAR|NCHAR|VARCHAR|XP_)\b|--|;(?!\s*$)|\/\*|\*\/)/i;
  return !sqlPattern.test(value);
};

const safeString = (min: number, max: number) =>
  z
    .string()
    .transform(stripHtml)
    .pipe(
      z
        .string()
        .min(min, `Must be at least ${min} characters`)
        .max(max, `Must be at most ${max} characters`)
        .refine(blockSqlPatterns, 'Input contains forbidden syntax patterns'),
    );

export const OUTPUT_LANGUAGES = ['es', 'en', 'pt', 'fr'] as const;
export type OutputLanguage = (typeof OUTPUT_LANGUAGES)[number];

export const AI_PROVIDERS = ['google', 'openai', 'anthropic'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

export const aiProviderSchema = z.enum(AI_PROVIDERS);

export const AI_KEY_PATTERNS: Record<AiProvider, RegExp> = {
  google: /^AIza[0-9A-Za-z\-_]{35}$/,
  openai: /^sk-[A-Za-z0-9\-_]{20,200}$/,
  anthropic: /^sk-ant-[A-Za-z0-9\-_]{20,200}$/,
};

export const aiApiKeySchema = z
  .string()
  .min(1, 'API key is required')
  .max(300, 'API key too long')
  .regex(/^[A-Za-z0-9\-_]+$/, 'API key contains invalid characters');

export const brandVoiceInputSchema = z.object({
  productName: safeString(2, 100),
  fabricDetails: safeString(5, 500),
  instagramVibe: safeString(3, 200),
  outputLanguage: z.enum(OUTPUT_LANGUAGES).default('es'),
});

export const brandVoiceRequestSchema = brandVoiceInputSchema
  .extend({
    provider: aiProviderSchema,
    apiKey: aiApiKeySchema,
  })
  .superRefine((data, ctx) => {
    if (!AI_KEY_PATTERNS[data.provider].test(data.apiKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['apiKey'],
        message: `Invalid API key format for provider "${data.provider}"`,
      });
    }
  });

export const brandVoiceResponseSchema = z.object({
  instagramCaption: z.string().min(1),
  imageGenerationPrompt: z.string().min(1),
});

export type BrandVoiceInput = z.infer<typeof brandVoiceInputSchema>;
export type BrandVoiceRequest = z.infer<typeof brandVoiceRequestSchema>;
export type BrandVoiceResponse = z.infer<typeof brandVoiceResponseSchema>;
