# Real-Time Service Documentation

This guide explains the architecture and usage of the **Real-Time Service**. The system uses a **Secure Hybrid Architecture**:

* **REST APIs** for initial data loading (Snapshot)
* **Socket.IO Rooms** for live updates (Append / Modify)
* **Database Hooks** for automatic event emission
* **Access Control Lists (ACL)** for security

---

## 1. Client-Side Implementation

### Dependencies

* `socket.io-client`
* `axios` (used by the hook for initial snapshots)

---

### The `useRealtimeResource` Hook

The custom hook `useRealtimeResource` manages the entire lifecycle of real-time data:

* **Fetch** – Loads the initial snapshot via REST
* **Subscribe** – Emits `subscribe_resource` to join a secure room
* **Listen** – Updates local state on `_created`, `_updated`, `_deleted` events
* **Cleanup** – Automatically unsubscribes when the component unmounts

**Location:**

```
client/src/hooks/useRealtimeResource.jsx
```

---

### Usage Example

```javascript
import useRealtimeResource from '../hooks/useRealtimeResource';

function UserList() {
  // 1. Call the hook with the resource name
  // This automatically:
  //    - GET /api/users
  //    - socket.emit('subscribe_resource', 'users')
  const { data: users = [], loading, error } = useRealtimeResource('users');

  // 2. Client-Side Sorting (CRITICAL)
  // The hook appends new items to the list.
  // You MUST sort before rendering to ensure correct order.
  const sortedUsers = [...users].sort((a, b) => b.id - a.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <ul>
      {sortedUsers.map((user) => (
        <li key={user.id}>
          {user.name} {user.isOnline ? '🟢' : '⚫'}
        </li>
      ))}
    </ul>
  );
}
```

---

### Hook Return Values

| Property  | Type             | Description                                |
| --------- | ---------------- | ------------------------------------------ |
| `data`    | `Array`          | Live list of items                         |
| `loading` | `Boolean`        | `true` while fetching the initial snapshot |
| `error`   | `String \| null` | Error message if fetch fails               |

---

## 2. Server-Side Implementation

### Architecture Overview

We **do not** manually emit socket events in controllers for standard CRUD operations.

Instead, we use a **Centralized Hook Strategy**:

1. **Database Change** – A record is created or updated via API, Admin Panel, or Job
2. **Hook Trigger** – A Sequelize hook detects the change
3. **Room Emission** – The hook emits the event only to the specific resource room

Example:

```js
io.to('audit_logs').emit('audit_logs_created', payload)
```

---

### Core Files

| File                         | Purpose                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `server/src/socket.js`       | Security layer: authentication and `subscribe_resource` ACL checks |
| `server/src/models/hooks.js` | Smart factories that emit events to specific rooms                 |
| `server/src/models/index.js` | Registry that attaches hooks to Sequelize models                   |

---

## 3. Security & Access Control (ACL)

Unlike standard Socket.IO implementations, users **do not receive events by default**.

They must explicitly request access to a resource.

---

### Subscription Handshake Flow

1. Client emits `subscribe_resource` with a resource name (e.g., `audit_logs`)
2. Server checks `socket.user.role` against the Allow List
3. If allowed → `socket.join('audit_logs')`
4. If denied → Server emits an error log and refuses the subscription

---

### Permission Table (configured in `socket.js`)

| Resource     | Access Level                    |
| ------------ | ------------------------------- |
| `donations`  | Public (Guests + Users)         |
| `inventory`  | Authenticated Users             |
| `users`      | Admin Only (Admin, Super Admin) |
| `audit_logs` | Admin Only (Admin, Super Admin) |

---

## 4. How to Add Real-Time to a Model

To enable real-time updates for a table, open:

```
server/src/models/index.js
```

Attach the appropriate factory.

---

### Case A: Append-Only Data

**Examples:** Audit Logs, Donations

* **Behavior:** Emits `<name>_created`
* **Hook:** `afterCreate`

```javascript
import { notifyNewResource } from './hooks.js';

// The string 'donations' MUST match useRealtimeResource('donations')
db.Donation.afterCreate(notifyNewResource('donations'));
```

---

### Case B: Mutable Data

**Examples:** Users

* **Behavior:** Emits `<name>_updated` (create + update) and `<name>_deleted`
* **Hook:** `afterSave`

```javascript
import { notifyMutableResource } from './hooks.js';

db.User.afterSave(notifyMutableResource('users'));
```

---

## 5. Event Naming Convention

The system relies on **strict naming conventions**.

If your resource string is **`users`**, the following events are expected:

| Event Name      | Triggered By   | Payload            | Client Action      |
| --------------- | -------------- | ------------------ | ------------------ |
| `users_created` | `afterCreate`  | Full JSON object   | Append to list     |
| `users_updated` | `afterSave`    | Full JSON object   | Replace item by ID |
| `users_deleted` | `afterDestroy` | `{ id }` or Object | Remove item by ID  |

---

## 6. Troubleshooting

### "I'm not receiving updates"

* **Check Subscription** – Look at the server console for:

  ```
  [Socket] Unauthorized subscription attempt
  ```

  This indicates insufficient role permissions.

* **Check Room Name** – The string passed to `useRealtimeResource('X')` **must match** `notifyNewResource('X')`.

* **Check Model Hook** – Ensure the hook is attached in:

  ```
  server/src/models/index.js
  ```

---

### "Logs appear out of order"

✔ Always sort in the React component:

```js
[...data].sort(...)
```

The hook appends items; ordering is the client’s responsibility.

---

### "Circular structure JSON error"

✔ The smart factories in `hooks.js` automatically call `.toJSON()`.

If you emit custom events, **always serialize Sequelize instances first**.

---

## Summary

* Secure, room-based real-time delivery
* Explicit client subscriptions
* Centralized Sequelize hooks
* Zero controller-side socket logic
* Strong ACL boundaries

This architecture is scalable, secure, and production-grade.
