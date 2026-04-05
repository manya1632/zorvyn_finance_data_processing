# Finance Data Processing & Access Control Backend

A **production-ready REST API** for managing financial records with **Role-Based Access Control (RBAC)**.
Built using **Node.js, Express, TypeScript, Prisma, PostgreSQL** with industry-standard practices.

---

## Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Runtime    | Node.js 20                    |
| Framework  | Express                       |
| Language   | TypeScript                    |
| Database   | PostgreSQL                    |
| ORM        | Prisma                        |
| Auth       | JWT + bcrypt                  |
| Validation | Zod                           |
| Logging    | Winston + Morgan              |
| Testing    | Jest + Supertest + fast-check |

---

## Architecture

```
Request → Routes → Controllers → Services → Prisma (DB)
                ↓
          Middleware:
          helmet → cors → logger → rateLimiter
          → authenticate → authorize
                ↓
          Centralized Error Handler
```

---

## Role-Based Access Control

| Feature       | VIEWER | ANALYST | ADMIN |
| ------------- | ------ | ------- | ----- |
| Dashboard     | ✅      | ✅       | ✅     |
| Records Read  | ❌      | ✅       | ✅     |
| Records Write | ❌      | ❌       | ✅     |
| Users         | ❌      | ❌       | ✅     |
| Audit Logs    | ❌      | ❌       | ✅     |

---

## Local Setup

### 1️⃣ Clone Repository

```bash
git clone <your-repo-url>
cd <project-folder>
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Setup Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_db
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_EXPIRES_IN=24h
PORT=3000
NODE_ENV=development
```

---

### 4️⃣ Setup Database

```bash
npx prisma migrate dev
```

---

### 5️⃣ Run Backend

```bash
npm run dev
```

Server runs at:

```
http://localhost:3000
```

---

## API Base URL

```
http://localhost:3000/api/v1
```

---

## Swagger Documentation

```
http://localhost:3000/api/v1/docs
```

👉 Open this in browser to:

* Explore all APIs
* Test endpoints
* Add JWT token

---

## How to Use APIs

### 1. Register

```
POST /api/v1/auth/register
```

```json
{
  "name": "Manya",
  "email": "manya@gmail.com",
  "password": "password123",
  "role": "ADMIN"
}
```

---

### 2. Login

```
POST /api/v1/auth/login
```

➡️ Copy JWT token

---

### 3. Authorize

In Swagger → Click **Authorize**

```
Bearer YOUR_TOKEN
```

---

### 4. Use APIs

Example:

```
GET /api/v1/users
GET /api/v1/records
GET /api/v1/dashboard/summary
```

---

## Running Tests

```bash
npm test
npm run test:unit
npm run test:property
npm run test:coverage
```

---

## Integration Test Setup

Create `.env.test`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/test_db
```

```bash
npm run test:integration
```

---

# Complete API Endpoints

---

## Auth

| Method | Endpoint         | Description           |
| ------ | ---------------- | --------------------- |
| POST   | `/auth/register` | Register a new user   |
| POST   | `/auth/login`    | Login and receive JWT |

---

## Users (ADMIN only)

| Method | Endpoint             | Description        |
| ------ | -------------------- | ------------------ |
| POST   | `/users`             | Create user        |
| GET    | `/users`             | List users         |
| GET    | `/users/{id}`        | Get user by ID     |
| PUT    | `/users/{id}`        | Update user        |
| DELETE | `/users/{id}`        | Soft delete user   |
| PATCH  | `/users/{id}/status` | Update user status |

---

## Records

| Method | Endpoint        | Roles          | Description   |
| ------ | --------------- | -------------- | ------------- |
| POST   | `/records`      | ADMIN          | Create record |
| GET    | `/records`      | ANALYST, ADMIN | List records  |
| GET    | `/records/{id}` | ANALYST, ADMIN | Get record    |
| PUT    | `/records/{id}` | ADMIN          | Update record |
| DELETE | `/records/{id}` | ADMIN          | Soft delete   |

---

## Dashboard

| Method | Endpoint                        | Roles | Description       |
| ------ | ------------------------------- | ----- | ----------------- |
| GET    | `/dashboard/summary`            | ALL   | Financial summary |
| GET    | `/dashboard/category-breakdown` | ALL   | Category stats    |
| GET    | `/dashboard/monthly-trends`     | ALL   | Monthly trends    |
| GET    | `/dashboard/recent-activity`    | ALL   | Recent records    |

---

## Audit Logs (ADMIN only)

| Method | Endpoint      | Description                  |
| ------ | ------------- | ---------------------------- |
| GET    | `/audit-logs` | List audit logs with filters |

---

## Schemas

### Success Response

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

---

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  }
}
```

---

## 📌 Features

* 1. JWT Authentication
* 2. RBAC Authorization
* 3. Zod Validation
* 4. Swagger Docs
* 5. Rate Limiting
* 6. Soft Delete
* 7. Audit Logging
* 8. Dashboard Analytics
* 9. Pagination + Filtering

---

## Docker

```
docker-compose up --build
```

---

## Notes

* Swagger only in development
* PostgreSQL required
* JWT secret ≥ 32 chars

---

## Author

Manya Gupta
