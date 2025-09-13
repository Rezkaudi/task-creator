# **Pathway Repo - Clean Architecture with Express.js using TypeScript**

## **Table of Contents**

1. Project Overview
2. Architecture Overview
3. Technology Stack
4. Project Structure
5. Core Concepts
6. API Documentation
7. Database Schema
8. Authentication & Security
9. Development Guide

---

## **1\. Project Overview**

### **Purpose**

This is a **Pathway Repository System** for SOKA University, built using Clean Architecture principles with Express.js. The system manages protein pathway data, allowing users to create, read, update, and delete pathway information with proper authentication and authorization.

### **Key Features**

- User authentication with JWT tokens (access & refresh tokens)
- Email verification and password reset functionality
- CRUD operations for protein pathways
- Public and private pathway access
- Advanced filtering, pagination, and sorting
- Mock data generation for testing
- Link preview functionality
- Support for both PostgreSQL

### **Business Value**

- Centralizes protein pathway research data
- Provides secure access control for sensitive research
- Enables collaboration through shared pathways
- Supports academic research with structured data management

---

## **2\. Architecture Overview**

### **Clean Architecture Principles**

The project follows Uncle Bob's Clean Architecture, ensuring:

- **Separation of Concerns**: Each layer has a specific responsibility
- **Dependency Rule**: Dependencies point inward (from infrastructure to domain)
- **Testability**: Business logic is independent of frameworks
- **Flexibility**: Easy to swap databases, frameworks, or external services

### **Layer Structure**

┌─────────────────────────────────────────────────────────────┐  
│ Presentation Layer │  
│ (Controllers, Routes, Middleware, Validators, Swagger) │  
├─────────────────────────────────────────────────────────────┤  
│ Application Layer │  
│ (Use Cases, DTOs, Application Errors, Responses) │  
├─────────────────────────────────────────────────────────────┤  
│ Domain Layer │  
│ (Entities, Repository Interfaces, Service Interfaces) │  
├─────────────────────────────────────────────────────────────┤  
│ Infrastructure Layer │  
│ (Database, Repository Implementations, Service Implementations) │  
└─────────────────────────────────────────────────────────────┘

### **Data Flow**

1. **Request** → Routes → Middleware → Controllers
2. **Controllers** → Use Cases (with DTOs)
3. **Use Cases** → Domain Services & Repositories
4. **Repositories** → Database
5. **Response** ← Controllers ← Use Cases

---

## **3\. Technology Stack**

### **Core Technologies**

- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.8.2
- **Primary Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken 9.0.2)
- **Email Service**: NodeMailer with Gmail
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **API Documentation**: Swagger (OpenAPI 3.0)

### **Development Tools**

- **Package Manager**: npm
- **Build Tool**: TypeScript Compiler (tsc)
- **Testing**: Jest with ts-jest
- **Development Server**: Nodemon
- **Deployment**: Vercel

### **Key Dependencies**

```json
{
  "express": "^5.1.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^3.0.2",
  "pg": "^8.14.1",
  "mongoose": "^8.3.4",
  "nodemailer": "^6.10.0",
  "express-validator": "^7.2.1",
  "swagger-ui-express": "^5.0.1",
  "uuid4": "^2.0.3",
  "@faker-js/faker": "^9.7.0"
}
```

---

## **4\. Project Structure**

