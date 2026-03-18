# Nexus OS - ULTRA-Level Adaptive Operating System

An enterprise-grade, AI-native adaptive operating system built for high-performance operational management. Originally designed for car rental entrepreneurs, Nexus OS has evolved into a domain-agnostic resource engine capable of transforming into personal, professional, or specialized business workspaces.

## ULTRA-Level Capabilities

### 1. Local-First Synchronization Engine

Nexus OS features a robust synchronization architecture that ensures sub-100ms responsiveness. Data is stored and mutated locally first, then synchronized in the background across Web and Mobile devices, providing true offline-first durability.

### 2. Workspace Intelligence (RAG & RLS)

The intelligence layer is deeply integrated into the data core:

- **RAG (Retrieval Augmented Generation):** The AI has real-time visibility into your workspace context (fleet, bookings, tasks) ensuring precise reasoning.
- **RLS (Row Level Security):** Enterprise-grade data isolation enforced at the Postgres layer, ensuring multi-tenant security and verifiable privacy.

### 3. Action-Proposal & Multi-Step Workflows

The AI operates as a functional partner, not just a chatbot:

- **Proposals:** AI suggests database mutations that users can preview and apply with a single tap.
- **Workflows:** Complex multi-entity sequences (e.g., "Onboard new customer and draft contract") are handled as atomic units.

### 4. Generative UI (SDUI)

Server-Driven UI allows the AI to render native components directly in the interaction panel, providing specialized views like Yield Optimization charts or Vision-AI Inspection findings.

### 5. Universal Transformation Layer

The entire OS re-skins its vocabulary, navigation, and module packs based on the active **Ontology** (Car Rental, Personal Productivity, CRM, etc.), allowing one unified shell to serve multiple areas of life and business.

## Core Modules

- **Fleet Command:** Timeline-based asset management with Yield-Optimized pricing.
- **Vision-AI Inspection:** Automated damage triage using mobile camera analysis.
- **Executive Analytics:** Real-time RevPAR, ROI, and Profitability tracking.
- **Intelligence Hub:** Voice-to-action mobile controls and proactive system alerts.

## Technical Architecture

- **Frontend:** React (Web) & React Native/Expo (Mobile) with a shared local-first sync store.
- **Backend:** Node.js Modular Monolith deployed on Railway.
- **Database:** PostgreSQL with Drizzle ORM and hardened RLS policies.
- **AI Gateway:** Provider-agnostic orchestration (OpenAI, Anthropic, or Local models).

## Validation & Quality

```bash
npm run check          # Structural integrity & Type safety
npm run test           # Integration & Logic validation
npm run audit:security # Enterprise hardening scan
```

## Deployment

### Backend (Railway)

1. Link your repo to Railway.
2. Apply `server/services/rls_migration.sql` to your Postgres instance.
3. Set `AI_PROVIDER=openai` and `OPENAI_API_KEY`.

### Mobile (EAS)

```bash
cd mobile
eas build --profile production
```

## Vision

The software should adapt to the user, not force the user to adapt to the software. Nexus OS is the body, the model is the mind, and the operator is the pilot.
