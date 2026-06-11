# AGENTS.md — BrandVoice Studio

Authoritative reference for any agent (human or AI) contributing to this codebase.
Read this before writing a single line.

---

## What This Project Is

BrandVoice Studio is a BYOK (Bring Your Own Key) web app that generates Instagram captions
and image-generation prompts for boutique textile products using a user-selected AI provider.

- **Three supported providers:** Google (Gemini 1.5 Flash), OpenAI (GPT-4o mini), Anthropic (Claude Haiku).
- **The user supplies her own API key** for her chosen provider via a Settings UI panel.
- **The key never touches our servers persistently.** The provider selection and key live only
  in the user's `localStorage` under `ai_provider` and `ai_api_key`, and travel as
  per-request HTTP headers to the Next.js Route Handler.
- **The UI is entirely in Spanish.** All code, variables, API fields, and schemas are in English.
- **There is no database.** All data is transient — request in, response out.

---

## Tech Stack (exact pinned versions — do not add `^` or `~`)

| Layer                   | Technology                         | Version           |
| ----------------------- | ---------------------------------- | ----------------- |
| Framework               | Next.js App Router                 | 15.0.4            |
| Frontend runtime        | React                              | 18.3.1            |
| Frontend styling        | Tailwind CSS + tailwindcss-animate | 3.4.14 / 1.0.7    |
| Internationalisation    | i18next + react-i18next            | 23.16.2 / 15.1.0  |
| AI SDK core             | `ai` (Vercel AI SDK)               | 4.3.5             |
| AI provider — Google    | `@ai-sdk/google`                   | 1.0.15            |
| AI provider — OpenAI    | `@ai-sdk/openai`                   | 1.3.22            |
| AI provider — Anthropic | `@ai-sdk/anthropic`                | 1.2.12            |
| Validation              | Zod                                | 3.23.8            |
| Language                | TypeScript                         | 5.6.3             |
| Test runner             | Jest + `next/jest` (SWC)           | 29.7.0            |
| Git hooks               | Husky                              | 9.1.7 (v9 syntax) |

**Dependency policy:** `package.json` uses exact SemVer. Never introduce a `^` or `~`
prefix. Rationale: supply-chain attack mitigation — deterministic builds only.

---

## Repository Structure

This is a **unified Next.js App Router application**. One `package.json`, one `tsconfig.json`,
one `node_modules`. There is no npm workspaces setup.

```
brandvoice-studio/
├── .husky/
│   └── pre-commit              ← runs `npm run verify` on every git commit
├── src/
│   ├── app/
│   │   ├── api/generate/
│   │   │   └── route.ts        ← SECURE BACKEND (Next.js Route Handler)
│   │   ├── globals.css
│   │   ├── layout.tsx          ← Root layout: next/font/google + Providers wrapper
│   │   ├── page.tsx            ← Main UI (client component, Spanish)
│   │   └── providers.tsx       ← 'use client' I18nextProvider boundary
│   ├── components/
│   │   ├── BrandVoiceForm.tsx
│   │   ├── OutputDisplay.tsx
│   │   └── SettingsPanel.tsx
│   ├── hooks/
│   │   └── useApiKey.ts        ← React bridge over pure apiKeyManager functions
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── createModel.ts          ← createProviderModel(provider, apiKey): LanguageModel
│   │   │   ├── errors.ts               ← makeAiProviderError / makeApiError / type guards
│   │   │   ├── generateBrandVoice.ts   ← generateBrandVoicePrompt(input): Promise<Result<…>>
│   │   │   ├── prompts.ts              ← buildSystemPrompt / buildUserPrompt
│   │   │   └── sanitize.ts             ← sanitizeErrorMessage — strips key patterns
│   │   ├── server/
│   │   │   └── RateLimiter.ts  ← isAllowed(store, windowMs, max, key): boolean
│   │   ├── ApiKeyManager.ts    ← Pure functions: readStoredProvider, persistApiSettings, …
│   │   ├── i18n.ts             ← i18next initialization (client-side, guarded)
│   │   ├── result.ts           ← Result<T> type + ok / err / isOk / isErr helpers
│   │   └── validation.ts       ← SINGLE SOURCE OF TRUTH for all Zod schemas + types
│   ├── locales/
│   │   └── es.json             ← All user-facing strings in Spanish
│   └── services/
│       └── apiService.ts       ← generatePrompt(input, provider, apiKey): Promise<Result<…>>
├── jest.config.js
├── jest.setup.ts
├── next.config.js              ← Next.js config (no headers — see src/middleware.ts)
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Module function map

```
result.ts
  ok<T>(data) → Ok<T>
  err(e)      → Err
  isOk(r)     → r is Ok<T>
  isErr(r)    → r is Err

