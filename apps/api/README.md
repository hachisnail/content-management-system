
```markdown
# Museo Bulawan Management System

## Architecture & Implementation Guide (Extended)

This document is the authoritative technical reference for the Museo Bulawan Management System. It describes not only *what* each part of the system does, but *why* it exists, *how* it interacts with other layers, and the constraints developers must respect when extending the platform.

This guide is intended for:

* Backend developers
* Security auditors
* DevOps / deployment engineers
* Future maintainers of the system

---

## 1. Technical Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| Runtime | **Node.js (ESM)** | Native async I/O, strong ecosystem, modern syntax (`import`/`export`). |
| Framework | **Express.js v5.2.1** | Minimal, predictable middleware model with modern error handling. |
| Database | **MariaDB (via mysql2) + Sequelize** | Strong relational guarantees with ORM safety and efficient driver. |
| Auth | **Passport.js (Local + Sessions)** | Secure server-side sessions (no JWT leaks); `connect-session-sequelize` for storage. |
| Validation | **Yup** | Single source of truth for data contracts. |
| Realtime | **Socket.io** | Stateful bi-directional channels for live updates. |
| Files | **Multer + File-Type** | Deep signature checks (magic bytes) to prevent MIME spoofing. |
| Security | **Helmet, Rate-Limit, bcryptjs** | Hardened headers, request throttling, and secure password hashing. |

---

## 2. System Design Philosophy

The system is built around five non-negotiable principles:

### 2.1 Deterministic Flow

Every request must follow the same predictable path:


```

Client → Route → Middleware → Controller → Service → Model → DB

```

No business logic is allowed in:

* Routes
* Middleware
* Models

This ensures:

* Debuggability
* Testability
* Auditability

---

### 2.2 Single Source of Truth

| Concern | Source |
| :--- | :--- |
| Data shape | Yup schemas |
| Permissions | `config/roles.js` |
| Auth state | Session store (`sessions` table) |
| Side effects | Services only |
| Realtime | `socketHooks.js` only |

There must never be:

* Duplicate validation logic
* Permission checks in controllers
* Socket emits outside socketHooks

---

### 2.3 Server-Authoritative State

The server is always the final authority for:

* User identity (via Session ID `sid`)
* Role permissions
* File access
* Audit records
* Realtime events

Clients are considered:

> untrusted input generators

---

## 3. Layer-by-Layer Architecture

---

## 3.1 Transport Layer

### (Routes & Controllers)

#### Routes

Routes are **pure mapping definitions**.

They may:

* Attach middleware
* Bind controller methods

They must never:

* Contain logic
* Query the database
* Transform data

Example (`src/routes/user.js`):

```js
router.patch(
  '/:id', 
  isAuthenticated, 
  // Authorization handled inside service or specific middleware
  userController.updateUser
);

```

---

#### Controllers

Controllers are **I/O adapters**.

Responsibilities:

* Extract request data
* Call service
* Format response
* Forward errors

Controllers must never:

* Call Sequelize directly
* Emit sockets
* Perform RBAC logic

Correct pattern (`src/controllers/authController.js`):

```js
export const completeRegistration = async (req, res) => {
  try {
    const { token, password, ...data } = req.body;
    
    // Logic delegated to Service
    const user = await authService.completeRegistration(token, { 
      password, 
      ...data 
    });

    req.login(user, (err) => {
      if (err) throw err;
      res.json({ message: 'Registration complete', user });
    });

  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ error: error.message });
  }
};

```

---

## 3.2 Business Logic Layer

### (Services)

Services are the **heart of the system**.

They:

* Enforce security invariants
* Control transactions
* Trigger side effects
* Maintain data integrity

A service function should be readable as:

> "This is what the system means when it does X."

---

### Example: Secure User Update

Logic from `src/services/userService.js`:

```js
async updateUser(requester, targetId, updates) {
    const targetUser = await User.findByPk(targetId);
    
    // Security: Prevent lower ranks from modifying higher ranks
    if (!isSelf && !canModifyUser(requester.roles, targetUser.roles)) {
       const error = new Error('Access Denied');
       error.status = 403;
       throw error;
    }

    // Security: Only Superadmin can change roles/status
    if (updates.roles && !isSuperAdmin) {
        throw new ForbiddenError('Cannot change roles');
    }

    return await targetUser.update(allowedUpdates);
}

