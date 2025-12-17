# **Design Tool Pro: Figma Plugin**

## **Table of Contents**

1. [Project Overview](#1-project-overview)
2. [Architecture Overview](#2-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Core Concepts (Features & Use Cases)](#5-core-concepts-features--use-cases)
6. [API Documentation](#6-api-documentation)
7. [Database Schema (Design Versions)](#7-database-schema-design-versions)
8. [Authentication & Security](#8-authentication--security)
9. [Development Guide](#9-development-guide)
10. [Diagrams](#10-diagrams)

---

## **1. Project Overview**

### **Purpose**

**Design Tool Pro** is a powerful Figma plugin designed to **accelerate the design workflow** by integrating AI-powered generation, data-driven design, and robust version control directly within the Figma environment. It is built as a full-stack application, consisting of a Figma plugin interface, a web-based frontend (UI), and a dedicated backend service.

### **Key Features**

- **AI Generate**: Conversational AI to generate new designs or modify existing selections.
- **Paste JSON**: Instantly convert structured JSON data into a Figma design.
- **Export to JSON**: Convert any Figma selection into a clean, structured JSON for developer handoff.
- **Versions**: Save and load design states to a personal, persistent database.

### **Business Value**

- **Increased Efficiency**: Automates repetitive design tasks using AI and data.
- **Improved Handoff**: Provides developers with structured, ready-to-use design data.
- **Reliable Versioning**: Offers a robust, personal history for design iterations outside of Figma's native versioning.

---

## **2. Architecture Overview**

### **Clean Architecture Principles**

The project follows **Clean Architecture** and **Domain-Driven Design** (DDD) principles:

- **Separation of Concerns** - Each layer has a specific responsibility
- **Dependency Rule** - Dependencies point inward (infrastructure → domain)
- **Testability** - Business logic is independent of frameworks
- **Flexibility** - Easy to swap databases, UI frameworks, or external services
- **Maintainability** - Clear boundaries between layers

### **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                        Figma Plugin                         │
│                    (User Interface Layer)                   │
├─────────────────────────────────────────────────────────────┤
│                    Frontend Web UI                          │
│           (React + MUI running in plugin iframe)            │
├─────────────────────────────────────────────────────────────┤
│                      Backend API                            │
│         (Express.js + TypeScript + PostgreSQL)              │
├─────────────────────────────────────────────────────────────┤
│                   External Services                         │
│    (Claude AI, OpenAI, Trello API, PostgreSQL)              │
└─────────────────────────────────────────────────────────────┘
```

### **Plugin Architecture Layers**

```
┌─────────────────────────────────────────────────────────────┐
│                  Presentation Layer                         │
│          (UI, Message Handlers, Plugin Config)              │
├─────────────────────────────────────────────────────────────┤
│                  Application Layer                          │
│        (Use Cases, Services, DTOs, Parsers)                 │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer                             │
│   (Entities, Value Objects, Repository Interfaces)          │
├─────────────────────────────────────────────────────────────┤
│                Infrastructure Layer                         │
│  (Figma API, Node Creators, Exporters, Mappers)             │
├─────────────────────────────────────────────────────────────┤
│                    Shared Layer                             │
│           (Types, Constants, Utilities)                     │
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow**

#### **AI Design Generation Flow**

1. **User Input** → Chat Interface (Frontend-Plugin)
2. **Frontend-Plugin** → Backend API (`/api/designs/generate-from-conversation`)
3. **Backend** → Claude AI API (Design generation)
4. **Backend** → Claude AI API (HTML preview generation)
5. **Backend** → Frontend-Plugin (JSON design + HTML preview)
6. **Frontend-Plugin** → Plugin (Import to Figma)
7. **Plugin** → Figma Canvas (Node creation)

#### **Export Flow**

1. **User Selection** → Plugin (Export button)
2. **Plugin** → NodeExporter (Comprehensive export)
3. **NodeExporter** → Frontend-Plugin (JSON data)
4. **Frontend-Plugin** → User (Copy/Download/Save to DB)

#### **Version Management Flow**

1. **User** → Export Design → Save to DB
2. **Backend** → PostgreSQL (Store design JSON)
3. **User** → Load Version
4. **Backend** → PostgreSQL → Frontend-Plugin → Plugin
5. **Plugin** → Figma Canvas (Restore design)

---

## **3. Technology Stack**

### **Core Technologies**

- **Figma Integration**: Figma Plugin API
- **Frontend**: React, Vite, TypeScript
- **Backend**: Node.js (Express.js), TypeScript
- **Database**: Persistent storage for design versions (PostgreSQL)
- **AI Service**: External LLM/AI API for design generation and modification.

### **Development Tools**

- **Package Manager**: npm or yarn
- **Build Tool**: Webpack/Vite (for frontend), TypeScript Compiler (for backend)
- **Testing**: (To be determined by project structure)

---

## **4. Project Structure**

### **Directory Layout**

```
task-creator/
├── backend/                    # Express API server
│   ├── public/
│   │   ├── prompt/            # AI prompt templates
│   │   │   ├── design-prompt.txt
│   │   │   ├── text-to-design-prompt.txt
│   │   │   ├── prompt1.txt
│   │   │   └── prompt2.txt
│   │   └── index.html
│   └── src/
│       ├── application/       # Business logic
│       │   ├── dto/           # Data Transfer Objects
│       │   └── use-cases/     # Use case implementations
│       ├── domain/            # Core business entities
│       │   ├── entities/      # Domain entities
│       │   ├── repositories/  # Repository interfaces
│       │   └── services/      # Service interfaces
│       ├── infrastructure/    # External integrations
│       │   ├── config/        # Configuration files
│       │   ├── database/      # Database setup & entities
│       │   ├── repository/    # Repository implementations
│       │   └── services/      # Service implementations
│       │       ├── claude.service.ts
│       │       ├── gpt.service.ts
│       │       ├── gpt-design.service.ts
│       │       └── trello.service.ts
│       └── infrastructure/web/
│           ├── controllers/   # Request handlers
│           ├── routes/        # API routes
│           └── server.ts      # Express server
│
├── frontend/                  # React UI
│   ├── public/
│   └── src/
│       ├── components/        # React components
│       │   ├── TaskInput.tsx
│       │   └── TrelloLists.tsx
│       ├── pages/            # Page components
│       │   └── Home.tsx
│       ├── services/         # API clients
│       │   └── api.ts
│       ├── store/            # State management
│       │   └── taskStore.ts
│       ├── theme/            # MUI theme
│       │   └── theme.ts
│       └── App.tsx
│
└── figma-plugin/             # Figma plugin
    ├── dist/                 # Build output
    ├── public/
    └── src/
        ├── application/      # Use cases & services
        │   ├── services/
        │   │   ├── design-data-parser.service.ts
        │   │   └── node-counter.service.ts
        │   └── use-cases/
        │       ├── export-all.use-case.ts
        │       ├── export-selected.use-case.ts
        │       ├── import-ai-design.use-case.ts
        │       └── import-design.use-case.ts
        ├── domain/           # Core entities
        │   ├── entities/
        │   │   ├── design-node.ts
        │   │   ├── fill.ts
        │   │   ├── effect.ts
        │   │   └── constraints.ts
        │   ├── interfaces/
        │   │   ├── node-repository.interface.ts
        │   │   ├── ui-port.interface.ts
        │   │   └── notification-port.interface.ts
        │   └── value-objects/
        │       ├── color.ts
        │       └── typography.ts
        ├── infrastructure/   # Figma API integration
        │   ├── figma/
        │   │   ├── creators/
        │   │   │   ├── base-node.creator.ts
        │   │   │   ├── component-node.creator.ts
        │   │   │   ├── frame-node.creator.ts
        │   │   │   ├── rectangle-node.creator.ts
        │   │   │   ├── shape-node.creator.ts
        │   │   │   └── text-node.creator.ts
        │   │   ├── exporters/
        │   │   │   └── node.exporter.ts
        │   │   ├── figma-node.repository.ts
        │   │   ├── figma-ui.port.ts
        │   │   └── figma-notification.port.ts
        │   └── mappers/
        │       ├── fill.mapper.ts
        │       ├── effect.mapper.ts
        │       └── node-type.mapper.ts
        ├── presentation/     # UI & handlers
        │   ├── handlers/
        │   │   └── plugin-message.handler.ts
        │   └── ui/
        │       ├── ui.html
        │       ├── ui.css
        │       └── ui.js
        ├── shared/           # Shared utilities
        │   ├── constants/
        │   │   └── plugin-config.ts
        │   └── types/
        │       └── node-types.ts
        └── main.ts           # Entry point       # Root dependencies and scripts
```

---

## **5. Core Concepts (Features & Use Cases)**

### **Core Entity: Design Version**

The primary persistent entity is the **Design Version**, which is a snapshot of a Figma selection stored as a structured JSON object.

```typescript
interface DesignVersion {
  id: string;
  userId: string;
  name: string;
  timestamp: Date;
  designJson: object; // The structured JSON exported from Figma
}
```

### **Key Use Cases**

| Feature            | Use Case                | Description                                                                               |
| :----------------- | :---------------------- | :---------------------------------------------------------------------------------------- |
| **AI Generate**    | `GenerateDesignUseCase` | Takes a text prompt and returns a structured design JSON from the AI service.             |
|                    | `ModifyDesignUseCase`   | Takes a selected design JSON and a modification prompt, returns the modified design JSON. |
| **Paste JSON**     | `ImportDesignUseCase`   | Takes a user-provided JSON and imports it directly to the Figma canvas via the plugin.    |
| **Export to JSON** | `ExportDesignUseCase`   | Exports the current Figma selection to a standardized JSON format.                        |
| **Versions**       | `SaveVersionUseCase`    | Stores the exported design JSON in the database, linked to the user.                      |
|                    | `LoadVersionUseCase`    | Retrieves a saved design JSON from the database and imports it to the canvas.             |

---

## **6. API Documentation**

The backend service exposes a REST API for the frontend to consume.

### **Base URL**

- Development: `http://localhost:8000` (or as configured)
- Production: `https://task-creator-api.onrender.com` (or as configured)

### **Key API Endpoints**

| Method | Endpoint                 | Description                                                  |
| :----- | :----------------------- | :----------------------------------------------------------- |
| `POST` | `/api/ai/generate`       | Generates a new design based on a text prompt.               |
| `POST` | `/api/ai/modify`         | Modifies a selected design based on a text prompt.           |
| `POST` | `/api/versions/save`     | Saves the current design selection as a new version.         |
| `GET`  | `/api/versions/list`     | Retrieves a list of all saved versions for the current user. |
| `GET`  | `/api/versions/load/:id` | Retrieves the JSON for a specific saved version.             |

---

## **7. Database Schema (Design Versions)**

The database stores design versions for the user.

```sql
-- Conceptual SQL Schema for Design Versions
CREATE TABLE design_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,          -- Figma user ID or internal user ID
    version_name VARCHAR(255) NOT NULL,
    design_json JSONB NOT NULL,             -- The full structured design data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## **9. Development Guide**

### **Prerequisites**

- Node.js (LTS version recommended)
- npm or yarn
- Figma Desktop App

### **Setup Instructions**

1.  **Clone Repository**

    ```bash
    gh repo clone Rezkaudi/task-creator
    cd task-creator
    ```

2.  **Backend Setup**

    ```bash
    cd backend
    npm install
    # Start the backend server (e.g., on port 8000)
    npm start
    ```

3.  **Frontend/Plugin Setup**

    ```bash
    # Frontend UI
    cd ../frontend
    npm install
    npm run dev # Starts development server (e.g., on port 5173)

    # Figma Plugin Code
    cd ../figma-plugin
    npm install
    npm run build # Builds the plugin code
    ```

4.  **Critical Configuration: Connecting Plugin to Local Backend**

    Locate the file that defines the base API URL and change the production URL to your local development URL (e.g., `http://localhost:8000`).

    | File to Modify                                       | Purpose                               | Example Change                                                            |
    | :--------------------------------------------------- | :------------------------------------ | :------------------------------------------------------------------------ |
    | `figma-plugin/src/shared/constants/plugin-config.ts` | Contains the `BASE_API_URL` constant. | Change `https://task-creator-api.onrender.com` to `http://localhost:8000` |

5.  **. Configure Environment Variables**

    **Backend** (`backend/.env`):

    ```env
    # Server
    NODE_ENV=development
    PORT=5000

    # PostgreSQL
    DATABASE_URL="postgresql://postgres:password@localhost:5432/design_versions_db"

    # OpenAI (for task extraction)
    OPENAI_API_KEY=sk-...
    OPENAI_MODEL=gpt-4

    # Claude (for design generation)
    CLAUDE_API=sk-ant-...
    MODEL_CLAUDE=claude-sonnet-4-20250514

    # Trello (optional)
    TRELLO_API_KEY=...
    TRELLO_TOKEN=...
    TRELLO_BOARD_ID=...
    ```

    **Frontend** (`frontend/.env`):

    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

    **Figma Plugin** (`figma-plugin/src/shared/constants/plugin-config.ts`):

    ```typescript
    export const ApiConfig = {
      BASE_URL: "http://localhost:5000",
      // For production:
      // BASE_URL: 'https://task-creator-api.onrender.com',
    } as const;
    ```

6.  **Testing in Figma**

    1.  Open the Figma Desktop App.
    2.  Go to **Plugins > Development > Import plugin from manifest...**
    3.  Select the `manifest.json` file from the `figma-plugin` directory.
    4.  Run the plugin. It should now connect to your locally running backend and frontend services.

### **Development Commands**

| Command         | Location        | Description                                             |
| :-------------- | :-------------- | :------------------------------------------------------ |
| `npm start`     | `backend/`      | Starts the production backend server.                   |
| `npm run dev`   | `frontend/`     | Starts the frontend development server with hot reload. |
| `npm run build` | `figma-plugin/` | Compiles the plugin code for testing/deployment.        |

---

## **10. Diagrams**

### **Clean Architecture UML**

![Clean Architecture UML](./public/Clean%20Architecture%20UML.png)

### **Data Flow Sequence Diagram**

![AI Generate Sequence Diagram](./public/Data%20Flow%20Sequence%20Diagram.png)

### **Design Version Entity Relationship Diagram**

![Design Version ERD](./public/Design%20Version%20ERD.png)
