# Rio — AI-Powered Figma Plugin

**Rio** is a full-stack Figma plugin that supercharges the design workflow with conversational AI generation, JSON-based design import/export, a personal UI component library, and persistent design versioning. It is backed by a production-grade Node.js API with Stripe billing, Google OAuth, and multi-provider AI support.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Authentication](#authentication)
8. [Environment Variables](#environment-variables)
9. [Development Setup](#development-setup)
10. [Scripts](#scripts)
11. [Deployment](#deployment)
12. [Diagrams](#diagrams)

---

## Features

| Feature | Description |
|---|---|
| **AI Generate** | Chat with an AI to generate new designs or modify an existing selection |
| **Paste JSON** | Convert any structured JSON object into a live Figma design |
| **Export to JSON** | Export a Figma selection to a clean, structured JSON for handoff |
| **Design Versions** | Save and restore design snapshots to a personal cloud database |
| **UI Library** | Organise reusable design components in projects with S3-hosted preview images |
| **Prototype** | Generate Figma prototype connections with AI |
| **Points & Subscriptions** | Stripe-powered pay-per-use points and monthly subscription plans |

---

## Architecture

The system is composed of three layers:

```
┌─────────────────────────────────────────────┐
│              Figma Plugin (UI)               │
│   React 19 · Clean Architecture · esbuild   │
├─────────────────────────────────────────────┤
│               Backend API                    │
│  Express.js · TypeScript · TypeORM · Postgres│
├─────────────────────────────────────────────┤
│             External Services                │
│  OpenAI · Claude · Gemini · Stripe · S3      │
└─────────────────────────────────────────────┘
```

### Plugin Clean Architecture Layers

```
Presentation   →   Application   →   Domain   →   Infrastructure
(React UI)         (Use Cases)       (Entities)    (Figma API, HTTP)
```

- **Domain** — pure entities, value objects, repository interfaces (no framework dependencies)
- **Application** — use cases that orchestrate the domain (GenerateDesign, ImportDesign, ExportDesign, etc.)
- **Infrastructure** — Figma API adapters, node creators, exporters, mappers
- **Presentation** — React UI, message handlers, contexts, hooks

### Data Flows

**AI Generation**
```
User prompt → ChatInterface → POST /api/designs/generate-from-conversation
→ Claude/OpenAI/Gemini → structured JSON + HTML preview
→ Plugin main thread → Figma canvas
```

**Export**
```
Figma selection → NodeExporter → structured JSON
→ Copy / Download / Save to DB
```

**Version Restore**
```
User clicks version → GET /api/designs/:id → JSON
→ Plugin main thread → Figma canvas
```

---

## Tech Stack

### Backend

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Language | TypeScript 5.8 |
| ORM | TypeORM v0.3 |
| Database | PostgreSQL |
| Auth | Google OAuth 2 + JWT (30-day expiry) |
| Payment | Stripe SDK v20 |
| Storage | AWS S3 (`@aws-sdk/client-s3`) |
| AI Providers | OpenAI, Claude, Gemini, Mistral, Hugging Face, POE, Open Router |
| Validation | Joi · express-validator · Zod |
| Docs | Swagger / OpenAPI (`swagger-ui-express`) |

### Figma Plugin

| Category | Technology |
|---|---|
| Language | TypeScript 5.8 |
| UI | React 19 + React-DOM 19 |
| Build | esbuild v0.27 |
| Icons | lucide-react |
| Notifications | react-toastify |
| Figma typings | `@figma/plugin-typings` v1.119 |

---

## Project Structure

```
task-creator/
├── backend/
│   ├── public/
│   │   ├── prompt/                     # AI system prompt templates
│   │   └── pages/                      # Static HTML pages
│   └── src/
│       ├── index.ts                    # Bootstrap & DI composition root
│       ├── application/
│       │   ├── dto/                    # Request / response DTOs
│       │   └── use-cases/              # All business use cases
│       ├── domain/
│       │   ├── entities/               # Core domain entities
│       │   ├── repositories/           # Repository interfaces
│       │   └── services/               # Service interfaces
│       └── infrastructure/
│           ├── config/                 # env, CORS, Swagger, data-source
│           ├── database/
│           │   ├── entities/           # TypeORM entity classes
│           │   └── migrations/         # Database migrations
│           ├── repository/             # TypeORM implementations
│           ├── services/               # AI, Stripe, S3, JWT, Auth services
│           └── web/
│               ├── controllers/        # Route handlers
│               ├── middleware/         # auth, validation, error
│               ├── routes/             # Express routers
│               └── server.ts           # Express app factory
│
├── figma-plugin/
│   ├── manifest.json                   # Figma plugin manifest
│   ├── build.js                        # esbuild configuration
│   ├── .env                            # Local backend URL
│   ├── .env.production                 # Production backend URL
│   └── src/
│       ├── main.ts                     # Plugin entry point
│       ├── application/
│       │   ├── services/               # design-data-parser, node-counter
│       │   └── use-cases/              # export-all, export-selected,
│       │                               #   import-design, import-ai-design
│       ├── domain/
│       │   ├── entities/               # DesignNode, Fill, Effect, Constraints
│       │   ├── interfaces/             # NodeRepository, UIPort, NotificationPort
│       │   └── value-objects/          # Color, Typography
│       ├── infrastructure/
│       │   ├── figma/
│       │   │   ├── creators/           # frame, rect, text, shape, component nodes
│       │   │   ├── exporters/          # node.exporter.ts
│       │   │   └── figma-node.repository.ts
│       │   ├── mappers/                # fill, effect, node-type mappers
│       │   └── services/              # error-reporter, image-optimizer
│       ├── presentation/
│       │   ├── handlers/               # plugin-message.handler.ts
│       │   └── ui/                     # React components, contexts, hooks
│       │       ├── App.tsx
│       │       ├── contexts/           # AppContext, AuthContext
│       │       ├── hooks/              # useApiClient, usePluginMessage,
│       │       │                       #   useUILibrary, useDropdown
│       │       ├── components/
│       │       │   ├── tabs/           # AiTab, ExportTab, PasteJsonTab,
│       │       │   │                   #   UILibraryTab, PrototypePanel
│       │       │   ├── shared/         # Modal, DeleteConfirmModal,
│       │       │   │                   #   LoadingState, CreateProjectModal
│       │       │   └── modals/         # SaveModal, BuyPointsModal,
│       │       │                       #   ProfileDropdown
│       │       └── styles/             # base.css, component CSS files
│       └── shared/
│           ├── constants/              # plugin-config.ts (API URL, dimensions)
│           └── types/                  # node-types.ts, shared interfaces
│
└── public/                             # Architecture diagrams & assets
```

---

## Database Schema

### Users
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | auto-generated |
| figmaUserId | varchar | unique Figma identity |
| userName | varchar | display name |
| email | varchar | unique |
| googleId | varchar | Google OAuth subject |
| profilePicture | varchar | avatar URL |
| pointsBalance | int | purchased points |
| stripeCustomerId | varchar | Stripe customer |
| hasPurchased | boolean | lifetime flag |
| createdAt / updatedAt | timestamp | |

### Design Versions
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| version | int | incrementing counter |
| description | text | user-provided label |
| designJson | JSONB | full Figma node tree |
| userId | UUID FK → users | |

### UI Library Projects
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | varchar | project name |
| userId | UUID FK → users | |

### UI Library Components
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | varchar | |
| description | text | |
| designJson | JSONB | component node tree |
| previewImage | text | S3 image URL |
| projectId | UUID FK → projects | |
| userId | UUID FK → users | |

### Subscriptions
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| planId | varchar | starter / pro / basic / premium |
| status | enum | active · canceled · past_due · expired |
| stripeSubscriptionId | varchar | |
| currentPeriodStart / End | timestamp | billing window |
| dailyPointsLimit | int | plan allocation |
| dailyPointsUsed | int | resets daily |
| cancelAtPeriodEnd | boolean | |
| userId | UUID FK → users | |

### Payment Transactions
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| stripeSessionId | varchar | checkout session |
| stripePaymentIntentId | varchar | |
| packageName | varchar | |
| pointsPurchased | int | |
| amountPaid | decimal | |
| currency | varchar | default USD |
| status | enum | pending · completed · failed |
| userId | UUID FK → users | |

---

## API Reference

> Base URL (dev): `http://localhost:5000`
> Base URL (prod): `https://task-creator-api.onrender.com`

### Authentication — `/auth`

| Method | Path | Description |
|---|---|---|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth redirect callback |
| GET | `/auth/poll` | Plugin polls for JWT after browser auth |
| GET | `/auth/me` | Return current user profile |

### AI Design — `/api/designs`

| Method | Path | Description |
|---|---|---|
| POST | `/api/designs/generate-from-conversation` | Generate design from chat prompt |
| POST | `/api/designs/edit-with-ai` | Modify selected design with AI |
| POST | `/api/designs/generate-based-on-existing` | Generate variant of existing selection |
| POST | `/api/designs/generate-prototype` | Generate prototype connections |

### Design Versions — `/api/designs`

| Method | Path | Description |
|---|---|---|
| POST | `/api/designs` | Save current design as version |
| GET | `/api/designs` | List all versions for user |
| GET | `/api/designs/:id` | Get a specific version |
| DELETE | `/api/designs/:id` | Delete a version |

### UI Library — `/api/ui-library`

| Method | Path | Description |
|---|---|---|
| POST | `/api/ui-library/projects` | Create project |
| GET | `/api/ui-library/projects` | List projects |
| DELETE | `/api/ui-library/projects/:id` | Delete project |
| GET | `/api/ui-library/projects/:id/components` | List components in project |
| POST | `/api/ui-library/components` | Create component |
| POST | `/api/ui-library/components/upload-image` | Upload S3 preview image |
| DELETE | `/api/ui-library/components/:id` | Delete component |

### Payments — `/api/payments`

| Method | Path | Description |
|---|---|---|
| POST | `/api/payments/create-checkout` | Stripe one-time checkout session |
| POST | `/api/payments/webhook` | Stripe webhook handler |
| GET | `/api/payments/balance` | User's current points balance |
| GET | `/api/payments/history` | Payment transaction history |
| GET | `/api/payments/packages` | Available point packages |
| GET | `/api/payments/poll/:sessionId` | Poll payment completion |

### Subscriptions — `/api/subscriptions`

| Method | Path | Description |
|---|---|---|
| POST | `/api/subscriptions/create-checkout` | Subscription checkout session |
| POST | `/api/subscriptions/cancel` | Cancel active subscription |
| GET | `/api/subscriptions/status` | Current subscription & usage |
| GET | `/api/subscriptions/plans` | Available plans and pricing |

### AI Models — `/api/ai-models`

| Method | Path | Description |
|---|---|---|
| GET | `/api/ai-models` | List all available AI models |

### Client Errors — `/api/errors`

| Method | Path | Description |
|---|---|---|
| POST | `/api/errors` | Log a client-side error |

All protected routes require `Authorization: Bearer <jwt>` header.
Interactive API docs available at `/api-docs` when the server is running.

---

## Authentication

1. **Google OAuth** — user opens the plugin, clicks "Sign in with Google", browser tab opens and completes OAuth flow.
2. **JWT** — after OAuth the server issues a 30-day JWT.
3. **Plugin polling** — the plugin's main thread calls `GET /auth/poll` repeatedly until a token is returned, then stores it in `figma.clientStorage`.
4. **API requests** — the React UI's `useApiClient` hook reads the stored token and injects it as a `Bearer` header on every request.

---

## Environment Variables

### Backend — `backend/.env`

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:root@localhost:5432/design_versions_db

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret_change_in_production

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_SUB_BASIC=price_...
STRIPE_PRICE_SUB_PREMIUM=price_...

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# AI Providers
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=...
MISTRAL_API_KEY=...
HAMGINGFACE_API_KEY=...
POE_API_KEY=...

# Trello (optional)
TRELLO_API_KEY=...
TRELLO_TOKEN=...
TRELLO_BOARD_ID=...
```

### Figma Plugin — `figma-plugin/.env`

```env
BACKEND_URL=http://localhost:5000
```

> For production, set `BACKEND_URL` in `figma-plugin/.env.production`.

---

## Development Setup

### Prerequisites

- Node.js 18+ (LTS)
- PostgreSQL 14+
- Figma Desktop App
- Stripe CLI (for webhook testing)

### 1. Clone the repository

```bash
git clone https://github.com/Rezkaudi/task-creator.git
cd task-creator
```

### 2. Backend

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run database migrations
npm run migration:run

# Start development server
npm run dev
```

The API will be available at `http://localhost:5000`.
Swagger docs: `http://localhost:5000/api-docs`.

### 3. Figma Plugin

```bash
cd figma-plugin
npm install

# Development build (watches for changes)
npm run dev

# OR production build
npm run build
```

### 4. Load the plugin in Figma

1. Open the **Figma Desktop App**.
2. Go to **Plugins → Development → Import plugin from manifest…**
3. Select `figma-plugin/manifest.json`.
4. Run the plugin — it will connect to your local backend.

### 5. Stripe webhooks (local)

```bash
stripe listen --forward-to http://localhost:5000/api/payments/webhook
```

---

## Scripts

### Backend (`backend/`)

| Command | Description |
|---|---|
| `npm run dev` | Development server with nodemon + ts-node |
| `npm run build` | Compile TypeScript and copy public assets |
| `npm start` | Run compiled production server |
| `npm run migration:generate` | Generate a new migration from entity changes |
| `npm run migration:run` | Apply pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run migration:show` | Show migration status |

### Figma Plugin (`figma-plugin/`)

| Command | Description |
|---|---|
| `npm run dev` | esbuild watch mode (local development) |
| `npm run build` | Minified production build |
| `npm run build:local` | Unminified build for local testing |
| `npm run clean` | Remove `dist/` folder |
| `npm run rebuild` | Clean then build |

---

## Deployment

| Service | URL |
|---|---|
| Backend (Render) | `https://task-creator-api.onrender.com` |
| Web redirect | `https://rio-app.design` |

**Production checklist:**
- Set all env vars in Render dashboard (never commit secrets)
- Set `NODE_ENV=production`
- Use a strong random `JWT_SECRET`
- Add production `STRIPE_SECRET_KEY` and re-register the Stripe webhook
- Set `BACKEND_URL` in `figma-plugin/.env.production` and run `npm run build`
- Submit the built plugin to the Figma Community or distribute `manifest.json` + `dist/`

---

## Diagrams

### Clean Architecture UML
![Clean Architecture UML](./public/Clean%20Architecture%20UML.png)

### Data Flow Sequence Diagram
![Data Flow Sequence Diagram](./public/Data%20Flow%20Sequence%20Diagram.png)

### Entity Relationship Diagram
![Entity Relationship Diagram](./public/Design%20Version%20ERD.png)