lib/ai/errors.ts
  makeAiProviderError(msg)          → AiProviderError (tagged Error)
  makeApiError(msg, statusCode)     → ApiError (tagged Error)
  isAiProviderError(e)              → type guard
  isApiError(e)                     → type guard

lib/ai/sanitize.ts
  sanitizeErrorMessage(msg)         → string (strips key patterns)

lib/ai/prompts.ts
  buildSystemPrompt(outputLanguage) → string
  buildUserPrompt(input)            → string

lib/ai/createModel.ts
  createProviderModel(provider, apiKey) → LanguageModel

lib/ai/generateBrandVoice.ts
  generateBrandVoicePrompt(input)     → Promise<Result<BrandVoiceResponse>>

lib/server/RateLimiter.ts
  isAllowed(store, windowMs, max, key) → boolean

lib/ApiKeyManager.ts
  readStoredProvider()              → AiProvider
  readStoredApiKey()                → string
  validateApiSettings(p, k)         → boolean
  persistApiSettings(p, k)          → boolean
  clearApiSettings()                → void

services/apiService.ts
  generatePrompt(input, provider, key) → Promise<Result<BrandVoiceResponse>>
```

### Key files at a glance

| File                               | Purpose                                                                                                                                                                                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/validation.ts`            | **Single source of truth** for all Zod schemas and inferred TS types. Exports `AI_PROVIDERS`, `AiProvider`, `aiProviderSchema`, `aiApiKeySchema`, `AI_KEY_PATTERNS`, `brandVoiceRequestSchema`, `brandVoiceResponseSchema`. Cross-field key-format validation via `superRefine`. |
| `src/lib/result.ts`                | `Result<T> = Ok<T> \| Err` tuple type. `ok()`, `err()`, `isOk()`, `isErr()` helpers. The entire application uses this instead of `throw`/`catch`.                                                                                                                                |
| `src/lib/ai/generateBrandVoice.ts` | Core AI function. Calls `createProviderModel`, `buildSystemPrompt/UserPrompt`, `generateObject`, and catches SDK errors into `makeAiProviderError`. Never throws — always returns a `Result`.                                                                                    |
| `src/lib/server/RateLimiter.ts`    | Pure `isAllowed()` function. The route handler passes module-level `Map` instances as the `store` argument.                                                                                                                                                                      |
| `src/lib/ApiKeyManager.ts`         | All `localStorage` logic as pure functions consumed by `useApiKey` hook.                                                                                                                                                                                                         |
| `src/app/api/generate/route.ts`    | `POST /api/generate`. Owns two module-level `Map` singletons for rate limiting, extracts headers, runs Zod parse, calls `generateBrandVoicePrompt`, destructures the `Result` tuple.                                                                                             |
| `src/hooks/useApiKey.ts`           | Thin React bridge: `useState` init + callbacks delegating to `ApiKeyManager` functions. No localStorage logic of its own.                                                                                                                                                        |
| `src/services/apiService.ts`       | Pure `generatePrompt()` — wraps `fetch` and returns `Promise<Result<BrandVoiceResponse>>`. Never throws.                                                                                                                                                                         |
| `src/locales/es.json`              | All user-facing strings. Add new Prompt here first, then reference via `t('key.path')`.                                                                                                                                                                                          |
| `src/middleware.ts`                | All HTTP security headers per request: nonce-bearing CSP (`script-src 'self' 'nonce-{n}'`), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Sets `x-nonce` on request headers so Next.js stamps its inline RSC scripts. |

---

## Verification Pipeline

```bash
npm run verify
```

This is the **only command a CI system or pre-commit hook needs to call**. It runs these
four steps sequentially and exits on first failure:

```
npm run audit        →  npm audit --audit-level=moderate
npm run type-check   →  tsc --noEmit
npm run test         →  jest --forceExit
npm run build        →  next build
```

The `.husky/pre-commit` hook runs `npm run verify` automatically on every `git commit`.
You cannot bypass it without `--no-verify`. Don't use `--no-verify`.

