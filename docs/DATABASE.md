# 🚚 Logistic Engine – Database Design & Schema Documentation

This document describes:

* Database architecture
* Schema definitions
* Constraints
* Indexing strategy
* Relationship mapping
* State integrity enforcement
* Performance considerations
* Migration portability

The database is implemented using **SQLite**, but the schema is fully portable to PostgreSQL with minimal changes.

---

# 1️⃣ Database Philosophy

The database layer follows these principles:

* Relational integrity
* Foreign key enforcement
* Defensive constraints
* Indexed query paths
* Auditability
* Minimal redundancy

All business-critical transitions are guarded at:

* Application level (service layer)
* Database level (CHECK constraints)

---

# 2️⃣ Entity Relationship Overview

Core entities:

```
users
  ├── agents
  ├── customers
  └── orders
         └── order_history
```

Relationships:

* One user → One role (ADMIN / AGENT / CUSTOMER)
* One customer → Many orders
* One agent → Many assigned orders
* One order → Many history entries

---

# 3️⃣ Tables & Schema Definitions

---

# 👤 users

Stores authentication and role data.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN','AGENT','CUSTOMER')),
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Notes:

* Email uniqueness enforced
* Role constraint prevents invalid roles
* `is_active` allows soft suspension

---

# 🚚 agents

Stores agent-specific metadata.

```sql
CREATE TABLE agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    vehicle_number TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Notes:

* 1-to-1 relationship with users
* Cascade delete ensures data integrity

---

# 🧍 customers

Stores customer-specific metadata.

```sql
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

# 📦 orders

Core business entity.

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    agent_id INTEGER,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    package_weight REAL NOT NULL,
    priority TEXT DEFAULT 'NORMAL' CHECK(priority IN ('LOW','NORMAL','HIGH')),
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK(
        status IN (
            'CREATED',
            'ASSIGNED',
            'IN_TRANSIT',
            'DELIVERED',
            'FAILED',
            'RETURNED',
            'COMPLETED',
            'CANCELLED'
        )
    ),
    failure_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id),
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);
```

---

## Order Status State Model

```
CREATED
ASSIGNED
IN_TRANSIT
DELIVERED
FAILED
RETURNED
COMPLETED
CANCELLED
```

Database restricts invalid status values via CHECK constraint.

Application layer enforces transition rules.

---

# 📜 order_history

Maintains full audit trail.

```sql
CREATE TABLE order_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by INTEGER NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(changed_by) REFERENCES users(id)
);
```

### Purpose:

* Audit compliance
* Debugging lifecycle issues
* Historical analytics
* Operational traceability

---

# 4️⃣ Indexing Strategy

Indexes are critical for performance.

---

## Orders Indexes

```sql
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_agent ON orders(agent_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

---

## Order History Index

```sql
CREATE INDEX idx_history_order ON order_history(order_id);
```

---

## Users Index

Email already indexed due to UNIQUE constraint.

---

# 5️⃣ Query Optimization Strategy

Optimizations applied:

* Indexed lookup columns
* Pagination using `LIMIT` + `OFFSET`
* Avoid SELECT *
* Fetch count separately for pagination
* Minimize joins where unnecessary

Example pagination:

```sql
SELECT * FROM orders
WHERE status = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?;
```

---

# 6️⃣ Data Integrity Enforcement

Integrity is maintained using:

* Foreign keys
* UNIQUE constraints
* CHECK constraints
* NOT NULL enforcement
* Application-level validation

SQLite foreign keys must be enabled:

```sql
PRAGMA foreign_keys = ON;
```

---

# 7️⃣ Transaction Strategy

For critical operations (e.g., status change + history insert):

Recommended:

```sql
BEGIN TRANSACTION;
UPDATE orders ...
INSERT INTO order_history ...
COMMIT;
```

Prevents partial updates.

---

# 8️⃣ Soft Delete Strategy (If Needed)

Future enhancement:

Add column:

```sql
is_deleted INTEGER DEFAULT 0
```

Then filter queries using:

```sql
WHERE is_deleted = 0
```

---

# 9️⃣ Portability to PostgreSQL

Minimal changes required:

* Replace `INTEGER PRIMARY KEY AUTOINCREMENT` with `SERIAL PRIMARY KEY`
* Replace `DATETIME` with `TIMESTAMP`
* Remove SQLite-specific syntax

Schema intentionally designed to be portable.

---

# 🔟 Concurrency Considerations

SQLite limitations:

* Single-writer lock model
* Suitable for small to medium workloads

For high scale:

* Migrate to PostgreSQL
* Implement row-level locking
* Use transaction isolation levels

---

# 1️⃣1️⃣ Data Growth Considerations

As order_history grows:

* Implement archival strategy
* Partition by date (PostgreSQL)
* Introduce read replicas

---

# 1️⃣2️⃣ Why This Database Design Matters

This schema demonstrates:

* Relational modeling discipline
* Lifecycle enforcement
* Audit traceability
* Index-based performance thinking
* Constraint-based defensive design

It reflects real-world backend database engineering practices.

---

# 📌 Summary

The Logistic Engine database is designed to:

* Preserve business invariants
* Enforce valid states
* Maintain audit history
* Optimize query performance
* Remain scalable and portable

It balances simplicity (SQLite) with production-aware design principles.