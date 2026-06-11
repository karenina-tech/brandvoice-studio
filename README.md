# BrandVoice Studio

Generador de prompts para Instagram y contenido visual para marcas textiles artesanales.
Introduce los detalles de tu producto y obtén un caption listo para publicar y un prompt
para tu herramienta de generación de imágenes con IA — en segundos.

---

## Features

- **Captions para Instagram** y **prompts de generación de imágenes** generados por IA
- **Tres proveedores de IA:** Google Gemini, OpenAI GPT-4o mini, Anthropic Claude Haiku
- **Dos modos de uso:**
  - **Trae tu propia Llave (BYOK)** — usa tu clave de API personal. Completamente gratis.
    La clave nunca sale de tu navegador.
  - **Plan de Créditos** — sin configuración técnica. El servidor gestiona la IA por ti.
- **Multi-idioma:** salida disponible en español, inglés, portugués y francés
- **Seguridad primero:** CSP estricta con nonces por petición, HSTS, sin almacenamiento
  server-side de claves de usuario

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
git clone <repo-url>
cd brandvoice-studio
npm install
```

### Environment variables

Copia el archivo de ejemplo y rellena las variables necesarias:

```bash
cp .env.example .env.local
```

| Variable             | Requerida para      | Descripción                                           |
| -------------------- | ------------------- | ----------------------------------------------------- |
| `MASTER_AI_PROVIDER` | Plan de Créditos    | `google` \| `openai` \| `anthropic` (por defecto `google`) |
| `MASTER_AI_API_KEY`  | Plan de Créditos    | Clave maestra del operador. Nunca se expone al cliente. |

> El modo BYOK no requiere ninguna variable de entorno — las claves llegan por petición
> desde el navegador del usuario.

### Development

```bash
npm run dev        # http://localhost:3000
```

### Verification (type-check + tests + build)

```bash
npm run verify
```

---

## Usage

### Mode A — Trae tu propia Llave (BYOK)

1. Abre el panel **Configuración** (icono de engranaje, esquina superior derecha)
2. Selecciona la tarjeta **"Trae tu propia Llave"**
3. Elige tu proveedor y pega tu clave de API
4. **Cómo obtener una clave Gemini gratis:**
   - Ve a [aistudio.google.com](https://aistudio.google.com)
   - Inicia sesión con tu cuenta de Gmail
   - Haz clic en "Get API key" y cópiala
5. Guarda la configuración y empieza a generar prompts

### Mode B — Plan de Créditos

1. Abre el panel **Configuración**
2. Selecciona la tarjeta **"Plan de Créditos"**
3. El servidor gestiona la IA — tú solo rellenas el formulario y generas

---

## Tech Stack

| Layer           | Technology                        |
| --------------- | --------------------------------- |
| Framework       | Next.js App Router                |
| UI              | React 18 + Tailwind CSS           |
| i18n            | i18next + react-i18next           |
| AI              | Vercel AI SDK v4 (`generateObject`) |
| Validation      | Zod                               |
| Language        | TypeScript (strict mode)          |
| Tests           | Jest + Testing Library            |

---

## Architecture

This project is a **unified Next.js application** — one package, one `node_modules`.
No monorepo, no separate backend/frontend directories.

```
src/
├── app/
│   ├── api/generate/     ← POST — hybrid AI proxy (BYOK or managed credits)
│   └── api/credits/      ← GET  — credit balance for the current session
├── components/           ← SettingsPanel (Choice Wizard), BrandVoiceForm, OutputDisplay
├── hooks/                ← useApiKey (mode, provider, apiKey, switchMode, …)
├── lib/
│   ├── ai/               ← generateBrandVoicePrompt, createProviderModel, prompts, sanitize
│   ├── server/           ← RateLimiter (pure, Map-based)
│   ├── result.ts         ← Result<T> = [null, T] | [Error, null]
│   └── validation.ts     ← Single source of truth for all Zod schemas
├── middleware.ts          ← Per-request nonce CSP + security headers
└── services/
    ├── apiService.ts      ← generatePrompt(input, config) — BYOK or managed
    └── db-service.ts      ← Credit store stub (in-memory → swap for Supabase/KV)
```

The codebase is **purely functional** — no classes, no `this`, no `throw`. All async
operations return `Result<T>` tuples (`[null, data]` on success, `[error, null]` on failure).
See [AGENTS.md](AGENTS.md) for the full architectural reference.

---

## Deploying

### Vercel (recommended)

```bash
vercel deploy
```

Set `MASTER_AI_PROVIDER` and `MASTER_AI_API_KEY` in the Vercel project settings if you
want to enable the managed credits path for your users.

### Other platforms

Any platform that runs Next.js 16+ works. No build-time secrets are required — the app
builds cleanly with no env vars set (managed credits will return 503 until the key is
configured).

---

## Security

- **User API keys** are stored exclusively in `localStorage` and sent per-request as
  `X-AI-Provider` / `X-AI-Api-Key` headers. They are never written to any server-side store.
- **Master key** (`MASTER_AI_API_KEY`) exists only in the server runtime. It is never
  returned in HTTP responses or logged.
- **Content Security Policy** uses per-request nonces to allow Next.js inline scripts
  without `unsafe-inline`. `script-src 'self'` applies in production.
- **Rate limiting:** 10 req / 15 min globally + 3 req / 1 min per route, per IP.
- **Input sanitisation:** HTML stripped, SQL patterns blocked, AI key patterns stripped
  from error messages before any HTTP response.

---

## Contributing

Read [AGENTS.md](AGENTS.md) before opening a PR. It covers the FP constraints, the
validation pipeline, the security invariants, and all architectural conventions.