### Development commands

```bash
# Install dependencies
npm install

# Run development server (frontend + API routes together)
npm run dev               # http://localhost:3000

# Type-check only
npm run type-check

# Tests only
npm run test

# Full verification before committing
npm run verify
```

### First-time setup

```bash
cd brandvoice-studio
npm install              # install all dependencies
npm run verify           # confirm the baseline is green before changing anything
```

---

## Architectural Conventions

### 0. Functional Programming — strict rules

This codebase is **purely functional**. These rules are non-negotiable:

| Rule                         | Detail                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| No `class`                   | No class declarations anywhere in `src/`                                                                             |
| No `this`                    | No `this` keyword anywhere in `src/`                                                                                 |
| No `new` (user-defined)      | `new` is only allowed for native built-ins: `new Error()`, `new Map()`, `new Date()`                                 |
| No inheritance               | No `extends` for user-defined types                                                                                  |
| No `throw`                   | Errors are returned as `Result<T>` tuples, never thrown                                                              |
| No `try/catch` at call sites | Error handling lives inside the function that returns `Result`; callers destructure                                  |
| Pure functions               | Functions depend only on their arguments; no hidden mutable state except module-level `Map` stores for rate limiting |

**Result tuple pattern:** `Result<T> = readonly [null, T] | readonly [Error, null]`

```typescript
// Always return Results, never throw:
const result = await generateBrandVoicePrompt(input);
if (isErr(result)) {
	const error = result[0]; // Error with _tag
	// handle...
} else {
	const data = result[1]; // T — narrowed by TypeScript
}
```

**Tagged errors** use `Object.assign(new Error(msg), { _tag: '...' as const })` — no subclasses.
Use `isAiProviderError(e)` / `isApiError(e)` type guards, not `instanceof`.

### 1. `src/lib/validation.ts` is the contract — never duplicate it

All Zod schemas and their inferred TypeScript types live in `src/lib/validation.ts`.
Both client code (`apiService.ts`, `useApiKey.ts`, components) and server code
(`src/app/api/generate/route.ts`, `generateBrandVoice.ts`) import from `@/lib/validation`.
If you change a field, change it once in `validation.ts` and all sides pick it up.
Never redefine a schema inline in a route or component.

The `AI_KEY_PATTERNS` record is exported from `validation.ts` and consumed by both
the `brandVoiceRequestSchema` `superRefine` (server validation) and `ApiKeyManager.ts` (client
validation). If you change a key pattern, change it in `validation.ts` only.

### 2. Validation is a pipeline, not a one-off

Every request passes through this exact chain:

```
client Zod parse (apiService.ts — brandVoiceInputSchema.safeParse)
  → POST /api/generate with X-AI-Provider + X-AI-Api-Key headers
    → server Zod + superRefine parse (brandVoiceRequestSchema.safeParse)
      → generateBrandVoicePrompt()
        → generateObject() validates response against brandVoiceResponseSchema
```

If you add a new field, add it to the Zod schema in `validation.ts` first, then thread it
through this chain. Don't skip steps.

### 3. The API key is transient — treat it as radioactive

- The key is **never** written to a database, log file, environment variable, or module-level
  variable.
- Provider model instances are created inside `createProviderModel()` in `createModel.ts`, scoped
  to the call stack of `generateBrandVoicePrompt()`. Keep the instantiation inside that function.
- `sanitizeErrorMessage()` in `sanitize.ts` strips all three provider key formats
  (`AIza...`, `sk-...`, `sk-ant-...`) from error strings before they reach the HTTP response.
  Don't remove it.
- Route Handler logs errors to `console.error` with `err.message` only — never `err.stack`
  or the full request object.

### 4. `'use client'` boundary discipline

In the Next.js App Router, server components are the default. Only mark a file `'use client'`
when it uses React hooks, browser APIs, or event handlers.

| File                               | Boundary       | Why                                          |
| ---------------------------------- | -------------- | -------------------------------------------- |
| `src/app/layout.tsx`               | Server         | Font loading via `next/font/google`          |
| `src/app/providers.tsx`            | `'use client'` | I18nextProvider requires React context       |
| `src/app/page.tsx`                 | `'use client'` | `useState`, `useApiKey`, event handlers      |
| `src/components/*.tsx`             | `'use client'` | All use hooks or event handlers              |
| `src/hooks/useApiKey.ts`           | `'use client'` | `useState`, `localStorage`                   |
| `src/app/api/generate/route.ts`    | Server         | Route Handler — always server-side           |
| `src/lib/validation.ts`            | Either         | Pure Zod — no browser APIs, no React         |
| `src/lib/ai/generateBrandVoice.ts` | Server         | AI SDK — server-only imports                 |
| `src/lib/i18n.ts`                  | Client         | Imported via `providers.tsx` client boundary |