### **Directory Layout**

    src/
    ├── application/          # Application business rules
    │   ├── dtos/             # Data Transfer Objects
    │   ├── errors/           # Custom application errors
    │   ├── response/         # Standardized responses
    │   └── use-cases/        # Business logic implementation
    │       ├── auth/         # Authentication use cases
    │       ├── pathway/      # Pathway management use cases
    │       └── user/         # User management use cases
    │
    ├── domain/               # Enterprise business rules
    │   ├── entity/           # Core business entities
    │   ├── interface/        # Domain interfaces
    │   ├── repository/       # Repository interfaces
    │   └── services/         # Domain service interfaces
    │
    ├── infrastructure/       # Frameworks and drivers
    │   ├── database/         # Database configurations
    │   │   ├── mongoDB/      # MongoDB setup and models
    │   │   └── postgreSQL/   # PostgreSQL setup and models
    │   ├── repository/       # Repository implementations
    │   └── services/         # Service implementations
    │
    └── presentation/         # Interface adapters
        ├── config/           # Configuration files
        ├── controllers/      # Request handlers
        ├── dependencies/     # Dependency injection
        ├── docs/             # Swagger documentation
        ├── middleware/       # Express middleware
        ├── routes/           # API routes
        └── validators/       # Input validation

### **Key Files**

- `src/index.ts` \- Application entry point
- `src/presentation/Server.ts` \- Express server setup
- `src/presentation/dependencies/index.ts` \- Dependency injection container
- `src/presentation/config/env.ts` \- Environment configuration

---

## **5\. Core Concepts**

### **Entities**

#### **User Entity**

```ts
interface User {
  _id?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  biography?: string;
  phoneNumber?: string;
  degree?: string;
  university?: string;
  links?: { type: string; url: string }[];
  profileImageUrl?: string;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiresAt?: Date;
}
```

#### **Pathway Entity**

```ts
interface Pathway {
  _id?: string;
  userId: string;
  title: string;
  description: string;
  species: string;
  category: string;
  tissue: {
    id: string;
    parent: string;
    text: string;
  };
  relatedDisease: string;
  diseaseInput: {
    Disease_id: string;
    Disease_name: string;
  };
  reactions: any[];
  recordDate: string;
  pubMeds: { id: string }[];
}
```

### **Use Cases**

#### **Authentication Use Cases**

1. **Register** \- User registration with email verification
2. **Login** \- User authentication with JWT tokens
3. **Verify Email** \- Email verification process
4. **Forgot Password** \- Password reset request
5. **Reset Password** \- Password reset completion
6. **Refresh Token** \- Access token refresh
7. **Update Password** \- Change user password
8. **Resend Verification** \- Resend verification email

#### **Pathway Use Cases**

1. **Create Pathway** \- Create a new pathway
2. **Get All Pathways** \- List public pathways
3. **Get User Pathways** \- List the user's pathways
4. **Get Pathway by ID** \- Retrieve specific pathway
5. **Update Pathway** \- Modify pathway data
6. **Delete Pathway** \- Remove pathway
7. **Create Mock Pathways** \- Generate test data

#### **User Use Cases**

1. **Get User Info** \- Retrieve user profile
2. **Update User Info** \- Modify user profile
3. **Delete Account** \- Remove user account

### **Repository Pattern**

Each entity has a repository interface in the domain layer and implementation(s) in the infrastructure layer:

Domain Layer (Interface)

```ts
interface UserRepository {
  create(user: Partial<User>): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(userId: string, userData: Partial<User>): Promise<User | null>;
  delete(id: string): Promise<void>;
}
```

Infrastructure Layer (Implementation)

```ts
class PostgreSQLUserRepository implements UserRepository {
  // Implementation details
}
```

## **6\. API Documentation**

### **Base URL**

- Development: `http://localhost:8080`
- Production: Configured in the environment

### **Authentication**

The API uses HTTP-only cookies for authentication:

- `accessToken` \- Short-lived token (1 day)
- `refreshToken` \- Long-lived token (7 days)

### **API Endpoints**

#### **Authentication Endpoints**

| Method | Endpoint                        | Description                 | Auth Required |
| ------ | ------------------------------- | --------------------------- | ------------- |
| POST   | `/api/auth/register`            | Register new user           | No            |
| POST   | `/api/auth/login`               | User login                  | No            |
| POST   | `/api/auth/logout`              | User logout                 | Yes           |
| GET    | `/api/auth/verify-email`        | Verify email                | No            |
| POST   | `/api/auth/forgot-password`     | Request password reset      | No            |
| POST   | `/api/auth/reset-password`      | Reset password              | No            |
| POST   | `/api/auth/refresh-token`       | Refresh access token        | No            |
| GET    | `/api/auth/check-auth`          | Check authentication status | Yes           |
| PATCH  | `/api/auth/update-password`     | Update password             | Yes           |
| POST   | `/api/auth/resend-verification` | Resend verification email   | No            |

