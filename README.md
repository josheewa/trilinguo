# Trilinguo

A language practice chat app with AI-powered conversations. Supports character-by-character romanization, English translations, and cultural context across Chinese (Traditional/Simplified), Japanese, Korean, and French.

## Features

- AI chat tuned for language learning
- Optional pinyin/romaji display per language
- English translation and cultural context
- Responsive UI (Tailwind) with local-only chat storage
- Secure auth via Clerk (middleware + server checks)

## Quick start

1) Create `.env.local` (see variables below)
2) Install and run the dev server:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` in the project root:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# OpenAI
OPENAI_API_KEY=sk-openai-xxx
```

- Clerk keys are available in the Clerk dashboard.
- `OPENAI_API_KEY` is required by the server-only API routes that call OpenAI.
- Do not commit secrets. `.gitignore` already ignores `.env*` files.

## Authentication

- Clerk middleware protects pages and API routes: see `middleware.ts`.
- API routes also verify auth server-side with `getAuth` and return `401` if missing.

## Tech stack

- Next.js 15, React 19
- Clerk for auth
- OpenAI SDK for chat and TTS
- Tailwind CSS 4

## Production notes

- Ensure `OPENAI_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` are set in the hosting environment.
- Keep `.env*` files out of version control (already covered by `.gitignore`).
- No OpenAI keys are exposed client-side; all calls happen via server API routes.