Do not import `generateBrandVoice.ts` or any Vercel AI SDK package from a `'use client'` file.
The AI SDK contains Node.js-only modules that will break in the browser bundle.

### 5. Security headers are in `src/middleware.ts`

All HTTP security headers are set in `src/middleware.ts`, not `next.config.js`. The `next.config.js`
`headers()` function runs **after** middleware and would overwrite the response headers — including the
per-request CSP nonce that Next.js App Router requires to hydrate.

**Why nonces are required:** Next.js App Router injects inline `<script>` tags (the `self.__next_f`
push pattern) to stream the React Server Component payload to the client. Without a nonce (or
`'unsafe-inline'`, which is forbidden), `script-src 'self'` blocks these scripts and React never
hydrates — the page renders as static HTML with no event handlers.

The middleware generates a cryptographically random nonce per request, sets it as both:
- `x-nonce` on the **request** headers (Next.js reads this during SSR to nonce-stamp its own scripts)
- `'nonce-{value}'` in the `Content-Security-Policy` **response** header (browser validates against it)

Do not add a `headers()` call to `next.config.js` for CSP. Do not add `'unsafe-inline'` to
`script-src`. The `style-src 'unsafe-inline'` allowance is intentional (Tailwind injects inline styles).

### 6. Rate limiting is in-memory and request-scoped

The Route Handler in `src/app/api/generate/route.ts` maintains two `Map`-based rate limiters:

- Global: 10 requests / 15 minutes per IP
- Route: 3 requests / 1 minute per IP

These are module-level `Map` instances passed into the pure `isAllowed()` function. **They reset
on server restart** and **are not shared across multiple Next.js instances** (e.g., Vercel Edge
Network replicas). For production horizontal scaling, replace with `@upstash/ratelimit` backed
by Redis. Do not remove the limiters without a replacement.

### 7. i18n — all user-facing strings go through `t()`

The UI language is Spanish. Every string a user can read must be a key in
`src/locales/es.json` and rendered with the `useTranslation` hook:

```tsx
const { t } = useTranslation();
<p>{t('errors.generic')}</p>;
```

Never hardcode Spanish (or any human language) text directly in JSX.
English is for code identifiers only.

### 8. TypeScript strictness

`tsconfig.json` enables `"strict": true` plus `"noUncheckedIndexedAccess": true`.
Array and object index access returns `T | undefined`. Handle it.

```typescript
// Wrong — TypeScript will reject this
const first = items[0].name;

// Correct
const first = items[0]?.name;
```

The path alias `@/*` maps to `./src/*`. Always use `@/` imports — never relative paths
that cross directory boundaries (e.g., `../../lib/validation`).

### 9. No comments explaining what the code does

Comments are reserved for **non-obvious constraints** — a hidden invariant, a security
rationale, a workaround. If removing the comment would not confuse a future reader, don't
write it. Function and variable names carry the "what".

---

## Security Invariants — Never Break These

These are hard constraints, not guidelines. Breaking any of them introduces a known attack
vector.

| #   | Invariant                                                                              | Rationale                                                     |
| --- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | No file upload endpoints, ever                                                         | Eliminates RCE vectors (malware/ransomware)                   |
| 2   | No raw string interpolation into SQL or shell commands                                 | No DB exists, but this blocks prompt injection escalation     |
| 3   | Security headers in `src/middleware.ts` apply to all non-static routes                 | Headers must appear on all page and API responses             |
| 4   | `blockSqlPatterns` refine stays in `safeString()` in `validation.ts`                   | Guards against SQL-like prompt injection into the AI model    |
| 5   | `stripHtml` transform stays before `.min()/.max()` in `safeString()`                   | Prevents XSS payloads measuring as "valid length" after strip |
| 6   | Provider model instantiated per request inside `createProviderModel()`, not per module | Key never lives beyond the request call stack                 |
| 7   | `script-src 'self'` in CSP — no wildcards, no `unsafe-inline` for scripts              | Third-party scripts can never read `localStorage` keys        |
| 8   | All `package.json` deps use exact SemVer                                               | Deterministic builds prevent silent supply-chain compromise   |
| 9   | Error responses never include stack traces or env variable values                      | Prevents information leakage to attackers                     |
| 10  | Body size guard (16 KB check on `content-length` header)                               | Prevents payload-flood DoS                                    |

