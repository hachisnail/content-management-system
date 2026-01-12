# MASCD-MIS System Handbook

## 1. Introduction & High-Level Overview

Welcome to the **MASCD-MIS Content Management System**. This application is a full-stack web platform designed to manage users, donations, and system logs in real time.

Unlike traditional websites that require manual refreshes, MASCD-MIS is **event-driven**. When one user updates a record, all other connected users see the change instantly.

### Technology Stack

MASCD-MIS uses a modern, production-ready JavaScript stack:

* **Frontend (Client):** React (Vite) — user interface and presentation layer
* **Backend (Server):** Node.js + Express — business logic, APIs, and security
* **Database:** MariaDB (SQL) with Sequelize ORM
* **Real-Time Engine:** Socket.IO — bidirectional, event-based communication

---

## 2. Authentication & Security

The system enforces both **authentication** (who you are) and **authorization** (what you can do).

### 2.1 Session-Based Authentication

MASCD-MIS uses **session cookies**, not JWTs, for browser-based security.

#### Login Flow

1. User submits credentials
2. Server authenticates using **Passport.js (Local Strategy)**
3. A session record is created in the `sessions` table
4. Session ID is returned to the browser as an HTTP-only cookie

#### Cookie Behavior

* Automatically attached to every request
* **Required client config:**

```js
axios.create({ withCredentials: true });
```

#### Session Lifetime

* Sessions expire after **24 hours of inactivity**

---

### 2.2 Role-Based Access Control (RBAC)

Users are assigned **roles**, and roles define **permissions**.

#### Permission Enforcement

* **Shared definition:** `server/src/config/permissions.js`
* **Frontend:** UI elements are conditionally rendered
* **Backend:** Middleware blocks unauthorized requests

#### Frontend Example

```jsx
if (!hasPermission(user, PERMISSIONS.MANAGE_USERS)) return null;
```

#### Backend Example

```js
router.delete('/:id', hasPermission('manage:users'), controller.delete);
```

---

## 3. Real-Time Data Engine

MASCD-MIS uses a **centralized real-time store architecture**.

### 3.1 Zustand Live Stores

Each resource (users, logs, donations) has a dedicated store that:

1. Fetches initial data via REST
2. Subscribes to Socket.IO events
3. Applies updates automatically

#### Update Strategy

* **Update:** Patch the item in memory
* **Create/Delete:** Re-fetch active queries for consistency

---

### 3.2 Connectivity & Offline Handling

The client adapts to network conditions automatically:

* **Connected:** Live socket updates
* **Disconnected:** Polling every 10 seconds
* **Reconnected:** Resume real-time subscriptions

---

## 4. Frontend Developer Guide

Frontend developers never write raw fetch logic. Data access is abstracted into hooks.

### 4.1 List Views — `useRealtimeResource`

```jsx
import { useRealtimeResource } from '../hooks/useRealtimeResource';
import { useTableControls } from '../hooks/useTableControls';

function UserTable() {
  const { queryParams, setPage, setSearch } = useTableControls();

  const { data, meta, loading } = useRealtimeResource('users', { queryParams });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <input onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
      <table>
        {data.map(user => (
          <tr key={user.id}>
            <td>{user.name}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}
```

---

### 4.2 Detail Views — `useRealtimeRecord`

```jsx
import { useRealtimeRecord } from '../hooks/useRealtimeRecord';

function UserProfile({ userId }) {
  const { data: user, loading } = useRealtimeRecord('users', userId);

  if (loading) return <div>Loading...</div>;

  return <h1>Hello, {user?.firstName}</h1>;
}
```

---

## 5. Backend Developer Guide

The server follows a strict layered architecture.

### 5.1 Request Flow

1. **Routes:** Define endpoints and permissions
2. **Controllers:** Validate inputs and shape responses
3. **Services:** Business logic and rules
4. **Models:** Sequelize schema definitions

---

### 5.2 Automated Real-Time Events

Real-time events are emitted automatically using Sequelize hooks.

```js
import { notifyMutableResource } from './hooks.js';

db.User.afterSave(notifyMutableResource('users'));
db.User.afterDestroy(notifyMutableResource('users'));
```

#### Emitted Events

* `users_updated` → refresh list views
* `users_{id}_updated` → update detail views

---

### 5.3 Standardized Query Builder

The backend translates query parameters into Sequelize options.

```js
export const findAll = async (queryParams) => {
  const searchableFields = ['firstName', 'lastName', 'email'];
  const options = buildQueryOptions(queryParams, searchableFields);
  return await db.User.findAndCountAll(options);
};
```

---

## 6. Directory Structure Cheat Sheet

### Client

* `client/src/context` — global state (Auth, Config)
* `client/src/stores` — real-time Zustand stores
* `client/src/hooks` — reusable logic

### Server

* `server/src/config` — environment, permissions, CORS
* `server/src/models/hooks.js` — socket emission logic
* `server/src/utils/queryBuilder.js` — pagination & filtering

---

## 7. Summary

* Event-driven, real-time architecture
* Centralized state management
* Secure session-based authentication
* Strict RBAC enforcement
* Scalable frontend and backend patterns

