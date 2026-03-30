<div align="center">

# Rio — AI-Powered Figma Plugin

**Conversational AI design generation · JSON import/export · Personal UI library · Stripe billing**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Stripe](https://img.shields.io/badge/Stripe-v20-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![AWS S3](https://img.shields.io/badge/AWS%20S3-SDK%20v3-FF9900?logo=amazons3&logoColor=white)](https://aws.amazon.com/s3)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [System Architecture](#3-system-architecture)
4. [Clean Architecture Layers](#4-clean-architecture-layers)
5. [Tech Stack](#5-tech-stack)
6. [Project Structure](#6-project-structure)
7. [Database Schema & ERD](#7-database-schema--erd)
8. [API Reference](#8-api-reference)
9. [Workflow Diagrams](#9-workflow-diagrams)
   - 9.1 [Authentication Flow](#91-authentication-flow)
   - 9.2 [AI Design Generation Flow](#92-ai-design-generation-flow)
   - 9.3 [Payment & Points Flow](#93-payment--points-flow)
   - 9.4 [Subscription Flow](#94-subscription-flow)
   - 9.5 [UI Library Component Flow](#95-ui-library-component-flow)
   - 9.6 [Plugin Build Pipeline](#96-plugin-build-pipeline)
   - 9.7 [Request Middleware Pipeline](#97-request-middleware-pipeline)
10. [UML Class Diagram](#10-uml-class-diagram)
11. [AI Models & Pricing](#11-ai-models--pricing)
12. [Monetization Model](#12-monetization-model)
13. [Security & Rate Limiting](#13-security--rate-limiting)
14. [Environment Variables](#14-environment-variables)
15. [Development Setup](#15-development-setup)
16. [Scripts Reference](#16-scripts-reference)
17. [Deployment](#17-deployment)
18. [Points Lifecycle & Deduction Logic](#18-points-lifecycle--deduction-logic)
19. [Node Creation Pipeline](#19-node-creation-pipeline-figma-canvas)
20. [Export Pipeline](#20-export-pipeline-figma--json)
21. [Error Handling Architecture](#21-error-handling-architecture)
22. [Full System State Machine](#22-full-system-state-machine)

---

## 1. Overview

**Rio** is a production-grade full-stack Figma plugin that bridges the gap between natural language and pixel-perfect design. It combines a **conversational AI engine** (supporting 7+ model providers), a **personal cloud UI component library**, and a **Stripe-powered billing system** into a single Figma plugin.

The system comprises two independent sub-projects that communicate over HTTP:

| Sub-project     | Role                                                        |
| --------------- | ----------------------------------------------------------- |
| `backend/`      | Node.js REST API — auth, AI orchestration, billing, storage |
| `figma-plugin/` | Figma sandbox + React iframe — design creation and UI       |

---

## 2. Features

| Feature                  | Description                                                         | API Endpoint                                   |
| ------------------------ | ------------------------------------------------------------------- | ---------------------------------------------- |
| **AI Generate**          | Chat with AI to generate new Figma designs from natural language    | `POST /api/designs/generate-from-conversation` |
| **AI Edit**              | Modify a selected Figma node with a follow-up prompt                | `POST /api/designs/edit-with-ai`               |
| **AI Variant**           | Generate a design variant from an existing Figma selection          | `POST /api/designs/generate-based-on-existing` |
| **AI Prototype**         | Auto-generate Figma prototype connections                           | `POST /api/designs/generate-prototype`         |
| **Paste JSON**           | Convert any structured JSON blob into live Figma nodes              | Plugin-side only                               |
| **Export JSON**          | Export any Figma selection to a clean, portable JSON                | Plugin-side only                               |
| **Design Versions**      | Save & restore design snapshots to the cloud                        | `GET/POST /api/design-generations`             |
| **UI Library**           | Manage reusable components in named projects with S3 image previews | `CRUD /api/ui-library`                         |
| **Points (Pay-per-use)** | Purchase AI generation credits with Stripe one-time checkout        | `POST /api/payments/create-checkout`           |
| **Subscriptions**        | Monthly subscription plans with daily point allocations             | `POST /api/subscriptions/create-checkout`      |
| **Google OAuth**         | One-click login via Google — JWT issued on completion               | `GET /auth/google`                             |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        FIGMA DESKTOP APP                             │
│  ┌─────────────────────────────┐   ┌────────────────────────────┐   │
│  │   Plugin Sandbox (main.ts)   │◄──│   Plugin UI (React iframe) │   │
│  │   TypeScript · Figma API     │   │   React 19 · esbuild       │   │
│  │   Node creators/exporters    │   │   Zustand · react-toastify │   │
│  └──────────────┬───────────────┘   └────────────┬───────────────┘   │
│                 │  postMessage()                  │  HTTP fetch()     │
└─────────────────┼───────────────────────────────-┼───────────────────┘
                  │                                 │
                  │                    ┌────────────▼──────────────────┐
                  │                    │      BACKEND API (Render)      │
                  │                    │  Express 5 · TypeORM · Node 18 │
                  │                    │  Clean Architecture (DDD)      │
                  │                    └────────────┬──────────────────┘
                  │                                 │
        ┌─────────▼─────────────────────────────────▼─────────────────┐
        │                   EXTERNAL SERVICES                          │
        │  ┌───────────┐ ┌─────────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │
        │  │ PostgreSQL │ │ AWS S3  │ │Stripe│ │Google│ │ AI APIs  │  │
        │  │ (TypeORM)  │ │(images) │ │(pay) │ │OAuth │ │7 Providers│  │
        │  └───────────┘ └─────────┘ └──────┘ └──────┘ └──────────┘  │
        └─────────────────────────────────────────────────────────────┘
```

---

## 4. Clean Architecture Layers

Both the **backend** and the **Figma plugin** follow Clean Architecture with strict layer separation.

### 4.1 Backend Layers

```mermaid
flowchart TB
    subgraph Presentation["Presentation Layer"]
        direction LR
        R[Routes] --> C[Controllers]
        M[Middleware] --> R
    end

    subgraph Application["Application Layer"]
        direction LR
        UC[Use Cases] --> DTO[DTOs]
    end

    subgraph Domain["Domain Layer (Pure)"]
        direction LR
        E[Entities] --- RI[Repository\nInterfaces]
        RI --- SI[Service\nInterfaces]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        direction LR
        DB[(TypeORM\nRepositories)] --- SV[Services\nAI · Stripe · S3 · JWT]
        SV --- CFG[Config\nenv · AI models · Plans]
    end

    Presentation -->|calls| Application
    Application -->|depends on| Domain
    Infrastructure -->|implements| Domain

    style Domain fill:#1e3a5f,color:#fff
    style Application fill:#1a4a2e,color:#fff
    style Presentation fill:#3d1a1a,color:#fff
    style Infrastructure fill:#2d2d00,color:#fff
```

### 4.2 Plugin Layers

```mermaid
flowchart TB
    subgraph P["Presentation (React UI)"]
        App["App.tsx"] --> Screens["LoginScreen\nHomeScreen"]
        Screens --> Sections["AiSection · ExportSection\nPasteJsonSection · ProjectsSection"]
        Sections --> Hooks["useApiClient\nusePluginMessage\nuseDropdown"]
    end

    subgraph A["Application (Use Cases)"]
        UC1["ExportSelectedUseCase"]
        UC2["ImportDesignUseCase"]
        UC3["ImportAiDesignUseCase"]
        SVC["DesignDataParser\nNodeCounter\nAccessControl"]
    end

    subgraph D["Domain (Pure Entities)"]
        EN["DesignNode\nFill · Effect\nConstraints"]
        IF["NodeRepository\nUIPort\nNotificationPort"]
        VO["Color\nTypography"]
    end

    subgraph I["Infrastructure (Figma API)"]
        CR["Creators\nframe · rect · text\nshape · component"]
        EX["NodeExporter"]
        MP["Mappers\nfill · effect · nodeType"]
    end

    P --> A --> D
    I -->|implements| D

    style D fill:#1e3a5f,color:#fff
    style A fill:#1a4a2e,color:#fff
    style P fill:#3d1a1a,color:#fff
    style I fill:#2d2d00,color:#fff
```

### 4.3 Dependency Injection

```mermaid
flowchart LR
    Bootstrap["index.ts\n(Composition Root)"] -->|instantiates| DB["DataSource\n(TypeORM)"]
    Bootstrap -->|creates| Repos["Repositories\nUser · Design\nPayment · Subscription\nUILibrary · ClientError"]
    Bootstrap -->|creates| Services["Services\nAI · JWT · Auth\nStripe · S3 · Points"]
    Bootstrap -->|wires into| UseCases["Use Cases"]
    UseCases -->|injected into| Controllers["Controllers"]
    Controllers -->|mounted on| Routes["Express Routes"]
```

---

## 5. Tech Stack

### Backend

| Category       | Technology                                                           | Version               | Notes                    |
| -------------- | -------------------------------------------------------------------- | --------------------- | ------------------------ |
| Runtime        | Node.js                                                              | 18+ LTS               |                          |
| Framework      | Express.js                                                           | v5.1                  |                          |
| Language       | TypeScript                                                           | 5.8                   | Strict mode              |
| ORM            | TypeORM                                                              | 0.3.28                | Decorators               |
| Database       | PostgreSQL                                                           | 14+                   |                          |
| Authentication | Google OAuth 2.0 + JWT                                               | 30-day expiry         | figma.clientStorage      |
| Payments       | Stripe SDK                                                           | v20.3.1               | One-time + subscriptions |
| Storage        | AWS S3                                                               | SDK v3.999            | Component previews       |
| Validation     | Joi · express-validator · Zod                                        | Latest                | Layered checks           |
| Rate Limiting  | express-rate-limit                                                   | 8.3.1                 | Per-route limits         |
| Docs           | Swagger / OpenAPI                                                    | swagger-ui-express v5 | `/api-docs`              |
| AI Providers   | OpenAI · Claude · Gemini · Mistral · HuggingFace · POE · Open Router | Multiple              | 7+ providers             |
| Compression    | compression                                                          | Latest                | gzip level 6             |
| Additional     | axios · bcryptjs · jsonwebtoken · dayjs · cors                       | Latest                |                          |

### Figma Plugin

| Category      | Technology            | Version | Notes              |
| ------------- | --------------------- | ------- | ------------------ |
| Language      | TypeScript            | 5.8     | Path aliases       |
| UI Framework  | React + React-DOM     | 19.2.4  |                    |
| Bundler       | esbuild               | 0.27.1  | Single HTML output |
| Icons         | lucide-react          | 0.563.0 |                    |
| Notifications | react-toastify        | Latest  |                    |
| Figma Typings | @figma/plugin-typings | 1.119   |                    |

---

## 6. Project Structure

```
task-creator/
│
├── backend/                                  # Node.js REST API
│   ├── public/
│   │   ├── pages/home.html                   # Landing page
│   │   └── prompt/design/                    # AI system prompt templates
│   └── src/
│       ├── index.ts                          # Bootstrap & DI composition root
│       │
│       ├── application/                      # Business logic (no framework)
│       │   ├── dto/                          # Request / response DTOs
│       │   ├── errors/                       # Custom HTTP error classes
│       │   └── use-cases/
│       │       ├── auth/                     # GoogleSignIn
│       │       ├── design/                   # GenerateDesign · EditDesign · Prototype
│       │       ├── design-generation/        # ListDesigns · GetDesign · DeleteDesign
│       │       ├── payment/                  # CreateCheckout · HandleWebhook · GetBalance
│       │       ├── subscription/             # CreateSub · CancelSub · GetStatus
│       │       ├── ui-library/               # CRUD projects & components
│       │       └── client-error/             # LogClientError
│       │
│       ├── domain/                           # Pure domain (no deps)
│       │   ├── entities/                     # User · DesignGeneration · PaymentTransaction
│       │   │                                 # Subscription · UILibraryProject · UILibraryComponent
│       │   ├── repositories/                 # Repository interfaces (contracts)
│       │   └── services/                     # IAiDesignService · IPointsService · IStripeService
│       │                                     # IJwtService · IS3Service
│       │
│       └── infrastructure/
│           ├── config/
│           │   ├── env.config.ts             # All env vars with defaults
│           │   ├── ai-models.config.ts       # Model registry + pricing
│           │   ├── points-packages.config.ts # Stripe one-time packages
│           │   └── subscription-plans.config.ts # Monthly plan tiers
│           ├── database/
│           │   ├── data-source.ts            # TypeORM connection
│           │   ├── entities/                 # UserEntity · DesignGenerationEntity · …
│           │   └── migrations/               # Sequential SQL migrations
│           ├── repository/                   # TypeORM implementations of domain interfaces
│           ├── services/
│           │   ├── ai/                       # AiGenerateDesignService · IconExtractor · CostCalculator
│           │   ├── auth/                     # GoogleAuthService · JwtService · TokenStore
│           │   ├── payment/                  # StripeService · PointsService
│           │   └── storage/                  # S3Service
│           └── web/
│               ├── controllers/              # Route handlers (inject services)
│               ├── middleware/               # auth · validation · rateLimiter · concurrencyLimiter · logger
│               ├── routes/                   # Express routers per domain
│               ├── validation/               # Joi & express-validator schemas
│               ├── docs/                     # Swagger YAML / JSON
│               └── server.ts                 # Express app factory
│
├── figma-plugin/                             # Figma plugin
│   ├── manifest.json                         # Plugin manifest (id · api · permissions)
│   ├── build.js                              # esbuild config (UI + code bundles)
│   ├── .env                                  # BACKEND_URL=http://localhost:5000
│   ├── .env.production                       # BACKEND_URL=https://...onrender.com
│   └── src/
│       ├── main.ts                           # Plugin entry & composition root
│       ├── application/
│       │   ├── services/                     # DesignDataParser · NodeCounter · AccessControl
│       │   └── use-cases/                    # ExportAll · ExportSelected · ImportDesign · ImportAiDesign
│       ├── domain/
│       │   ├── entities/                     # DesignNode · Fill · Effect · Constraints
│       │   ├── interfaces/                   # NodeRepository · UIPort · NotificationPort
│       │   └── value-objects/                # Color · Typography
│       ├── infrastructure/
│       │   ├── figma/
│       │   │   ├── creators/                 # FrameCreator · RectCreator · TextCreator
│       │   │   │                             # ShapeCreator · ComponentCreator
│       │   │   ├── exporters/                # NodeExporter (Figma → JSON)
│       │   │   ├── figma-node.repository.ts
│       │   │   ├── figma-ui.port.ts
│       │   │   ├── figma-notification.port.ts
│       │   │   └── selection-change.handler.ts
│       │   ├── mappers/                      # EffectMapper · FillMapper · NodeTypeMapper
│       │   └── services/                     # ErrorReporter · ImageOptimizer
│       ├── presentation/
│       │   ├── handlers/                     # PluginMessageHandler
│       │   └── ui/
│       │       ├── App.tsx                   # Root component
│       │       ├── screens/                  # LoginScreen · HomeScreen
│       │       ├── sections/                 # AiSection · ExportSection · PasteJsonSection
│       │       │                             # ProjectsSection · PrototypePanel
│       │       ├── components/
│       │       │   ├── shared/               # Modal · DeleteConfirmModal · LoadingState
│       │       │   └── modals/               # SaveModal · BuyPointsModal · ProfileDropdown
│       │       ├── hooks/                    # useApiClient · usePluginMessage
│       │       │                             # useUILibrary · useDropdown · useNotify
│       │       └── styles/                   # base.css · ProjectsSection.css · …
│       └── shared/
│           ├── constants/                    # plugin-config.ts
│           └── types/                        # node-types.ts · shared interfaces
│
└── public/                                   # Architecture diagrams (PNG)
    ├── Clean Architecture UML.png
    ├── Data Flow Sequence Diagram.png
    └── Design Version ERD.png
```

---

## 7. Database Schema & ERD

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar figmaUserId UK
        varchar userName
        varchar email UK
        varchar googleId
        varchar profilePicture
        int pointsBalance
        varchar stripeCustomerId UK
        boolean hasPurchased
        timestamp createdAt
        timestamp updatedAt
    }

    DESIGN_GENERATIONS {
        uuid id PK
        uuid userId FK
        varchar operationType
        varchar modelId
        text prompt
        varchar designSystemId
        jsonb conversationHistory
        jsonb currentDesign
        jsonb referenceDesign
        jsonb resultDesign
        jsonb resultConnections
        varchar status
        text errorMessage
        text aiMessage
        int inputTokens
        int outputTokens
        decimal totalCost
        int pointsDeducted
        timestamp createdAt
        timestamp updatedAt
    }

    PAYMENT_TRANSACTIONS {
        uuid id PK
        uuid userId FK
        varchar stripeSessionId
        varchar stripePaymentIntentId
        varchar packageName
        int pointsPurchased
        decimal amountPaid
        varchar currency
        varchar status
        timestamp createdAt
        timestamp completedAt
    }

    SUBSCRIPTIONS {
        uuid id PK
        uuid userId FK
        varchar planId
        varchar stripeSubscriptionId
        varchar stripeCustomerId
        varchar status
        timestamp currentPeriodStart
        timestamp currentPeriodEnd
        int dailyPointsLimit
        int dailyPointsUsed
        varchar lastUsageResetDate
        boolean cancelAtPeriodEnd
        timestamp createdAt
        timestamp updatedAt
    }

    UI_LIBRARY_PROJECTS {
        uuid id PK
        uuid userId FK
        varchar name
        timestamp createdAt
        timestamp updatedAt
    }

    UI_LIBRARY_COMPONENTS {
        uuid id PK
        uuid projectId FK
        uuid userId FK
        varchar name
        varchar description
        jsonb designJson
        text previewImage
        timestamp createdAt
        timestamp updatedAt
    }

    CLIENT_ERRORS {
        uuid id PK
        uuid userId FK
        varchar errorType
        text errorMessage
        text stackTrace
        varchar url
        varchar userAgent
        timestamp createdAt
    }

    USERS ||--o{ DESIGN_GENERATIONS : "has"
    USERS ||--o{ PAYMENT_TRANSACTIONS : "has"
    USERS ||--o{ SUBSCRIPTIONS : "has"
    USERS ||--o{ UI_LIBRARY_PROJECTS : "owns"
    USERS ||--o{ UI_LIBRARY_COMPONENTS : "owns"
    USERS ||--o{ CLIENT_ERRORS : "logs"
    UI_LIBRARY_PROJECTS ||--o{ UI_LIBRARY_COMPONENTS : "contains"
```

### Schema Details

#### `design_generations`

| Column                                         | Type    | Description                                             |
| ---------------------------------------------- | ------- | ------------------------------------------------------- |
| operationType                                  | `enum`  | `create` · `create_by_reference` · `edit` · `prototype` |
| conversationHistory                            | `JSONB` | Multi-turn chat history array                           |
| currentDesign / referenceDesign / resultDesign | `JSONB` | Full Figma node trees                                   |
| status                                         | `enum`  | `success` · `failed`                                    |
| Indexes                                        | —       | `[userId]`, `[userId, operationType]`, `[createdAt]`    |

#### `subscriptions`

| Column             | Type      | Description                                    |
| ------------------ | --------- | ---------------------------------------------- |
| status             | `enum`    | `active` · `canceled` · `past_due` · `expired` |
| dailyPointsUsed    | `int`     | Resets daily at midnight UTC                   |
| lastUsageResetDate | `varchar` | Date string `YYYY-MM-DD` for reset tracking    |

---

## 8. API Reference

> **Base URL (dev):** `http://localhost:5000`
> **Base URL (prod):** `https://task-creator-api.onrender.com`
> **Interactive docs:** `GET /api-docs`
> **Protected routes** require `Authorization: Bearer <jwt>`

### Authentication — `/auth`

| Method | Path                    | Auth | Description                           |
| ------ | ----------------------- | ---- | ------------------------------------- |
| `GET`  | `/auth/google`          | —    | Initiate Google OAuth redirect        |
| `GET`  | `/auth/google/callback` | —    | OAuth redirect handler — issues JWT   |
| `GET`  | `/auth/poll`            | —    | Plugin polls until JWT is ready       |
| `GET`  | `/auth/me`              | ✅   | Return current user profile + balance |

### AI Design Generation — `/api/designs`

| Method | Path                                      | Auth | Body                                                         |
| ------ | ----------------------------------------- | ---- | ------------------------------------------------------------ |
| `POST` | `/api/designs/generate-from-conversation` | ✅   | `{ prompt, modelId, conversationHistory?, designSystemId? }` |
| `POST` | `/api/designs/edit-with-ai`               | ✅   | `{ prompt, modelId, currentDesign, conversationHistory? }`   |
| `POST` | `/api/designs/generate-based-on-existing` | ✅   | `{ prompt, modelId, referenceDesign }`                       |
| `POST` | `/api/designs/generate-prototype`         | ✅   | `{ modelId, currentDesign }`                                 |

### Design History — `/api/design-generations`

| Method   | Path                          | Auth | Description                            |
| -------- | ----------------------------- | ---- | -------------------------------------- |
| `GET`    | `/api/design-generations`     | ✅   | List user's design history (paginated) |
| `GET`    | `/api/design-generations/:id` | ✅   | Fetch one generation record            |
| `DELETE` | `/api/design-generations/:id` | ✅   | Delete a generation record             |

### UI Library — `/api/ui-library`

| Method   | Path                                      | Auth | Description                         |
| -------- | ----------------------------------------- | ---- | ----------------------------------- |
| `POST`   | `/api/ui-library/projects`                | ✅   | Create project                      |
| `GET`    | `/api/ui-library/projects`                | ✅   | List all user's projects            |
| `DELETE` | `/api/ui-library/projects/:id`            | ✅   | Delete project (cascade components) |
| `GET`    | `/api/ui-library/projects/:id/components` | ✅   | List components in project          |
| `POST`   | `/api/ui-library/components`              | ✅   | Create component with JSON          |
| `POST`   | `/api/ui-library/components/upload-image` | ✅   | Upload S3 preview image             |
| `DELETE` | `/api/ui-library/components/:id`          | ✅   | Delete component + S3 image         |

### Payments — `/api/payments`

| Method | Path                            | Auth | Description                         |
| ------ | ------------------------------- | ---- | ----------------------------------- |
| `POST` | `/api/payments/create-checkout` | ✅   | Create Stripe one-time checkout     |
| `POST` | `/api/payments/webhook`         | —    | Stripe webhook (signature verified) |
| `GET`  | `/api/payments/balance`         | ✅   | Current points balance              |
| `GET`  | `/api/payments/history`         | ✅   | Transaction history                 |
| `GET`  | `/api/payments/packages`        | —    | Available point packages            |
| `GET`  | `/api/payments/poll/:sessionId` | ✅   | Poll checkout completion            |

### Subscriptions — `/api/subscriptions`

| Method | Path                                 | Auth | Description                  |
| ------ | ------------------------------------ | ---- | ---------------------------- |
| `POST` | `/api/subscriptions/create-checkout` | ✅   | Create subscription checkout |
| `POST` | `/api/subscriptions/cancel`          | ✅   | Cancel at period end         |
| `GET`  | `/api/subscriptions/status`          | ✅   | Active plan + daily usage    |
| `GET`  | `/api/subscriptions/plans`           | —    | Available plans and pricing  |

### Utility

| Method | Path                  | Auth | Description                   |
| ------ | --------------------- | ---- | ----------------------------- |
| `GET`  | `/api/ai-models`      | ✅   | List all available AI models  |
| `GET`  | `/api/design-systems` | ✅   | List available design systems |
| `POST` | `/api/errors`         | ✅   | Log a client-side error       |

---

## 9. Workflow Diagrams

### 9.1 Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Plugin as Figma Plugin\n(main.ts)
    participant UI as Plugin UI\n(React)
    participant Browser as Browser Tab
    participant API as Backend API
    participant Google as Google OAuth

    User->>UI: Clicks "Sign in with Google"
    UI->>Plugin: postMessage(OPEN_AUTH)
    Plugin->>Browser: figma.openExternal(authURL)
    Browser->>API: GET /auth/google
    API->>Google: Redirect to Google consent screen
    Google-->>API: GET /auth/google/callback?code=...
    API->>Google: Exchange code for user info
    Google-->>API: { email, name, picture, googleId }
    API->>API: Upsert user in DB
    API->>API: Generate JWT (30-day expiry)
    API->>API: Store token in memory (TokenStore)
    API-->>Browser: Redirect → success page
    Browser-->>User: "Login successful, return to Figma"

    loop Poll every 2 seconds (max 60s)
        Plugin->>API: GET /auth/poll
        alt Token ready
            API-->>Plugin: { token: "eyJ..." }
            Plugin->>Plugin: figma.clientStorage.set('token')
            Plugin->>UI: postMessage(AUTH_SUCCESS, user)
        else Not ready yet
            API-->>Plugin: { token: null }
        end
    end

    UI->>UI: Render HomeScreen
```

---

### 9.2 AI Design Generation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Designer
    participant UI as Plugin UI (React)
    participant Plugin as Plugin Sandbox
    participant API as Backend API
    participant AIOrch as AI Orchestrator\n(AiGenerateDesignService)
    participant AIProvider as AI Provider\n(OpenAI/Claude/Gemini/...)
    participant DB as PostgreSQL
    participant Canvas as Figma Canvas

    Designer->>UI: Types prompt, selects model, hits Generate
    UI->>API: POST /api/designs/generate-from-conversation\n{ prompt, modelId, conversationHistory }

    API->>API: Validate JWT + deduct points check
    API->>AIOrch: execute(prompt, model, history)
    AIOrch->>AIOrch: Build system prompt\n(load design system template)
    AIOrch->>AIProvider: chat.completions(messages)

    alt Success
        AIProvider-->>AIOrch: { designJson, aiMessage, tokens }
        AIOrch->>AIOrch: Extract icons from JSON
        AIOrch->>AIOrch: Calculate cost & points
        AIOrch-->>API: { resultDesign, inputTokens, outputTokens, cost }
        API->>DB: INSERT design_generations (status=success)
        API->>DB: UPDATE users SET pointsBalance -= deducted
        API-->>UI: 200 { design, aiMessage, pointsBalance }
    else AI Error
        AIProvider-->>AIOrch: Error / malformed JSON
        AIOrch-->>API: throw AiGenerationError
        API->>DB: INSERT design_generations (status=failed)
        API-->>UI: 422 { error: "Generation failed" }
    end

    UI->>Plugin: postMessage(IMPORT_DESIGN, { design })
    Plugin->>Canvas: Create Figma nodes\n(FrameCreator, TextCreator, ...)
    Canvas-->>Plugin: Nodes created
    Plugin-->>UI: postMessage(IMPORT_COMPLETE)
    UI->>Designer: Show success toast + updated points balance
```

---

### 9.3 Payment & Points Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Plugin UI
    participant API as Backend API
    participant Stripe as Stripe API
    participant Webhook as Stripe Webhook
    participant DB as PostgreSQL

    User->>UI: Clicks "Buy Points" → selects package
    UI->>API: POST /api/payments/create-checkout\n{ packageId }
    API->>Stripe: sessions.create({ price, metadata })
    Stripe-->>API: { sessionId, url }
    API-->>UI: { checkoutUrl, sessionId }
    UI->>UI: Open Stripe checkout in browser

    User->>Stripe: Completes payment
    Stripe->>Webhook: POST /api/payments/webhook\n(checkout.session.completed)
    Webhook->>Webhook: Verify Stripe signature
    Webhook->>DB: UPDATE payment_transactions SET status=completed
    Webhook->>DB: UPDATE users SET pointsBalance += purchased
    Webhook-->>Stripe: 200 OK

    loop Poll every 2s (max 60s)
        UI->>API: GET /api/payments/poll/:sessionId
        alt Payment confirmed
            API-->>UI: { status: 'completed', newBalance: 3750 }
            UI->>UI: Update displayed points balance
            UI->>User: "Points added successfully!"
        else Pending
            API-->>UI: { status: 'pending' }
        end
    end
```

---

### 9.4 Subscription Flow

```mermaid
flowchart TD
    A([User selects plan]) --> B[POST /api/subscriptions/create-checkout]
    B --> C[Stripe subscription checkout]
    C --> D{User completes\npayment?}
    D -->|Yes| E[Stripe webhook fires\nsubscription.created]
    D -->|No| F([Checkout abandoned])
    E --> G[Insert subscription record\nstatus=active]
    G --> H[Set dailyPointsLimit\nper plan tier]

    H --> I([Daily AI usage])
    I --> J{dailyPointsUsed\n< dailyPointsLimit?}
    J -->|Yes| K[Allow AI generation\nIncrement dailyPointsUsed]
    J -->|No| L[Return 429 Daily limit reached]

    K --> M{Next calendar day?}
    M -->|Yes| N[Reset dailyPointsUsed = 0\nUpdate lastUsageResetDate]
    N --> I

    O([User cancels]) --> P[POST /api/subscriptions/cancel]
    P --> Q[Stripe: cancelAtPeriodEnd = true]
    Q --> R[Subscription expires at\ncurrentPeriodEnd]
    R --> S[status = expired]
```

---

### 9.5 UI Library Component Flow

```mermaid
flowchart LR
    subgraph Figma["Figma Canvas"]
        SEL["User selects\nnodes"]
    end

    subgraph Plugin["Plugin Sandbox"]
        EXP["NodeExporter\n(Figma → JSON)"]
        IMG["ImageOptimizer\n(rasterize preview)"]
    end

    subgraph API["Backend API"]
        direction TB
        UP["POST /components\n(save JSON)"]
        S3U["POST /upload-image\n(S3 upload)"]
        LIST["GET /projects/:id/components"]
        DEL["DELETE /components/:id\n+ S3 delete"]
    end

    subgraph Storage["External Storage"]
        S3[("AWS S3\nbucket")]
        PG[("PostgreSQL\nui_library_components")]
    end

    SEL --> EXP --> Plugin
    Plugin -->|exportJson| UP --> PG
    Plugin -->|previewPng| S3U --> S3
    PG -->|previewImage URL| LIST
    LIST --> SEL2["User views\ncomponent grid"]
    DEL --> PG & S3
```

---

### 9.6 Plugin Build Pipeline

```mermaid
flowchart TD
    A([npm run build]) --> B{Mode?}
    B -->|--prod| C[minify: true\ndrop console logs]
    B -->|default| D[minify: false\nkeep logs]

    C & D --> E[esbuild: bundle UI\nentryPoint: index.jsx\nbundle: true\nloader: jsx,tsx,css,js,ts]

    E --> F[Inline CSS into\n&lt;style&gt; tag]
    F --> G[Escape &lt;/script&gt;\ninjection sequences]
    G --> H[Write dist/ui.html\n(self-contained)]

    C & D --> I[esbuild: bundle Plugin\nentryPoint: main.ts\nplatform: browser\ntarget: es2017]
    I --> J[Write dist/code.js]

    H & J --> K([Load in Figma\nDesktop App])
```

---

### 9.7 Request Middleware Pipeline

```mermaid
flowchart LR
    REQ([Incoming\nHTTP Request])
    --> COMP[compression\ngzip level 6]
    --> LOG[Logger\nreq/res logging]
    --> CORS[cors\nallowedDomains]
    --> COOKIE[cookieParser]
    --> BODY[bodyParser\nJSON 50MB]
    --> AUTH{Protected\nroute?}

    AUTH -->|Yes| JWT[authMiddleware\nverify JWT\nattach user]
    AUTH -->|No| RATE

    JWT --> RATE[Rate Limiter\nper-route limits]
    RATE --> CONC{AI route?}
    CONC -->|Yes| AICONC[concurrencyLimiter\nmax parallel AI]
    CONC -->|No| VALID

    AICONC --> VALID[Joi / Zod\nvalidation]
    VALID --> CTRL[Controller\n→ Use Case]
    CTRL --> RES([HTTP Response])
```

---

## 10. UML Class Diagram

```mermaid
classDiagram
    class User {
        +UUID id
        +string figmaUserId
        +string email
        +int pointsBalance
        +string stripeCustomerId
        +boolean hasPurchased
    }

    class DesignGeneration {
        +UUID id
        +string operationType
        +string modelId
        +string prompt
        +object resultDesign
        +string status
        +int pointsDeducted
    }

    class PaymentTransaction {
        +UUID id
        +string stripeSessionId
        +string packageName
        +int pointsPurchased
        +decimal amountPaid
        +string status
    }

    class Subscription {
        +UUID id
        +string planId
        +string status
        +int dailyPointsLimit
        +int dailyPointsUsed
        +Date currentPeriodEnd
        +boolean cancelAtPeriodEnd
    }

    class UILibraryProject {
        +UUID id
        +string name
    }

    class UILibraryComponent {
        +UUID id
        +string name
        +object designJson
        +string previewImage
    }

    class AiGenerateDesignService {
        +generateFromConversation(prompt, model, history)
        +editWithAi(prompt, model, currentDesign)
        +generateVariant(prompt, model, refDesign)
        +generatePrototype(model, design)
        -buildSystemPrompt(designSystemId)
        -extractIcons(json)
        -calculateCost(inputTokens, outputTokens, model)
    }

    class StripeService {
        +createCheckoutSession(package)
        +createSubscriptionSession(plan)
        +handleWebhook(event)
        +cancelSubscription(subId)
    }

    class PointsService {
        +deductPoints(userId, amount)
        +addPoints(userId, amount)
        +getBalance(userId)
        +checkDailyLimit(userId)
    }

    class JwtService {
        +sign(payload) string
        +verify(token) payload
    }

    class S3Service {
        +uploadImage(buffer, key) string
        +deleteImage(key)
    }

    User "1" --> "0..*" DesignGeneration : has
    User "1" --> "0..*" PaymentTransaction : has
    User "1" --> "0..1" Subscription : has
    User "1" --> "0..*" UILibraryProject : owns
    UILibraryProject "1" --> "0..*" UILibraryComponent : contains

    AiGenerateDesignService ..> PointsService : uses
    AiGenerateDesignService ..> DesignGeneration : creates
    StripeService ..> PaymentTransaction : creates
    StripeService ..> Subscription : manages
    PointsService ..> User : updates
```

---

## 11. AI Models & Pricing

| Model            | Provider  | Input ($/1M tokens) | Output ($/1M tokens) | Max Tokens | Vision |
| ---------------- | --------- | ------------------- | -------------------- | ---------- | ------ |
| Devstral Latest  | Mistral   | $0.40               | $2.00                | 262,144    | No     |
| Gemini 2.5 Flash | Google    | $0.30               | $2.50                | 1,000,000  | Yes    |
| Claude Opus 4.6  | Anthropic | $5.00               | $25.00               | 131,072    | Yes    |
| GPT-5.2          | OpenAI    | $1.75               | $14.00               | 128,000    | Yes    |
| Gemini 3.1 Pro   | Google    | $2.00               | $12.00               | 2,000,000  | Yes    |

> Points are calculated as: `cost_in_USD × 500 points_per_dollar`

---

## 12. Monetization Model

### One-Time Point Packages

| Package | Points     | Price  | Margin |
| ------- | ---------- | ------ | ------ |
| Starter | 3,750 pts  | $10.00 | 25%    |
| Pro     | 10,000 pts | $25.00 | 20%    |

### Monthly Subscriptions

| Plan    | Price/month | Daily Points  | Total/month | Margin |
| ------- | ----------- | ------------- | ----------- | ------ |
| Basic   | $50         | 708 pts/day   | ~21,250 pts | 15%    |
| Premium | $80         | 1,200 pts/day | ~36,000 pts | 10%    |

```mermaid
flowchart LR
    subgraph Billing["Billing Options"]
        PP["Pay Per Use\n(Points Packages)"]
        SUB["Subscription\n(Daily Allowance)"]
    end

    PP -->|One-time payment| S["Stripe Checkout\n(one-time)"]
    SUB -->|Monthly recurring| SS["Stripe Checkout\n(subscription)"]

    S --> W["Webhook\ncheckout.session.completed"]
    SS --> W2["Webhook\nsubscription.created\n+ invoice.paid"]

    W --> DB1[("Add points\nto balance")]
    W2 --> DB2[("Create subscription\nSet dailyPointsLimit")]

    DB1 --> AI[AI Generation\nDeduct from balance]
    DB2 --> AI2[AI Generation\nDeduct from dailyUsed]
```

---

## 13. Security & Rate Limiting

### Rate Limits

| Endpoint Group                          | Limit        | Window     | Key          |
| --------------------------------------- | ------------ | ---------- | ------------ |
| Auth (`/auth/*`)                        | 50 requests  | per minute | IP           |
| AI Generation (`/api/designs/*`)        | 5 requests   | per minute | user or IP   |
| UI Library (`/api/ui-library/*`)        | 5 requests   | per minute | user or IP   |
| Payments (`/api/payments/*`)            | 5 requests   | per minute | user or IP   |
| Subscriptions (`/api/subscriptions/*`)  | 5 requests   | per minute | user or IP   |
| Webhooks (`/api/payments/webhook`)      | 100 requests | per minute | IP           |

### Concurrency Limit

- Maximum **2 concurrent AI requests per user** enforced via a counting semaphore middleware (`aiConcurrencyLimiter`)
- Returns `429` immediately if the user already has 2 in-flight AI requests
- Slot released on response `finish` or `close` event
- Prevents API key quota exhaustion and runaway costs

### Payload Limits

| Check                | Limit                                   |
| -------------------- | --------------------------------------- |
| JSON body parser     | 50 MB                                   |
| Uploaded image (S3)  | 5 MB                                    |
| MIME type validation | `image/png`, `image/jpeg`, `image/webp` |

### Authentication Security

- JWT verified on every protected request
- Tokens stored only in `figma.clientStorage` (sandboxed per plugin)
- Stripe webhook signature verified via `stripe.webhooks.constructEvent()`
- Google OAuth state parameter for CSRF protection

---

## 14. Environment Variables

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
JWT_EXPIRY=30d

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
GEMINI_API_KEY=AI...
MISTRAL_API_KEY=...
HAMGINGFACE_API_KEY=hf_...
POE_API_KEY=...
OPEN_ROUTER_API_KEY=...

# Trello (optional)
TRELLO_API_KEY=...
TRELLO_TOKEN=...
TRELLO_BOARD_ID=...
```

### Figma Plugin — `figma-plugin/.env`

```env
# Local development
BACKEND_URL=http://localhost:5000
```

```env
# figma-plugin/.env.production
BACKEND_URL=https://task-creator-api.onrender.com
```

---

## 15. Development Setup

### Prerequisites

| Tool          | Version | Purpose                |
| ------------- | ------- | ---------------------- |
| Node.js       | 18+ LTS | Backend & plugin build |
| PostgreSQL    | 14+     | Primary database       |
| Figma Desktop | Latest  | Plugin development     |
| Stripe CLI    | Latest  | Webhook testing        |

### Step 1 — Clone

```bash
git clone https://github.com/Rezkaudi/task-creator.git
cd task-creator
```

### Step 2 — Backend

```bash
cd backend
npm install

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npm run migration:run

# Start development server (nodemon + ts-node)
npm run dev
# → API running at http://localhost:5000
# → Swagger UI at http://localhost:5000/api-docs
```

### Step 3 — Figma Plugin

```bash
cd ../figma-plugin
npm install

# Development build with watch mode
npm run dev
# → Outputs dist/code.js and dist/ui.html
```

### Step 4 — Load Plugin in Figma

1. Open **Figma Desktop**
2. Menu → **Plugins** → **Development** → **Import plugin from manifest…**
3. Select `figma-plugin/manifest.json`
4. Run the plugin — it will connect to `http://localhost:5000`

### Step 5 — Stripe Webhooks (local)

```bash
# Forward Stripe events to local server
stripe listen --forward-to http://localhost:5000/api/payments/webhook

# Test a payment event
stripe trigger checkout.session.completed
```

---

## 16. Scripts Reference

### Backend (`backend/`)

| Command                      | Description                             |
| ---------------------------- | --------------------------------------- |
| `npm run dev`                | Development server — nodemon + ts-node  |
| `npm run build`              | Compile TypeScript + copy public assets |
| `npm start`                  | Run compiled production server          |
| `npm run migration:generate` | Generate migration from entity changes  |
| `npm run migration:run`      | Apply all pending migrations            |
| `npm run migration:revert`   | Revert most recent migration            |
| `npm run migration:show`     | Show migration status table             |

### Figma Plugin (`figma-plugin/`)

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `npm run dev`         | esbuild watch mode (local dev)     |
| `npm run build`       | Minified production build          |
| `npm run build:local` | Unminified build for local testing |
| `npm run clean`       | Remove `dist/` folder              |
| `npm run rebuild`     | `clean` + `build`                  |

---

## 17. Deployment

### Backend (Render.com)

| Setting       | Value                                               |
| ------------- | --------------------------------------------------- |
| Build Command | `npm run build`                                     |
| Start Command | `npm start`                                         |
| Environment   | All variables from [§14](#14-environment-variables) |
| Live URL      | `https://task-creator-api.onrender.com`             |

**Production checklist:**

- [ ] Set all env vars in Render dashboard (never commit secrets)
- [ ] `NODE_ENV=production`
- [ ] Use a strong random `JWT_SECRET` (≥ 64 chars)
- [ ] Register Stripe production webhook pointing to `https://...onrender.com/api/payments/webhook`
- [ ] Verify AWS S3 bucket CORS policy allows Figma plugin origin

### Figma Plugin

```bash
# Build for production (minified, points to production API)
cd figma-plugin
npm run build

# Distribute via Figma Community
# Or share manifest.json + dist/ folder
```

**Plugin checklist:**

- [ ] Set `BACKEND_URL` in `.env.production`
- [ ] Run `npm run build` (not `build:local`)
- [ ] Update `manifest.json` version number
- [ ] Submit to Figma Community or share `dist/` + `manifest.json`

---

## 18. Points Lifecycle & Deduction Logic

```mermaid
flowchart TD
    START([User triggers AI generation]) --> CHECK_SUB{Active\nsubscription?}

    CHECK_SUB -->|Yes| CHECK_DAILY{dailyPointsUsed\n< dailyPointsLimit?}
    CHECK_SUB -->|No| CHECK_BAL{pointsBalance\n> required?}

    CHECK_DAILY -->|No| ERR1([429 — Daily limit reached\nUpgrade plan or wait for reset])
    CHECK_DAILY -->|Yes| CALL_AI

    CHECK_BAL -->|No| ERR2([402 — Insufficient points\nBuy more points])
    CHECK_BAL -->|Yes| CALL_AI

    CALL_AI[Send prompt to AI provider] --> AI_RESP{AI response\nsuccessful?}

    AI_RESP -->|No| FAIL[Log failed generation\nDo NOT deduct points]
    FAIL --> ERR3([422 — Generation failed])

    AI_RESP -->|Yes| CALC[Calculate tokens used\ninput × inputRate + output × outputRate]
    CALC --> CONV[Convert cost → points\ncost × 500 pts/dollar]
    CONV --> DEDUCT{Source?}

    DEDUCT -->|Subscription| UPD1[UPDATE subscriptions\nSET dailyPointsUsed += deducted]
    DEDUCT -->|Balance| UPD2[UPDATE users\nSET pointsBalance -= deducted]

    UPD1 & UPD2 --> SAVE[INSERT design_generations\nstatus=success, pointsDeducted]
    SAVE --> RETURN([Return design JSON\n+ updated balance])
```

---

## 19. Node Creation Pipeline (Figma Canvas)

```mermaid
flowchart TD
    INPUT([Receive JSON from API]) --> PARSE[DesignDataParser\nvalidate & normalize]
    PARSE --> ROOT{Root node\ntype?}

    ROOT -->|FRAME| FC[FrameCreator\napply layout, padding, constraints]
    ROOT -->|RECTANGLE| RC[RectCreator\napply fills, strokes, radius]
    ROOT -->|TEXT| TC[TextCreator\napply font, size, weight, color]
    ROOT -->|ELLIPSE / POLYGON| SC[ShapeCreator]
    ROOT -->|COMPONENT| CC[ComponentCreator\nresolve from library]
    ROOT -->|GROUP| GC[GroupCreator\nwrap children]

    FC & RC & TC & SC & CC & GC --> FILL[FillMapper\nsolid · gradient · image fills]
    FILL --> EFFECT[EffectMapper\ndrop shadow · blur · inner shadow]
    EFFECT --> CONSTRAINT[Apply Constraints\nfixed · fill · hug parent]
    CONSTRAINT --> CHILDREN{Has\nchildren?}

    CHILDREN -->|Yes| RECURSE[Recurse into children\n← same pipeline]
    CHILDREN -->|No| APPEND[Append node to parent\nor canvas root]
    RECURSE --> APPEND

    APPEND --> NOTIFY[figma-notification.port\nShow success toast]
    NOTIFY --> DONE([Design rendered on canvas])
```

---

## 20. Export Pipeline (Figma → JSON)

```mermaid
flowchart LR
    SEL([User selects nodes\nin Figma]) --> HANDLER[selection-change.handler\ndetect selection]
    HANDLER --> UC[ExportSelectedUseCase\nor ExportAllUseCase]
    UC --> REPO[FigmaNodeRepository\nread node tree]

    REPO --> EXP[NodeExporter\ntraverse node tree]

    EXP --> MAP1[NodeTypeMapper\nFigma type → domain type]
    MAP1 --> MAP2[FillMapper\npaints → Fill value objects]
    MAP2 --> MAP3[EffectMapper\neffects → Effect value objects]
    MAP3 --> BUILD[Build DesignNode\ndomain entity]

    BUILD --> CHILDREN2{Children?}
    CHILDREN2 -->|Yes| RECURSE2[Recurse subtree]
    RECURSE2 --> BUILD
    CHILDREN2 -->|No| JSON[Serialize to JSON\nclean portable schema]

    JSON --> OUT{Output\nchoice}
    OUT -->|Copy| CLIP[Copy to clipboard]
    OUT -->|Download| FILE[Download .json file]
    OUT -->|Save version| API[POST /api/design-generations]
```

---

## 21. Error Handling Architecture

```mermaid
flowchart TD
    subgraph Plugin["Plugin (Client Side)"]
        ERR_UI[React error boundary\nor try/catch in hook]
        ERR_UI --> REPORT[POST /api/errors\n{ errorType, message, stack }]
        ERR_UI --> TOAST[react-toastify\nshow user-friendly message]
    end

    subgraph Backend["Backend (Server Side)"]
        direction LR
        CTRL_ERR[Controller catches\nunhandled exception]
        CTRL_ERR --> CUSTOM{Custom\nHTTP error?}
        CUSTOM -->|Yes| TYPED[AppError subclass\nstatus + message]
        CUSTOM -->|No| GENERIC[500 Internal Server Error]
        TYPED & GENERIC --> MWARE[Error middleware\nformat JSON response]
        MWARE --> LOG2[Logger middleware\nlog to stdout]
    end

    REPORT --> DB_ERR[("INSERT client_errors\ntable")]
    MWARE --> RES([HTTP error response\n{ error, message, status }])
```

---

## 22. Full System State Machine

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated : Plugin opens

    Unauthenticated --> Authenticating : Click "Sign in with Google"
    Authenticating --> Authenticated : JWT received via polling
    Authenticating --> Unauthenticated : Timeout / error

    Authenticated --> Idle : Home screen loaded

    Idle --> GeneratingDesign : Submit AI prompt
    Idle --> ExportingDesign : Click Export
    Idle --> ImportingJSON : Paste JSON
    Idle --> ViewingLibrary : Open UI Library
    Idle --> ViewingHistory : Open Design Versions
    Idle --> Purchasing : Click Buy Points

    GeneratingDesign --> Idle : Success — nodes created
    GeneratingDesign --> Idle : Failed — toast shown

    ExportingDesign --> Idle : JSON copied / downloaded

    ImportingJSON --> Idle : Nodes created on canvas

    ViewingLibrary --> CreatingComponent : Save selection
    CreatingComponent --> ViewingLibrary : Saved
    ViewingLibrary --> Idle : Close

    ViewingHistory --> RestoringVersion : Click version
    RestoringVersion --> Idle : Nodes restored

    Purchasing --> AwaitingPayment : Stripe checkout opened
    AwaitingPayment --> Idle : Payment confirmed + points added
    AwaitingPayment --> Idle : Checkout abandoned

    Authenticated --> Unauthenticated : Sign out / token expired
```

---

<div align="center">

**Rio** — Built with Clean Architecture · Powered by 7+ AI providers · Secured by Stripe & Google OAuth

</div>