---

## Adding a New Output Language

1. Add the language code to `OUTPUT_LANGUAGES` in `src/lib/validation.ts`.
2. Update `buildSystemPrompt()` in `src/lib/ai/prompts.ts` if language-specific banned words are needed.
3. Add a translation entry in `src/locales/es.json` under `form.outputLanguage`.
4. Add a test case to `src/__tests__/validation.test.ts` for the new enum value.
5. Run `npm run verify`.

---

## Adding a New AI Provider

1. Add the provider identifier to `AI_PROVIDERS` in `src/lib/validation.ts`.
2. Add its key regex to `AI_KEY_PATTERNS` in `src/lib/validation.ts`.
3. Install the corresponding `@ai-sdk/<provider>` package at an exact version in `package.json`.
4. Add a `case` branch to `createProviderModel()` in `src/lib/ai/createModel.ts`.
5. Add provider label strings to `src/locales/es.json` under `settings.providers`.
6. Add key placeholder and format hint strings under `settings.key_placeholder_<provider>` and `settings.format_hint_<provider>`.
7. Add test coverage in `src/__tests__/ai-factory.test.ts` and `src/__tests__/useApiKey.test.ts`.
8. Run `npm run verify`.

---

## Adding a New API Route

1. Add the Zod request schema to `src/lib/validation.ts`.
2. Create `src/app/api/<route-name>/route.ts` as a Next.js Route Handler.
3. Prompt the rate limiter pattern from `src/app/api/generate/route.ts` — never skip it.
4. Use `schema.safeParse()` — never trust unvalidated `request.json()` output.
5. Write at least one test covering the happy path and one rejection.

---

## Testing Conventions

- **Test files** live in `src/__tests__/`.
- **`@jest-environment node`** docblock is required in `ai-factory.test.ts` (AI SDK imports
  use Node.js built-ins that break under jsdom).
- **Hook tests** use `@testing-library/react`'s `renderHook` + `act`. Mock `localStorage`
  via `localStorage.clear()` in `beforeEach`.
- **AI SDK modules** are always fully mocked in tests — no real network calls:
  - `jest.mock('ai', () => ({ generateObject: jest.fn() }))`
  - `jest.mock('@ai-sdk/google', ...)`, `jest.mock('@ai-sdk/openai', ...)`, `jest.mock('@ai-sdk/anthropic', ...)`
- **Result tuple assertions:** Check `isOk(result)` / `isErr(result)` before accessing `result[1]` / `result[0]`.
- **Module resolution** in Jest: `next/jest` auto-reads `paths` from `tsconfig.json` and
  sets up `moduleNameMapper` for `@/*`. The explicit `moduleNameMapper` in `jest.config.js`
  reinforces this for clarity.
- The default Jest environment is `jsdom` (configured in `jest.config.js`). Override per-file
  with a `@jest-environment node` docblock when testing server-only modules.

---

## Deployment

Deployed on **Vercel**. Zero config required — Vercel auto-detects Next.js.

```bash
# Vercel CLI
vercel deploy
```

Security headers (`src/middleware.ts`) are applied by Next.js at runtime and
do not need to be duplicated in any Vercel dashboard or config file.

**No environment variables are required** for runtime. AI provider API keys are **never
environment variables** — they are entered by the user at runtime, stored only in
`localStorage`, and sent per-request via headers.

---

## What This Project Deliberately Does Not Have

These are intentional absences, not missing features. Do not add them.

- **No database.** Data is transient by design.
- **No authentication system.** The API key is the user's credential.
- **No file upload endpoint.** The entire API surface is text-only.
- **No server-side key storage.** BYOK means the server is stateless.
- **No inline `eval()` or `dangerouslySetInnerHTML`.** AI output is always rendered
  as text content, never as HTML.
- **No hardcoded provider.** The provider is always user-selected and request-scoped.
- **No classes, inheritance, or `this`.** All logic is pure functions. See Convention 0.
