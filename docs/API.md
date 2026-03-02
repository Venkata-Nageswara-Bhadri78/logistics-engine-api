# 🚚 Logistic Engine API Specification

This document defines the complete HTTP interface for the Logistic Engine backend.

It includes:

* Endpoint definitions
* Request/response formats
* Authentication requirements
* Status codes
* Filtering & pagination behavior
* Business rules enforcement notes

All endpoints return JSON responses.

---

# 🔐 Authentication

All protected endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

If missing or invalid:

```
401 Unauthorized
```

If role insufficient:

```
403 Forbidden
```

---

# 📦 Response Format Standard

## ✅ Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

## ❌ Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

# 🧑‍💻 AUTH MODULE

---

## 1️⃣ Register User

### `POST /auth/register`

Registers a new user account.

### Request Body

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPassword123",
  "role": "CUSTOMER"
}
```

### Validation Rules

* Email must be unique
* Password must meet security requirements
* Role must be one of:

  * `ADMIN`
  * `AGENT`
  * `CUSTOMER`

### Success Response

```
201 Created
```

```json
{
  "success": true,
  "message": "User registered successfully"
}
```

---

## 2️⃣ Login

### `POST /auth/login`

Authenticates user and returns JWT.

### Request Body

```json
{
  "email": "john@example.com",
  "password": "StrongPassword123"
}
```

### Success Response

```
200 OK
```

```json
{
  "success": true,
  "data": {
    "token": "JWT_TOKEN",
    "user": {
      "id": 1,
      "role": "CUSTOMER"
    }
  }
}
```

---

## 3️⃣ Get Current User

### `GET /auth/me`

Returns authenticated user profile.

🔐 Requires authentication

```
200 OK
```

---

## 4️⃣ Change Password

### `PUT /auth/change-password`

🔐 Requires authentication

### Request Body

```json
{
  "currentPassword": "OldPassword",
  "newPassword": "NewStrongPassword"
}
```

---

# 📦 ORDER MODULE

---

## 1️⃣ Create Order

### `POST /orders`

Creates new order.

🔐 Role: CUSTOMER

### Request Body

```json
{
  "pickupAddress": "Location A",
  "deliveryAddress": "Location B",
  "packageWeight": 4.5,
  "priority": "NORMAL"
}
```

### Business Rules

* Order starts with status: `CREATED`
* Only CUSTOMER can create order

### Response

```
201 Created
```

---

## 2️⃣ Get Orders (Paginated & Filtered)

### `GET /orders`

🔐 Role: ADMIN / AGENT / CUSTOMER

### Query Parameters

| Param      | Type   | Description              |
| ---------- | ------ | ------------------------ |
| page       | number | Default 1                |
| limit      | number | Default 10               |
| status     | string | Filter by status         |
| agentId    | number | Filter by assigned agent |
| customerId | number | Filter by customer       |

### Example

```
GET /orders?page=1&limit=10&status=IN_TRANSIT
```

### Response

```json
{
  "success": true,
  "data": {
    "orders": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42
    }
  }
}
```

---

## 3️⃣ Get Order Details

### `GET /orders/:id`

Returns order with lifecycle history.

🔐 Access:

* CUSTOMER → own orders only
* AGENT → assigned orders only
* ADMIN → all

---

## 4️⃣ Assign Agent

### `PUT /orders/:id/assign`

🔐 Role: ADMIN

### Request Body

```json
{
  "agentId": 3
}
```

### Rules

* Order must be in `CREATED` state
* Transitions to `ASSIGNED`

---

## 5️⃣ Update Status

### `PUT /orders/:id/status`

🔐 Role: AGENT

### Request Body

```json
{
  "status": "IN_TRANSIT"
}
```

### Allowed Transitions

```
ASSIGNED → IN_TRANSIT
IN_TRANSIT → DELIVERED
DELIVERED → COMPLETED
```

Invalid transitions → `409 Conflict`

---

## 6️⃣ Cancel Order

### `PUT /orders/:id/cancel`

🔐 Role: CUSTOMER

Allowed only before shipment.

---

## 7️⃣ Mark Delivery Failed

### `PUT /orders/:id/fail`

🔐 Role: AGENT

Moves status to `FAILED`.

---

## 8️⃣ Reassign Agent

### `PUT /orders/:id/reassign`

🔐 Role: ADMIN

Only allowed if order not completed.

---

## 9️⃣ Retry Failed Order

### `PUT /orders/:id/retry`

🔐 Role: ADMIN

Moves:

```
FAILED → ASSIGNED
```

---

## 🔟 Order History

### `GET /orders/:id/history`

Returns full audit trail.

Example:

```json
[
  {
    "from": "CREATED",
    "to": "ASSIGNED",
    "changedBy": 1,
    "timestamp": "2026-01-01T10:00:00Z"
  }
]
```

---

# 📊 Status Codes Used

| Code | Meaning                  |
| ---- | ------------------------ |
| 200  | Success                  |
| 201  | Created                  |
| 400  | Validation error         |
| 401  | Unauthorized             |
| 403  | Forbidden                |
| 404  | Resource not found       |
| 409  | Invalid state transition |
| 500  | Internal server error    |

---

# 🔄 Pagination Standard

Pagination is implemented using:

```
LIMIT ? OFFSET ?
```

Total count is fetched separately.

---

# 🧠 Design Notes

* All state transitions validated in service layer
* Audit history written atomically with status updates
* Foreign key constraints enforced
* Role validation via middleware
* Filtering optimized using indexed fields

---

# 📌 Versioning Strategy

Future-proofing:

```
/api/v1/orders
```

Versioning not currently enabled but supported by route structure.

---

# 🚀 API Stability Commitment

* Backward compatibility maintained within major version
* Breaking changes require version increment
* All errors follow structured format