#### **User Endpoints**

| Method | Endpoint       | Description      | Auth Required |
| ------ | -------------- | ---------------- | ------------- |
| GET    | `/api/user/me` | Get user info    | Yes           |
| PUT    | `/api/user/me` | Update user info | Yes           |
| DELETE | `/api/user/me` | Delete account   | Yes           |

#### **Pathway Endpoints (Public)**

| Method | Endpoint                   | Description             | Auth Required |
| ------ | -------------------------- | ----------------------- | ------------- |
| GET    | `/api/pathway/protein`     | Get all public pathways | No            |
| GET    | `/api/pathway/protein/:id` | Get pathway by ID       | No            |

#### **Pathway Endpoints (User)**

| Method | Endpoint                         | Description          | Auth Required |
| ------ | -------------------------------- | -------------------- | ------------- |
| GET    | `/api/user/pathway/protein`      | Get user's pathways  | Yes           |
| POST   | `/api/user/pathway/protein`      | Create pathway       | Yes           |
| GET    | `/api/user/pathway/protein/:id`  | Get user's pathway   | Yes           |
| PUT    | `/api/user/pathway/protein/:id`  | Update pathway       | Yes           |
| DELETE | `/api/user/pathway/protein/:id`  | Delete pathway       | Yes           |
| POST   | `/api/user/pathway/protein/mock` | Create mock pathways | Yes           |

#### **Utility Endpoints**

| Method | Endpoint        | Description               | Auth Required |
| ------ | --------------- | ------------------------- | ------------- |
| GET    | `/preview?url=` | Get link preview metadata | No            |

### **Query Parameters**

For pathway listing endpoints:

- `pageNumber` \- Page number (default: 1\)
- `pageSize` \- Items per page (default: 10\)
- `search` \- Search term
- `category` \- Filter by category
- `year` \- Filter by year
- `orderBy` \- Sort field (title, species, category, recordDate)
- `orderDirection` \- Sort direction (ASC, DESC)

