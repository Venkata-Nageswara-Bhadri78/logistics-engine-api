# 🚚 Logistic Engine – Design Decisions & Rationale

This document explains the key architectural and engineering decisions made while designing the Logistic Engine backend.

It outlines:

* Why specific technologies were chosen
* Trade-offs considered
* Alternative approaches
* Scalability implications
* Long-term evolution strategy

The goal is to demonstrate engineering maturity beyond simple CRUD implementation.

---

# 1️⃣ Why Layered Architecture?

## Decision:

Adopted a strict layered architecture (Routes → Middleware → Controllers → Services → Models → DB).

## Why:

* Clear separation of concerns
* Easier testing
* Better maintainability
* Cleaner scaling
* Avoids "fat controller" anti-pattern

## Trade-off:

* Slightly more boilerplate
* Requires discipline to maintain boundaries

## Why It Matters:

In production systems, separation of concerns reduces coupling and improves long-term maintainability.

---

# 2️⃣ Why SQLite Initially?

## Decision:

SQLite chosen for development simplicity and portability.

## Why:

* Zero setup
* Lightweight
* Ideal for local development
* Portable schema
* Easy CI integration

## Trade-off:

* Limited concurrency
* Single-writer lock model
* Not ideal for high-throughput production

## Migration Strategy:

Schema designed to be PostgreSQL-compatible with minimal changes:

* Replace AUTOINCREMENT with SERIAL
* Replace DATETIME with TIMESTAMP
* Maintain same relational design

---

# 3️⃣ Why JWT-Based Authentication?

## Decision:

Stateless JWT authentication instead of session-based auth.

## Why:

* Horizontally scalable
* No in-memory session storage
* Compatible with load balancers
* Works well in distributed systems

## Trade-off:

* Harder token revocation
* Requires expiration management

## Security Safeguards:

* Short token expiry
* Secret stored in environment
* No sensitive payload data

---

# 4️⃣ Why Role-Based Access Control (RBAC)?

## Decision:

Implemented RBAC instead of more complex policy systems.

## Why:

* Clear domain roles (ADMIN, AGENT, CUSTOMER)
* Predictable permission mapping
* Easy to extend
* Sufficient for logistics domain

## Alternative Considered:

* Attribute-Based Access Control (ABAC)
* Policy engines

## Conclusion:

RBAC provides the right balance between simplicity and control for this domain.

---

# 5️⃣ Why Enforce State Machine in Backend?

## Decision:

Strict lifecycle validation implemented in service layer.

## Why:

* Prevent invalid business transitions
* Maintain order integrity
* Avoid corrupted states
* Simulate real-world logistics workflows

## Example:

Invalid transition:

```
CREATED → DELIVERED ❌
```

Rejected with:

```
409 Conflict
```

## Why It Matters:

Business logic must live in backend, not frontend.

---

# 6️⃣ Why Maintain Order History Table?

## Decision:

Implemented `order_history` for audit trail.

## Why:

* Traceability
* Debugging support
* Operational auditing
* Compliance simulation
* Historical analytics

## Trade-off:

* Increased storage usage
* Slight performance overhead

## Long-Term Benefit:

Provides foundation for event-driven architecture.

---

# 7️⃣ Why Centralized Error Handling?

## Decision:

All errors flow through a global error middleware.

## Why:

* Consistent error responses
* Cleaner controllers
* Avoid duplicated try-catch logic
* Structured JSON errors

## Pattern Used:

Custom `AppError` class.

Example structure:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot move from CREATED to DELIVERED"
  }
}
```

---

# 8️⃣ Why Structured Logging?

## Decision:

Implemented structured logging using a logging library.

## Why:

* Better observability
* Production-style debugging
* Log level control (info, warn, error)
* Ready for centralized log aggregation

## Trade-off:

* Slight setup complexity

---

# 9️⃣ Why Middleware-First Validation?

## Decision:

Validation happens before controller execution.

## Why:

* Keeps controllers clean
* Prevents invalid requests from reaching business logic
* Easier to test
* Improves code readability

---

# 🔟 Why Use Prepared Statements?

## Decision:

All queries use parameter binding.

## Why:

* Prevent SQL injection
* Improve security
* Promote consistent DB interaction

---

# 1️⃣1️⃣ Why Soft Coupling Between Modules?

## Decision:

Controllers do not directly access database logic.

## Why:

* Easier testing via mocking
* Clear abstraction boundaries
* Improved maintainability
* Service layer can evolve independently

---

# 1️⃣2️⃣ Why Not Microservices?

## Decision:

Monolithic modular backend.

## Why:

* Simpler deployment
* Easier debugging
* Suitable for current scale
* Avoid unnecessary complexity

## Future Evolution:

System can be split into:

* Auth Service
* Order Service
* Agent Service
* Notification Service

---

# 1️⃣3️⃣ Why No In-Memory State?

## Decision:

No in-memory sessions or state storage.

## Why:

* Enables horizontal scaling
* Avoids sticky sessions
* Load balancer compatible
* Production-ready approach

---

# 1️⃣4️⃣ Why Defensive Programming?

Design intentionally includes:

* CHECK constraints
* Foreign keys
* Ownership validation
* State validation
* Role enforcement
* Consistent error codes

This prevents:

* Silent failures
* Data corruption
* Business logic leakage

---

# 1️⃣5️⃣ Scalability Path

System is prepared for:

1. PostgreSQL migration
2. Read replicas
3. Redis caching
4. Message queue integration
5. Background job workers
6. Containerized deployment
7. CI/CD pipeline integration

---

# 1️⃣6️⃣ Engineering Philosophy

The project prioritizes:

* Correctness over speed
* Integrity over convenience
* Structure over shortcuts
* Clarity over cleverness

It simulates production design decisions even within a small-scale implementation.

---

# 📌 Summary

The Logistic Engine backend design is intentionally structured to reflect:

* Enterprise architectural thinking
* Defensive business rule enforcement
* Clear separation of responsibilities
* Scalability awareness
* Security-conscious implementation

Every major decision was made with long-term maintainability and production-readiness in mind.