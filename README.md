# Nexus OS

Nexus OS is an AI-assisted adaptive operations suite with a React/Vite web frontend, a Node/Express backend, PostgreSQL persistence through Drizzle ORM, and an Expo mobile client. The current production topology is:

- **Backend** on Railway
- **Frontend** on Vercel
- **Database** on PostgreSQL

## Core capabilities

- Adaptive workspace modes for rental, personal, professional, and custom operating models
- Cookie-authenticated web sessions with hardened environment validation
- AI-assisted module and action suggestions through the model gateway
- Fleet, bookings, customers, maintenance, tasks, notes, and analytics flows
- Web and mobile surfaces sharing the same domain model vocabulary

## Stack

- **Web frontend:** React 19, Vite, TanStack Query, Wouter
- **Backend:** Express 5, TypeScript, esbuild bundle
- **Database:** PostgreSQL, Drizzle ORM, Drizzle Kit
- **E2E:** Playwright
- **Security:** npm audit, Trivy, Gitleaks, CodeQL
- **Mobile:** Expo / React Native

## Quick start

1. Install dependencies:

```bash
npm ci
npm --prefix mobile ci
```

2. Configure local environment:

```bash
cp .env.example .env
```

3. Provide at minimum:

- `DATABASE_URL`
- `SESSION_SECRET`

4. Push the database schema:

```bash
npx drizzle-kit push
```

5. Start the local web/backend app:

```bash
npm run dev
```

The app runs on `http://localhost:5000`.

## Validation

```bash
npm run lint
npm test
npm run test:integration
npm run build
npm run test:e2e
npm run security:audit
npm run security:scan
```

For the full repository validation pass, including the mobile workspace:

```bash
npm run validate
```

Operational recovery guides live in [docs/runbooks/startup-and-db-recovery.md](docs/runbooks/startup-and-db-recovery.md) and [docs/runbooks/ci-validation-recovery.md](docs/runbooks/ci-validation-recovery.md).

## Deployment

### Railway backend

Railway uses the checked-in `railway.json` and `Dockerfile`.

Required production variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `CORS_ALLOWED_ORIGINS`
- `AI_PROVIDER`
- `OPENAI_API_KEY` when `AI_PROVIDER=openai`

Deploy with:

```bash
railway up --service api --environment production
```

Health check:

```bash
curl https://<your-railway-domain>/health
```

### Vercel frontend

Vercel uses the repo root with:

- build command: `npm run build:web`
- output directory: `dist/public`

Required environment variable:

- `VITE_API_BASE_URL=https://<your-railway-domain>`

Deploy with:

```bash
vercel deploy --prod
```

## Security notes

- Runtime secrets must come from environment variables.
- Cookie-authenticated write endpoints require a CSRF token.
- Production web deployments must align `VITE_API_BASE_URL` and `CORS_ALLOWED_ORIGINS`.

## Vision

The software should adapt to the operator rather than forcing the operator to adapt to the software. Nexus OS provides a unified shell, a flexible data model, and an AI layer that can assist without obscuring the underlying business state.