```

No controller is allowed to bypass this.

---

## 3.3 Data Layer

### (Models)

Models define:

* Schema
* Relations
* Hooks
* Constraints

They must never:

* Know about HTTP
* Emit events
* Check permissions

---

### Critical Hooks

#### Redaction (`src/models/User.js`)

The system uses an aggressive allow-list approach to sanitization in `toJSON` to ensure sensitive data never leaks to the client.

```js
User.prototype.toJSON = function () {
  const values = { ...this.get() };

  // 1. Remove Sensitive Auth Data
  delete values.password;
  delete values.invitationToken;
  delete values.invitationExpiresAt;
  delete values.resetPasswordToken;
  delete values.resetPasswordExpires;

  // 2. Remove Internal DB Metadata
  delete values.deletedAt;

  return values;
};

```

---

## 4. Realtime System Architecture

Realtime is treated as a **first-class system bus**.

It is not UI sugar.

It is used for:

* Audit dashboards
* Admin monitoring
* Live collaboration
* Security visibility

---

## 4.1 Socket Lifecycle

```
HTTP login → Session established (Cookie 'sid') → 
Socket handshake → Socket inherits session → 
Authorized channel

```

Sockets without valid sessions are rejected.

---

## 4.2 Socket Contracts

All events must follow this naming scheme:

```
<resource>:<action>

```

Examples:

* `User:db_update`
* `File:db_create`

---

## 4.3 Socket Hooks Layer

Only this file is allowed to emit:

```
api/src/utils/socketHooks.js

```

This enforces:

* **Performance:** Only `PUBLIC_MODELS` (User, File, FileLink, Project) emit events to avoid flooding the bus with internal log data.
* **Centralized monitoring**
* **Zero duplication**

---

## 5. Audit & Activity System

The audit system is **non-optional** and **non-bypassable**.

Every sensitive action:

* Creates an `AuditLog` record
* Emits a socket event via `trackActivity` middleware or service calls.

---

### Audit Pipeline

```
Action → trackActivity →
Redaction → DB log →
emitAuditLog → Socket

```

---

### Redaction Rules

Before logging, the system recursively scrubs sensitive keys:

* `password`
* `token`
* `secret`
* `otp`
* `resetCode`

---

## 6. Security Architecture

---

## 6.1 Authentication Model

The system uses **stateful authentication**.

| Component | Purpose |
| --- | --- |
| Passport | Identity verification |
| Session store | Persistent login via `connect-session-sequelize` |
| Cookies | Transport only (`httpOnly`, `secure` in prod) |

There is:

* No JWT
* No token auth
* No client trust

---

## 6.2 Role-Based Access Control

RBAC is **hierarchical**.

Example:

```
superadmin > admin > curator > staff > guest

```

Higher roles inherit all lower privileges.

---

### Enforcement Rule

RBAC is checked:

* In middleware (`authorize`): Broad access (e.g., "Can read Users?")
* In services: Rank-sensitive logic (e.g., "Can this Admin edit this Superadmin?")

Never in controllers.

---

## 6.3 Onboarding Guard

The system can only be initialized once.

```js
// src/services/authService.js
const count = await User.count({ paranoid: false });
if (count > 0) return false; // Onboarding not needed

```

This prevents:

* Re-initialization attacks
* Privilege resets
* System hijacking

---

## 7. File Security System

Uploads are the highest-risk attack vector.

This system uses **three layers of defense**:

---

### 7.1 Extension check

Reject invalid extensions (e.g., `.exe`, `.php`).

### 7.2 MIME check

Verify declared type matching allowed list.

### 7.3 Signature check

Read file headers (magic bytes) using `file-type` to ensure the content matches the extension.

Only if all three pass is the file accepted.

---

## 8. Failure Handling & Observability

---

## 8.1 Global Error Handler

All errors flow through:

```
src/middleware/errorHandler.js

```

It:

* Normalizes error shape
* Hides internal stack traces in production
* Logs full stack server-side

---

## 8.2 Error Taxonomy

| Type | Example |
| --- | --- |
| ValidationError | Bad input (Yup failure) |
| ForbiddenError | RBAC / Hierarchy violation |
| NotFoundError | Missing entity |
| ConflictError | Unique key (e.g., Email exists) |
| SystemError | DB crash |

---

## 9. Operational Guidelines

---

### 9.1 Deployment Safety

Before production:

* `NODE_ENV=production`
* HTTPS only (Cookies require `secure: true`)
* Session store persistent
* Audit logging enabled

---

### 9.2 Data Integrity Rules

Never:

* Delete without paranoid (soft delete)
* Update without service
* Log without redaction
* Emit without `socketHooks`

---

## 10. Mental Model for Contributors

When modifying the system, always ask:

1. Does this violate layer boundaries?
2. Can this bypass RBAC?
3. Can this emit sensitive data?
4. Is this auditable?
5. Can this be abused if client is malicious?

If any answer is **yes**, the design is wrong.

---

## Final Principle (The One That Matters)

> **If a controller can do it, an attacker can fake it.**
> **If a service does it, the system owns it.**

Everything important must live in services.

```

```