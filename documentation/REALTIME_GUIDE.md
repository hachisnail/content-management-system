# Real-Time Service Documentation

This guide explains the architecture and usage of the **Real-Time Service**. The system uses a **Centralized Store Architecture** to ensure data consistency, efficiency, and to prevent race conditions.

*   **REST APIs** for data fetching.
*   **Socket.IO Rooms** for live updates.
*   **Database Hooks** for automatic event emission.
*   **A Centralized `zustand` Store** on the client to act as a single source of truth.

---

## 1. Client-Side Architecture

The client no longer uses independent hooks that fetch and manage their own state. Instead, all real-time logic is handled by a central store, powered by `zustand`.

### Core Concepts

1.  **Singleton Stores**: For each resource type (e.g., 'users', 'donations'), a single `zustand` store is created. This store is responsible for fetching all data and listening to all socket events for that resource.
2.  **Centralized Listeners**: The store is the only part of the app that contains `socket.on()` listeners. This completely eliminates race conditions and bugs from multiple components trying to handle the same event.
3.  **Query Caching**: The store can handle multiple types of requests. It maintains separate caches for list-based queries (e.g., from a table with filters) and single-record fetches (e.g., for a profile page).
4.  **Component Hooks**: React components use one of two simple hooks to connect to the store and retrieve data. These hooks do not fetch data themselves; they only select it from the central store.

### Core Files

| File                                       | Purpose                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| `client/src/stores/createRealtimeStore.js` | A factory that creates the `zustand` store for a given resource.          |
| `client/src/hooks/useRealtimeResource.jsx` | The main hook components use to get real-time data from the store.        |
| `client/src/hooks/useRealtimeRecord.js`  | A specialized hook for fetching and subscribing to a single record by its ID. |

---

### A. Fetching Lists: `useRealtimeResource`

This hook is used for fetching collections of data, such as for tables and lists. It supports server-side pagination, filtering, and sorting via `queryParams`.

**Usage Example:**

```javascript
import { useRealtimeResource } from '../hooks/useRealtimeResource';

function UserDirectory() {
  const { queryParams } = useTableControls(); // Gets page, limit, sort, etc.

  // 1. Call the hook with the resource and query params.
  // The hook gets the data from the central 'users' store.
  // If this specific query isn't cached, the store fetches it from /api/users.
  const { data: users, meta, loading } = useRealtimeResource('users', { queryParams });

  // 2. When any user is updated, the central store receives the event
  // and automatically refetches this query to keep the data consistent.

  return <DataTable data={users} isLoading={loading} ... />;
}
```

---

### B. Fetching a Single Record: `useRealtimeRecord`

This hook is a highly efficient way to get and subscribe to a single record.

**Usage Example:**

```javascript
import { useRealtimeRecord } from '../hooks/useRealtimeRecord';

function UserProfile({ userId }) {
  // 1. Call the hook with the resource and the record's ID.
  // It fetches from /api/users/:id and subscribes to the 'users_123' room.
  const { data: user, loading } = useRealtimeRecord('users', userId);

  // 2. When an update for this specific user is emitted, this hook's
  // data is updated directly without a refetch, making it instantaneous.
  
  if (loading) return 'Loading...';
  
  return <h1>{user.name}</h1>;
}
```

---

## 2. Server-Side Implementation

The server is responsible for emitting events to the correct rooms. To support the new dual-hook system on the client, the server now emits to **two rooms** for every update/delete.

1.  **Generic Room** (`users`): For list views, so they know to refetch.
2.  **Specific Room** (`users_123`): For single-record views, so they can update instantly.

### Emission Logic (`server/src/models/hooks.js`)

The `notifyMutableResource` hook was updated to handle this dual emission.

```javascript
export const notifyMutableResource = (resourceName, eagerLoad = null) => async (instance, options) => {
  const recordRoom = `${resourceName}_${instance.id}`;
  const eventName = instance.isNewRecord ? `${resourceName}_created` : `${resourceName}_updated`;

  // ...
  
  // 1. Emit to generic room for lists
  safeEmit(resourceName, eventName, payload);
  
  // 2. If it's an update, also emit to the specific record room
  if (!instance.isNewRecord) {
    safeEmit(recordRoom, eventName, payload);
  }
};
```

This ensures that both `useRealtimeResource` (which joins the `users` room) and `useRealtimeRecord` (which joins the `users_123` room) receive the updates they need.

---

## 3. How to Add Real-Time to a Model

The process is the same as before. Open `server/src/models/index.js` and attach the appropriate hook factory. The factories now contain all the logic for dual-emission.

### Mutable Data (Users, Products, etc.)

Use `notifyMutableResource`. This handles create, update, and delete events and emits to both room types.

```javascript
import { notifyMutableResource } from './hooks.js';
db.User.afterSave(notifyMutableResource('users'));
db.User.afterDestroy(notifyDeletedResource('users')); // Ensure delete is also handled
```

### Append-Only Data (Logs, etc.)

Use `notifyNewResource`. This only emits a `_created` event to the generic room.

```javascript
import { notifyNewResource } from './hooks.js';
db.AuditLog.afterCreate(notifyNewResource('audit_logs'));
```
---

## Summary

*   **Centralized Client Store (`zustand`)**: Eliminates race conditions and ensures a single source of truth.
*   **Dual-Hook System**: Use `useRealtimeResource` for lists and `useRealtimeRecord` for single items.
*   **Dual-Emission on Server**: The server emits events to both generic and specific rooms to support both hooks.
*   **Efficient Updates**: Single-record views are updated instantly without refetching. List views are reliably kept in sync by refetching.

This architecture is scalable, efficient, and robust.
