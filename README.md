# 🚚 Logistic Engine API

Production-grade logistics backend built with Node.js and Express, designed to simulate real-world order lifecycle management, role-based access control, and failure recovery workflows.

---

## 📌 Overview

Logistic Engine API manages:

* Order creation and lifecycle enforcement
* Agent assignment and reassignment
* Delivery failure handling and retry flows
* Role-based access control (Admin, Agent, Customer)
* Structured logging and centralized error handling
* Paginated and filtered order retrieval
* Audit history tracking for all state transitions

The system enforces a strict backend state machine to prevent invalid business operations.

---

## 🏗 Architecture

Layered, modular backend design:

```
Client
  ↓
Routes
  ↓
Validation Middleware
  ↓
Auth & Role Middleware
  ↓
Controllers (Business Logic)
  ↓
Models (Database Layer)
  ↓
SQLite
```

Key principles:

* Separation of concerns
* Middleware-first validation
* Stateless JWT authentication
* Centralized error handling
* Structured JSON logging
* DB-level constraints + application-level guards

---

## 🔐 Authentication & RBAC

JWT-based authentication with role enforcement.

Supported roles:

* **ADMIN** – Full system control
* **AGENT** – Manage assigned orders
* **CUSTOMER** – Manage own orders

All protected routes require:

```
Authorization: Bearer <token>
```

---

## 📦 Order Lifecycle

Strictly enforced state machine:

```
CREATED → ASSIGNED → IN_TRANSIT → DELIVERED → COMPLETED
                         ↓
                       FAILED → RETURNED → COMPLETED
```

Invalid transitions are rejected at backend level.

All status updates are logged in `order_history` for audit tracking.

---

## 🚀 Core API Overview

### Auth

* `POST /auth/register`
* `POST /auth/login`
* `GET /auth/me`
* `PUT /auth/change-password`

---

### Orders

* `POST /orders` – Create order
* `GET /orders` – Paginated + filtered fetch
* `GET /orders/:id` – Order details with history
* `PUT /orders/:id/assign` – Assign agent
* `PUT /orders/:id/status` – Update status
* `PUT /orders/:id/cancel` – Cancel order
* `PUT /orders/:id/fail` – Mark delivery failed
* `PUT /orders/:id/reassign` – Reassign agent
* `PUT /orders/:id/retry` – Retry failed order
* `GET /orders/:id/history` – Lifecycle history

Detailed request/response specs are available in `/docs` (to be added).

---

## 🗄 Database Design

Relational schema (SQLite), production-portable.

Core tables:

* `users`
* `customers`
* `agents`
* `orders`
* `order_history`

Key characteristics:

* Foreign key enforcement
* Indexed lookup fields
* Status CHECK constraints
* Audit history tracking
* Application-level state validation

Schema is portable to PostgreSQL with minimal modification.

---

## 📊 Engineering Highlights

This project demonstrates:

* Backend state machine modeling
* Business rule enforcement at application layer
* Role-based authorization middleware
* Centralized error abstraction (`AppError`)
* Async error wrapping pattern
* Structured logging with Winston
* Environment-based configuration
* Paginated & filtered querying
* Auditability via order history
* Defensive programming practices
* Production-oriented folder structure

---
## 📦 Scalability Considerations

The architecture is designed to be horizontally scalable:

* Stateless authentication (JWT)
* No in-memory session storage
* Database-portable schema
* Clear separation between business and transport layers
* Ready for load balancer deployment

---

## ⚙️ Environment Configuration

Create `.env`:

```
PORT=8080
JWT_SECRET=your_secret_key_here
BASE_URL=http://localhost:
```

`.env` must not be committed.

---

## 🛠 Setup & Run

### 1. Install dependencies

```
npm install
```

### 2. Start server

```
node src/app.js
```

or

```
npx nodemon src/app.js
```

Server runs at:

```
http://localhost:8080
```

---

## 🔎 Design Decisions

* SQLite chosen for simplicity and portability
* Structured logging implemented for production-style observability
* Validation handled via custom middleware for full control
* Status transitions guarded at both application and schema level

---

## 📈 Future Enhancements

* PostgreSQL migration
* Redis caching layer
* Rate limiting & API throttling
* Docker containerization
* CI/CD pipeline
* Unit & integration tests
* OpenAPI (Swagger) documentation

---

## 👨‍💻 Author

Backend Developer focused on scalable architecture, clean design patterns, and production-ready systems.