# 🚚 Logistic Engine – Authentication & Authorization Design

This document explains:

* Authentication mechanism
* Role-Based Access Control (RBAC)
* Permission matrix
* Access enforcement flow
* Security decisions
* Token lifecycle strategy

The system uses **JWT-based stateless authentication** combined with **Role-Based Access Control (RBAC)**.

---

# 1️⃣ Authentication Overview

Authentication verifies **who the user is**.

The system uses:

* JSON Web Tokens (JWT)
* Stateless session management
* Password hashing with bcrypt
* Bearer token strategy

---

## 🔑 Authentication Flow

### Step 1 – Login

```
POST /auth/login
```

* User provides email + password
* Password verified using bcrypt
* JWT issued upon success

---

### Step 2 – Token Issuance

JWT contains:

```json
{
  "userId": 1,
  "role": "ADMIN",
  "iat": 1710000000,
  "exp": 1710003600
}
```

Properties:

* `userId` → Unique identifier
* `role` → Used for RBAC enforcement
* `exp` → Token expiration time

---

### Step 3 – Protected Request

Client sends:

```
Authorization: Bearer <JWT_TOKEN>
```

---

### Step 4 – Middleware Verification

Auth middleware:

1. Extracts token
2. Verifies signature using `JWT_SECRET`
3. Decodes payload
4. Attaches user data to `req.user`
5. Proceeds to next middleware

If invalid:

```
401 Unauthorized
```

---

# 2️⃣ Authorization Overview (RBAC)

Authorization determines **what the user is allowed to do**.

The system enforces role-based access at middleware level.

Supported roles:

| Role     | Description                  |
| -------- | ---------------------------- |
| ADMIN    | Full system control          |
| AGENT    | Manage assigned deliveries   |
| CUSTOMER | Create and manage own orders |

---

# 3️⃣ Role Permission Matrix

| Action               | ADMIN | AGENT | CUSTOMER |
| -------------------- | ----- | ----- | -------- |
| Register             | ✅     | ✅     | ✅        |
| Login                | ✅     | ✅     | ✅        |
| Create Order         | ❌     | ❌     | ✅        |
| View Own Orders      | ❌     | ❌     | ✅        |
| View Assigned Orders | ❌     | ✅     | ❌        |
| View All Orders      | ✅     | ❌     | ❌        |
| Assign Agent         | ✅     | ❌     | ❌        |
| Update Order Status  | ❌     | ✅     | ❌        |
| Cancel Order         | ❌     | ❌     | ✅        |
| Mark Delivery Failed | ❌     | ✅     | ❌        |
| Reassign Agent       | ✅     | ❌     | ❌        |
| Retry Failed Order   | ✅     | ❌     | ❌        |
| View Order History   | ✅     | ✅     | Limited  |

---

# 4️⃣ Authorization Middleware Design

Authorization is enforced using middleware chaining.

Example:

```js
router.put(
  "/orders/:id/assign",
  verifyToken,
  authorizeRoles("ADMIN"),
  assignAgentController
);
```

---

## 🔒 authorizeRoles Middleware

Pseudo logic:

```js
if (!allowedRoles.includes(req.user.role)) {
    throw new AppError("Forbidden", 403);
}
```

This ensures:

* Clean controllers
* Centralized permission logic
* Easy scalability

---

# 5️⃣ Resource-Level Authorization

Beyond role checks, additional constraints exist:

---

## 🧍 Customer Restrictions

Customers can:

* Access only their own orders

Enforced by:

```sql
WHERE customer_id = ?
```

---

## 🚚 Agent Restrictions

Agents can:

* Access only assigned orders

Enforced by:

```sql
WHERE agent_id = ?
```

---

## 👑 Admin Privileges

Admins:

* Bypass ownership restrictions
* Access all records

---

# 6️⃣ Order State Authorization

Authorization is also dependent on order state.

Examples:

| Action        | Required State        |
| ------------- | --------------------- |
| Assign Agent  | CREATED               |
| Update Status | ASSIGNED / IN_TRANSIT |
| Cancel Order  | CREATED               |
| Retry Order   | FAILED                |

Even if role is valid, state must also be valid.

This ensures dual-layer protection:

* Role-based
* State-based

---

# 7️⃣ Token Security Design

Security measures:

* Tokens expire (e.g., 1 hour)
* JWT_SECRET stored in `.env`
* No token stored in server memory
* No sensitive data inside JWT payload
* Signature verification required on every request

---

# 8️⃣ Password Security

Passwords are:

* Hashed using bcrypt
* Salted automatically
* Never stored in plaintext
* Never returned in responses

---

# 9️⃣ Failure Handling Strategy

Unauthorized access results in:

### 401 – Missing or Invalid Token

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### 403 – Role Not Allowed

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

---

# 🔟 Security Hardening Considerations

Future enhancements:

* Refresh token rotation
* Token blacklist for logout
* Rate limiting on login
* Account lockout after failed attempts
* Multi-factor authentication
* IP-based anomaly detection

---

# 1️⃣1️⃣ Why JWT Instead of Sessions?

Advantages:

* Stateless scaling
* No server memory storage
* Works behind load balancers
* Suitable for microservices

Trade-offs:

* Token revocation complexity
* Must rely on expiration strategy

---

# 1️⃣2️⃣ Security Boundaries

Security is enforced at:

1. Route layer (middleware)
2. Controller layer (ownership checks)
3. Service layer (state validation)
4. Database layer (foreign keys & constraints)

Defense-in-depth strategy is applied.

---

# 1️⃣3️⃣ Authorization Design Rationale

The RBAC model was chosen because:

* Simple and predictable
* Easy to extend
* Scales well for logistics domain
* Clear separation between roles

More complex systems could use:

* Attribute-Based Access Control (ABAC)
* Policy engines
* External IAM systems

---

# 📌 Summary

The Logistic Engine implements:

* Stateless JWT authentication
* Role-Based Access Control
* Resource ownership validation
* State-dependent authorization
* Structured failure responses

The system enforces access control at multiple layers to ensure business integrity and security.