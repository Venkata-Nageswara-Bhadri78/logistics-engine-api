# 🚚 Logistic Engine – System Architecture

This document explains the internal architecture, design philosophy, layering strategy, and scalability considerations of the Logistic Engine backend.

The system is designed to simulate production-grade backend architecture used in real-world logistics platforms.

---

# 1️⃣ Architectural Overview

The backend follows a **Layered Architecture Pattern** with strict separation of concerns.

```
Client (Web / Mobile / API Consumer)
        ↓
Express Routes
        ↓
Validation Middleware
        ↓
Authentication Middleware (JWT)
        ↓
Authorization Middleware (RBAC)
        ↓
Controllers (Business Orchestration)
        ↓
Service Layer (State Machine + Rules)
        ↓
Models (Database Queries)
        ↓
SQLite Database
```

Each layer has a single responsibility.

---

# 2️⃣ Core Architectural Principles

## ✅ Separation of Concerns

Each module is responsible for exactly one domain of logic:

| Layer       | Responsibility                 |
| ----------- | ------------------------------ |
| Routes      | HTTP mapping                   |
| Middleware  | Cross-cutting concerns         |
| Controllers | Request orchestration          |
| Services    | Business rules & state machine |
| Models      | Database interaction           |
| DB          | Persistence                    |

---

## ✅ Middleware-First Validation

Validation is executed before business logic.

Flow:

```
Request → Validate → Authenticate → Authorize → Controller
```

Benefits:

* Prevents invalid requests reaching business logic
* Cleaner controllers
* Predictable error handling

---

## ✅ Stateless Authentication

* JWT-based authentication
* No server-side sessions
* Scalable horizontally
* Suitable for load balancers

---

## ✅ Strict State Machine Enforcement

Order lifecycle is controlled via a deterministic backend state machine:

```
CREATED → ASSIGNED → IN_TRANSIT → DELIVERED → COMPLETED
                         ↓
                       FAILED → RETURNED → COMPLETED
```

Invalid transitions are rejected with `409 Conflict`.

This ensures business integrity.

---

# 3️⃣ Module Breakdown

---

## 📁 src/

### app.js

* Express app initialization
* Middleware setup
* Route mounting
* Global error handler registration

---

### config/

Contains environment-based configuration.

Example:

* Database initialization
* JWT secret management
* Logging configuration

---

### routes/

Defines HTTP endpoints.

Responsibilities:

* Route path definition
* Middleware attachment
* Controller binding

Routes do not contain business logic.

---

### middlewares/

Handles cross-cutting concerns:

* JWT verification
* Role authorization
* Request validation
* Error handling
* Logging injection

---

### controllers/

Responsible for:

* Extracting request data
* Calling service functions
* Returning formatted response

Controllers never directly write SQL queries.

---

### services/

Contains core business rules:

* Order lifecycle enforcement
* Status transition validation
* Agent reassignment logic
* Retry flow validation

This is the heart of the system.

---

### models/

Responsible for:

* SQL queries
* Data persistence
* Foreign key enforcement
* Returning raw database results

No business rules inside models.

---

### utils/

Contains reusable helpers:

* JWT utilities
* Response formatters
* Custom error classes
* Logging utilities

---

# 4️⃣ Request Lifecycle (Detailed Flow)

Example: `PUT /orders/:id/status`

1. Client sends request with JWT
2. Route matches endpoint
3. Validation middleware checks payload
4. Auth middleware verifies token
5. Role middleware checks permission
6. Controller extracts parameters
7. Service validates state transition
8. Model updates database
9. History record inserted
10. Controller sends structured JSON response

---

# 5️⃣ Error Handling Strategy

Centralized error handling using:

* `AppError` custom class
* Express global error middleware
* Structured error response format

Example error flow:

```
Throw AppError → Catch in error middleware → Format → Send JSON
```

Benefits:

* Consistent error format
* No duplicated error handling
* Cleaner controller code

---

# 6️⃣ Logging Architecture

Structured logging using Winston.

Logged events include:

* Authentication failures
* Invalid transitions
* Order assignments
* Delivery failures
* Server errors

Log format:

```
Timestamp | Level | Module | Message | Metadata
```

Supports production monitoring.

---

# 7️⃣ Database Architecture

Relational model with enforced foreign keys.

Core entities:

* users
* agents
* customers
* orders
* order_history

Important properties:

* CHECK constraints on status
* Indexed lookup fields
* Referential integrity
* Atomic status updates

---

# 8️⃣ State Consistency Strategy

To prevent inconsistent states:

* Application-level transition validation
* DB-level CHECK constraints
* History logging within same execution flow
* Rejection of invalid operations

---

# 9️⃣ Scalability Design

The system is horizontally scalable because:

* No in-memory session storage
* JWT stateless authentication
* DB portable schema
* Clear modularization

Future horizontal scaling options:

* PostgreSQL migration
* Read replicas
* Redis caching
* Microservice splitting (Orders, Auth, Agents)

---

# 🔟 Security Architecture

Security layers include:

* JWT authentication
* Role-based access control
* Password hashing (bcrypt)
* SQL injection protection via prepared statements
* Controlled status transitions
* Input validation middleware

---

# 1️⃣1️⃣ Performance Considerations

Optimizations:

* Indexed foreign keys
* Indexed status field
* Paginated queries
* Limited history joins
* Controlled response sizes

---

# 1️⃣2️⃣ Future Architecture Evolution

Potential improvements:

* CQRS pattern
* Event-driven architecture
* Message queues (e.g., order events)
* Background job processing
* Distributed logging
* Observability integration

---

# 1️⃣3️⃣ Why This Architecture Matters

This project demonstrates:

* Backend state modeling
* Clean separation of layers
* Enterprise-like structure
* Defensive programming
* Production-oriented mindset

It is intentionally structured to simulate real-world logistics backend systems.

---

# 📌 Summary

The Logistic Engine backend is designed with:

* Deterministic business rules
* Layer isolation
* Scalable stateless authentication
* Enforced lifecycle transitions
* Structured logging & error abstraction

This architecture ensures maintainability, extensibility, and production readiness.