# Museo Bulawan Management System
## Architecture & Implementation Guide

This document is the **authoritative technical reference** for the Museo Bulawan Management System. It describes not only **what** each part of the system does, but **why** it exists, **how** it interacts with other layers, and the **constraints developers must respect** when extending the platform.

This guide is intended for:

- Backend developers
- Security auditors
- DevOps & deployment engineers
- Future maintainers of the system

---

## 1. Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Runtime | **Node.js (ESM)** | Native async I/O, strong ecosystem, modern `import / export` syntax. |
| Framework | **Express.js v5.2.1** | Minimal, predictable middleware model with modern error handling. |
| Database | **MariaDB (mysql2) + Sequelize** | Strong relational guarantees with ORM safety and efficient driver. |
| Auth | **Passport.js (Local + Sessions)** | Secure server-side sessions using `connect-session-sequelize`. |
| Validation | **Yup** & **Specification Pattern** | Single source of truth for data contracts and file rules. |
| Realtime | **Socket.io** | Bi-directional channels for live updates, managed via Core Socket Manager. |
| Presence | **LRU-Cache (MemoryAdapter)** | Tracks online users; Architecture allows swapping for Redis. |
| Files | **Multer + File-Type** | Magic-byte validation to prevent MIME spoofing. |
| Infrastructure | **Factory Pattern** | Storage and Presence use factories for environment-agnostic injection. |
| Logging | **Winston** | Centralized structured logging with Database transports. |
| Testing | **Jest** | Unit and integration testing. |
| Docs | **Swagger / OpenAPI** | Live API documentation. |

---

## 2. System Design Philosophy

The system is built around **non-negotiable principles**.

### 2.1 Deterministic Flow

Every request follows exactly one path:

```
Client → Route → Middleware → Controller → Service → (Core/Model) → DB
```

No business logic is allowed in:

- Routes
- Middleware
- Models

### 2.2 Core Infrastructure Separation

Technical capabilities ("Plumbing") are strictly separated from Business Logic.

- **Services** (`src/services/`) contain business rules (e.g., "User cannot delete their own account").
- **Core** (`src/core/`) contains technical implementations (e.g., "How to write a file to disk" or "How to emit a socket event").

Services **depend on** Core. Core **never** depends on Services.

### 2.3 Server-Authoritative State

The server is always authoritative for:

- User identity (`sid` session cookie)
- Role permissions
- File access
- Audit records
- Realtime events

---

## 3. Layer-by-Layer Architecture

### 3.1 Transport Layer (Routes & Controllers)

- **Routes** (`src/routes/`) map URLs to controllers and attach middleware.
- **Controllers** (`src/controllers/`) adapt HTTP to services.

They catch errors and pass them to the global error handler via `next(error)`.

### 3.2 Business Logic Layer (Services)

Services are the **heart of the system**. They are flatly organized in `src/services/`.

Key Services:

- **`virtualFileService.js`**: Manages the directory tree structure and folder logic.
- **`fileRetrievalService.js`**: Handles streaming, metadata reading, and access control for downloads.
- **`recycleBinService.js`**: Handles soft-deletion, restoration, and snapshotting of relationships.

#### Recycle Bin Snapshot Architecture
1. **Deletion**: Captures a **JSON snapshot** of critical relations (e.g., FileLinks) before soft-deletion.
2. **Swap Logic**: If restoring a file into a "Single Instance" slot (like an Avatar), the system automatically moves the *current* occupant to the bin before restoring the old one.

### 3.3 Data Layer (Models)

Models (`src/models/`) define Schema, Relations, and Serialization rules.
All models override `toJSON` to redact sensitive fields (`password`, `tokens`) automatically.

### 3.4 Core Infrastructure Layer

Located in `src/core/`, this layer handles low-level operations.

| Component | Path | Responsibility |
|-----------|------|----------------|
| **Storage** | `core/storage/` | Uses **Factory Pattern**. Exports a singleton `storage` adapter (Local/S3) based on config. |
| **Events** | `core/events/` | Singleton `EventBus` for decoupling DB hooks from Sockets. |
| **Socket** | `core/socket/` | `SocketManager` handles connection lifecycles and room joins. |
| **Logging** | `core/logging/` | Configures Winston and custom Transports (e.g., AuditLog DB write). |
| **Scheduler** | `core/scheduler/` | Manages Cron jobs (Session cleanup). |
| **Errors** | `core/errors/` | Defines `AppError` for standardized HTTP operational errors. |

---

## 4. File System Architecture

The file system is split into **Physical Storage** and **Virtual Organization**.

### 4.1 Physical Storage (Core)
Handled by `LocalAdapter` (or future S3Adapter). Files are stored on disk (or cloud) physically. The Service layer does not know *where* files are, it just calls `storage.upload()` or `storage.getStream()`.

### 4.2 Virtual Organization (Services)
- **`FileService`**: Handles the upload transaction, `FileSpecification` validation, and database record creation.
- **`VirtualFileService`**: Constructs a virtual folder tree based on `FileLink` relationships (`User` -> `Avatar`, etc.).

### 4.3 Validation (Specification Pattern)
Validation logic is encapsulated in `src/specifications/FileSpecification.js`. It enforces:
- Max file size
- Allowed MIME types
- Context-specific rules (e.g., "Avatars must be images")

---

## 5. Error Handling

The system uses a unified error handling strategy.

### 5.1 AppError
Developers must use the `AppError` class for operational errors:

```javascript
import { AppError } from '../core/errors/AppError.js';
if (!user) throw new AppError('User not found', 404);
```

### 5.2 Global Handler

The middleware (`src/middleware/errorHandler.js`) standardizes responses:

```json
{
  "error": true,
  "message": "User not found",
  "details": { ... } // Optional validation details
}
```

---

## 6. Realtime & Presence

* **Presence**: Managed by `src/core/presence/`. Uses an Adapter pattern (Memory/Redis) to track online user IDs.
* **Broadcasting**: Database hooks emit events to `EventBus`, which `SocketManager` listens to. This decouples the Database from the WebSocket server.

---

## 7. Security Architecture

### 7.1 Authentication

* **Stateful sessions** via `connect-session-sequelize`.
* **Hard invalidation**: Changing password kills all active sessions.

### 7.2 RBAC (Role-Based Access Control)

* **Middleware**: Broad access checks (e.g., `authorize('readAny', 'files')`).
* **Services**: Contextual checks (e.g., "Can user X edit file Y?").

### 7.3 File Security

Uploads pass a three-layer check:

1. Extension allow-list
2. MIME type verification
3. Magic-byte inspection (`file-type`)

---

## 8. Testing Strategy

The project uses **Jest**. Tests mirror the `src/` structure.

* **Services**: Mock `Core` dependencies (Storage, Socket) and Models.
* **Controllers**: Mock Services.

Run tests with:

```bash
npm test
```

---

## 9. API Documentation

Swagger (OpenAPI 3.0) is auto-generated.

| Item | Location |
|------|----------|
| Definition | `src/config/swagger.js` |
| Annotations | `src/routes/*.js` |
| UI | `/api/docs` |

---

## 10. Operational Guidelines

### Production Checklist

* `NODE_ENV=production`
* `STORAGE_DRIVER` configured (local/s3)
* `PRESENCE_ADAPTER` configured (memory/redis)
* HTTPS enabled (`secure` cookies)

### Final Rule

> **If a controller can do it, an attacker can fake it.**  
> **If a service does it, the system owns it.**

Everything that matters belongs in **services**.`