### **Response Format**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": {}
}
```

### **Error Codes**

- `400` \- Bad Request
- `401` \- Unauthorized
- `403` \- Forbidden
- `404` \- Not Found
- `409` \- Conflict
- `500` \- Internal Server Error

---

## **7\. Database Schema**

### **PostgreSQL Schema**

#### **Users Table**

```sql
CREATE TABLE users (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "lastName" VARCHAR(255) NOT NULL,
    "profileImageUrl" VARCHAR(255),
    "isVerified" BOOLEAN DEFAULT FALSE,
    "verificationToken" VARCHAR(255),
    "verificationTokenExpiresAt" TIMESTAMP,
    "resetPasswordToken" VARCHAR(255),
    "resetPasswordTokenExpiresAt" TIMESTAMP,
    biography TEXT,
    "phoneNumber" VARCHAR(255),
    degree VARCHAR(255),
    university VARCHAR(255),
    links JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **Pathways Table**

```sql
CREATE TABLE pathways (
    _id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES users(_id) ON DELETE CASCADE,
    title VARCHAR(255),
    description VARCHAR(255),
    species VARCHAR(255),
    category VARCHAR(255),
    tissue JSONB DEFAULT '{}'::jsonb,
    "relatedDisease" VARCHAR(255),
    "diseaseInput" JSONB DEFAULT '{}'::jsonb,
    reactions JSONB DEFAULT '[]'::jsonb,
    "recordDate" VARCHAR(255),
    "pubMeds" JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## **8\. Authentication & Security**

### **Security Features**

1. **Password Hashing**: bcrypt with 10 salt rounds
2. **JWT Tokens**: Separate access and refresh tokens
3. **HTTP-Only Cookies**: Prevents XSS attacks
4. **CORS Configuration**: Whitelist allowed origins
5. **Input Validation**: express-validator on all inputs
6. **Email Verification**: Required for account activation
7. **Secure Password Reset**: Token-based with expiration

### **Authentication Flow**

1. User registers → Email verification sent
2. User verifies email → Account activated
3. User logs in → JWT tokens issued
4. Access token expires → Refresh token used
5. Both tokens expire → User must log in again

### **Cookie Configuration**

```ts
{
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: tokenAge
}
```

---

## **9\. Development Guide**

### **Prerequisites**

- Node.js (v14+)
- PostgreSQL (v12+)
- Gmail account for email service

### **Setup Instructions**

1. **Clone Repository**

| git clone https://gitlab.glyco.info/hga/pathwayrepo_db cd pathwayrepo_db |
| :---------------------------------------------------------------------------------------------- |

2. **Install Dependencies**

| npm install |
| :---------- |

3. **Environment Configuration** Create `.env` file:

```env
NODE_ENV=development
FRONT_URL=http://localhost:3000
SERVER_URL=http://localhost:8080
PORT=8080

GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

POSTGRES_USER=your-db-user
POSTGRES_HOST=localhost
POSTGRES_PASSWORD=your-db-password
POSTGRES_DATABASE=pathway_db
POSTGRES_PORT=5432

JWT_SECRET_ACCESS_TOKEN=your-access-secret
JWT_SECRET_REFRESH_TOKEN=your-refresh-secret
```

4. **Database Setup** Create PostgreSQL database and run migrations (manual for now).

5. **Run Development Server**

| npm run dev |
| :---------- |

6. **Access Swagger Documentation** Navigate to `http://localhost:8080/docs`

### **Development Commands**

- `npm run dev` \- Start development server with hot reload
- `npm run build` \- Build TypeScript to JavaScript
- `npm start` \- Run production server
- `npm test` \- Run tests with Jest

### **Code Style Guidelines**

1. Use TypeScript for type safety
2. Follow Clean Architecture principles
3. Keep use cases focused and single-purpose
4. Use dependency injection
5. Handle errors with custom error classes
6. Validate all inputs
7. Use async/await for asynchronous operations

### **Adding New Features**

#### **1\. Adding a New Entity**

1. Create entity interface in `domain/entity/`
2. Create repository interface in `domain/repository/`
3. Create DTOs in `application/dtos/`
4. Implement repository in `infrastructure/repository/`
5. Create database model in `infrastructure/database/`

#### **2\. Adding a New Use Case**

1. Create use case in `application/use-cases/`
2. Add to use case index file
3. Wire up in `presentation/dependencies/`
4. Create controller method
5. Add route
6. Add validators if needed
7. Document in Swagger

#### **3\. Adding a New Service**

1. Create interface in `domain/services/`
2. Implement in `infrastructure/services/`
3. Wire up in dependencies

---

## **Clean Architecture UML**

![Clean Architecture](docs/images/uml.png)
[https://www.svgviewer.dev/s/WndVis8j](https://www.svgviewer.dev/s/WndVis8j)

## **Sequence Diagram \- User Registration & Login Flow**

![Sequence Diagram](docs/images/sequence_diagram_auth.png)
[https://www.svgviewer.dev/s/jhc4p1Cu](https://www.svgviewer.dev/s/jhc4p1Cu)

## **Entity Relationship Diagram \- PostgreSQL Schema**

![ERD Diagram](docs/images/erd.png)
[https://www.svgviewer.dev/s/1v9Q073](https://www.svgviewer.dev/s/1v9Q073))
[https://www.svgviewer.dev/s/Fh0FNeWf](https://www.svgviewer.dev/s/Fh0FNeWf)
