# VI Notes

VI Notes is a Bun-first monorepo for note taking, writing-session tracking, auth, and docs.

- Docs: <https://fumadocs-nu.vercel.app>
- Web App: <https://web-vi-notes.vercel.app/>
- API: <https://api-vi-notes.vercel.app/>

## What’s In The Repo

- `apps/web` - main web app
- `apps/server` - API server
- `apps/fumadocs` - docs site
- `packages/auth` - Better Auth setup
- `packages/emailer` - shared email transport
- `packages/db` - MongoDB models and client
- `packages/env` - typed environment variables
- `packages/ui` - shared UI components and styles

## Stack

- Bun
- Turborepo
- React Router
- Better Auth
- MongoDB / Mongoose
- Fumadocs
- shadcn/ui
- T3 Env

## Getting Started

1. Install Bun.
2. Copy `.env.example` to `.env` and fill in the values.
3. Install dependencies.

Need the full setup flow? See the [docs](https://fumadocs-nu.vercel.app).

```bash
bun install
```

4. Start development.

```bash
bun run dev
```

## Environment

The app requires a few server-side values:

- `DATABASE_URL`
- `DATABASE_NAME`
- `BETTER_AUTH_SECRET`
- `CORS_ORIGINS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `GMAIL_USER`
- `GMAIL_PASS`
- `NODE_ENV`

The web app also uses:

- `VITE_SERVER_URL`

See `.env.example` for the default local values.

## Scripts

```bash
bun run dev
bun run build
bun run start
bun run check-types
bun run dev:web
bun run dev:server
```

## Notes

- Use Bun for installs and local scripts.
- Auth and email are shared through workspace packages instead of being duplicated in apps.
