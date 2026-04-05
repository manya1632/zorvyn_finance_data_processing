# Finance Data Processing and Access Control Backend

## Overview

This project is a backend system designed for managing financial data and enforcing role-based access control in a structured and scalable manner.

The system simulates a finance dashboard backend where different types of users interact with financial records based on their roles. It provides endpoints for managing users, financial records, audit logs, and aggregated dashboard insights.

The implementation focuses on clarity, maintainability, correctness, and logical separation of concerns.

---

## Objectives

The backend is designed to:

* Manage users and enforce role-based permissions
* Handle financial records with full CRUD operations
* Provide aggregated data for dashboard analytics
* Ensure proper validation, error handling, and structured responses
* Demonstrate clean backend architecture and maintainable code structure

---

## Tech Stack

| Layer          | Technology                  |
| -------------- | --------------------------- |
| Runtime        | Node.js 20                  |
| Framework      | Express                     |
| Language       | TypeScript                  |
| Database       | PostgreSQL                  |
| ORM            | Prisma                      |
| Authentication | JSON Web Tokens (JWT)       |
| Validation     | Zod                         |
| Logging        | Winston + Morgan            |
| Testing        | Jest, Supertest, fast-check |

---

## Architecture

The application follows a layered architecture with clear separation of responsibilities:

```
Request → Routes → Controllers → Services → Prisma (Database)
                ↓
          Middleware Layer:
          helmet → cors → requestLogger → rateLimiter
          → authenticate → authorize
                ↓
          Centralized Error Handling
```

### Key Design Principles

* Modular and scalable folder structure
* Separation of concerns between layers
* Middleware-driven request processing
* Centralized error handling
* Consistent response format across all endpoints

---

## Role-Based Access Control

The system enforces strict access control based on user roles:

| Feature                      | Viewer | Analyst | Admin |
| ---------------------------- | ------ | ------- | ----- |
| Dashboard Access             | Yes    | Yes     | Yes   |
| View Records                 | No     | Yes     | Yes   |
| Create/Update/Delete Records | No     | No      | Yes   |
| User Management              | No     | No      | Yes   |
| Audit Logs                   | No     | No      | Yes   |

---

## Core Features

### 1. User and Role Management

* Create and manage users
* Assign roles (Viewer, Analyst, Admin)
* Update user details and status (active/inactive)
* Enforce role-based access restrictions

### 2. Financial Records Management

* Create, update, delete, and view records
* Fields include amount, type, category, date, and notes
* Filtering, searching, and pagination support
* Soft delete implementation

### 3. Dashboard Analytics

* Total income and expenses
* Net balance calculation
* Category-wise breakdown
* Monthly trends
* Recent activity

### 4. Access Control

* Middleware-based authentication and authorization
* JWT-based user verification
* Role enforcement at route level

### 5. Validation and Error Handling

* Schema validation using Zod
* Structured error responses
* Appropriate HTTP status codes
* Protection against invalid input

### 6. Audit Logging

* Tracks user actions on resources
* Supports filtering and pagination
* Stored persistently in database

---

## Environment Variables

Create a `.env` file using `.env.example`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_db
JWT_SECRET=your_secret_key_at_least_32_characters
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
CACHE_TTL_SECONDS=60
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=10
```

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/manya1632/zorvyn_finance_data_processing.git
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Update values accordingly.

### 4. Setup Database

```bash
npx prisma migrate dev
```

### 5. Run Server

```bash
npm run dev
```

Server will run at:

```
http://localhost:3000
```

---

## Docker Setup

### Run using Docker

```bash
docker compose up --build
```

### Stop containers

```bash
docker compose down
```

---

## API Base URL

```
http://localhost:3000/api/v1
```

---

## API Documentation (Swagger)

```
http://localhost:3000/api/v1/docs
```

Swagger UI allows:

* Viewing all endpoints
* Testing APIs directly
* Adding JWT authentication

---

## API Usage Flow

### Step 1: Register

```
POST /api/v1/auth/register
```

### Step 2: Login

```
POST /api/v1/auth/login
```

Copy the JWT token from response.

### Step 3: Authorize

Use in Swagger or Postman:

```
Authorization: Bearer <token>
```

---

## API Endpoints

### Authentication

| Method | Endpoint       | Description           |
| ------ | -------------- | --------------------- |
| POST   | /auth/register | Register a new user   |
| POST   | /auth/login    | Login and receive JWT |

---

### Users (Admin Only)

| Method | Endpoint           |
| ------ | ------------------ |
| POST   | /users             |
| GET    | /users             |
| GET    | /users/{id}        |
| PUT    | /users/{id}        |
| DELETE | /users/{id}        |
| PATCH  | /users/{id}/status |

---

### Records

| Method | Endpoint      | Access         |
| ------ | ------------- | -------------- |
| POST   | /records      | Admin          |
| GET    | /records      | Analyst, Admin |
| GET    | /records/{id} | Analyst, Admin |
| PUT    | /records/{id} | Admin          |
| DELETE | /records/{id} | Admin          |

---

### Dashboard

| Method | Endpoint                      |
| ------ | ----------------------------- |
| GET    | /dashboard/summary            |
| GET    | /dashboard/category-breakdown |
| GET    | /dashboard/monthly-trends     |
| GET    | /dashboard/recent-activity    |

---

### Audit Logs (Admin Only)

| Method | Endpoint    |
| ------ | ----------- |
| GET    | /audit-logs |

---

## Testing

### Run all tests

```bash
npm test
```

### Unit tests

```bash
npm run test:unit
```

### Property-based tests

```bash
npm run test:property
```

### Coverage

```bash
npm run test:coverage
```

---

## Design Decisions and Assumptions

* Soft delete is used to preserve historical data
* JWT is used for stateless authentication
* ZOD validations follow basic input validation
* Role-based access is enforced using middleware
* Prisma ORM ensures type safety and database abstraction
* Dashboard endpoints use aggregation queries for efficiency
* Audit logs are recorded asynchronously
* Pagination + Filtering help optimise UX
* Rate Limiting avoids attacks

---

## Notes

* Swagger documentation is available only in development mode
* PostgreSQL must be running before starting the server
* JWT secret must be at least 32 characters long
* Docker setup includes both API and database services

---

## Author

Manya Gupta
