# MASCD-MIS Client-Side Documentation

Welcome to the client-side documentation for the **MASCD-MIS** application. This guide is designed to give every developer—from newcomers to seasoned contributors—a thorough understanding of our frontend architecture, core patterns, and development practices.

---

## 1. Introduction: What Is the Client Application?

The client is a **Single Page Application (SPA)** built with **React** and bundled using **Vite**. It provides the user interface for the entire MASCD-MIS system.

### Key Features

* **Modern UI/UX**: A responsive and intuitive user interface built with reusable React components and Tailwind CSS.
* **Real-time Data**: Uses WebSockets via **Socket.IO** to receive and display live data updates from the server, keeping the UI in sync.
* **Role-Based Access Control (RBAC)**: Dynamically renders UI elements and restricts access to pages based on the logged-in user’s permissions.
* **Client-Side Routing**: Powered by `react-router-dom` for fast, seamless navigation without full page reloads.

---

## 2. Getting Started: Setting Up Your Development Environment

Follow these steps to get the client running locally.

### Prerequisites

* **Node.js**: Version **18 or higher** is recommended.
* **Running server instance**: The client must connect to the backend API. Ensure the server is running locally.

### Installation Steps

1. **Navigate to the client directory**

   ```bash
   cd client
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the development server**

   Starts the Vite development server with hot module reloading.

   ```bash
   npm run dev
   ```

The application will typically be available at:

```
http://localhost:5173
```

---

## 3. Project Structure: A Tour of `/src`

The `client/src` directory contains the core of the application.

```
client/src
├── api.js                 # Axios instance for HTTP requests
├── main.jsx               # React application entry point
├── router.jsx             # Application routes
├── socket.js              # Socket.IO client configuration
│
├── assets/                # Static assets (images, SVGs)
├── components/            # Reusable UI components (DataTable, Modal, etc.)
├── context/               # React Context providers (Auth, Config)
├── hooks/                 # Custom reusable hooks
├── layouts/               # Layout components (MainLayout, AuthLayout)
├── pages/                 # Page-level components
├── stores/                # Zustand stores for real-time state
└── utils/                 # Utility/helper functions
```

---

## 4. Core Architecture & State Management

State management is layered for clarity, performance, and scalability.

### React Context

Used for **global, slowly changing state**.

* **AuthContext**

  * Provides authentication state: `user`, `isAuthenticated`.
  * Uses **optimistic loading** by initializing from `localStorage` and validating the session in the background.

* **ConfigContext**

  * Provides application-wide configuration.
  * Exposes the master `PERMISSIONS` list and role definitions.

### Zustand (`createRealtimeStore`)

Used for **dynamic, real-time server data** such as users, donations, and audit logs.

* Centralized caching
* Socket event handling
* Polling fallbacks
* Ensures UI consistency across refreshes and reconnects

---

## 5. Key Hooks: Your Toolkit for Building Features

Custom hooks encapsulate complex logic and keep components declarative and readable.

### `useAuth()` — Authentication Access

The primary hook for authentication state and actions.

**Usage**

```jsx
const { user, isAuthenticated, login, logout } = useAuth();
```

**Returns**

* `user`: Authenticated user object or `null`
* `isAuthenticated`: Boolean flag
* `loading`: Always `false` (optimistic loading strategy)

---

### `useConfig()` — Permission & RBAC Utilities

Provides helpers for role-based access control.

**Usage**

```jsx
const { PERMISSIONS, hasPermission } = useConfig();
```

**Returns**

* `PERMISSIONS`: Map of permission keys to values (e.g. `MANAGE_USERS: 'manage:users'`)
* `hasPermission(user, permission)`: Checks if a user has a specific permission

**Example: Conditionally rendering an admin-only action**

```jsx
const { user } = useAuth();
const { hasPermission, PERMISSIONS } = useConfig();

if (hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
  return <Button>Delete User</Button>;
}
```

---

### `useTableControls(options)` — Table UI State

Manages table-related UI state such as pagination, sorting, and searching.

**Usage**

```jsx
const {
  queryParams,
  setPage,
  setSearch,
  handleSortChange
} = useTableControls({ defaultLimit: 10 });
```

**Returns**

* `queryParams`: Memoized state object (`page`, `limit`, `sortBy`, `sortDir`, `search`)
* `handleSortChange(key, direction)`: Sorting handler for `DataTable`

Designed to plug directly into `useRealtimeResource`.

---

### `useRealtimeResource(resourceName, options)` — Universal Data Hook

A **single, unified hook** for all data fetching and real-time updates.

It automatically selects its behavior based on the provided options.

#### Mode A: List Fetching (Table Views)

Used when `queryParams` is provided and `id` is omitted.

**Usage**

```jsx
const { data, meta, loading } = useRealtimeResource('users', { queryParams });
```

**Returns**

* `data`: Array of records for the current page
* `meta`: Pagination metadata (e.g. `totalItems`)

---

#### Mode B: Single Record Fetching (Detail Views)

Activated when an `id` is provided.

**Usage**

```jsx
const { data, loading } = useRealtimeResource('users', { id: userId });
```

**Returns**

* `data`: The requested record or `null`

This mode subscribes only to socket updates for the specific entity.

---

## 6. Putting It All Together: Practical Example

Below is a complete example of a **paginated, real-time audit log page**.

```jsx
import React, { useMemo } from 'react';
import { useRealtimeResource } from '../../hooks/useRealtimeResource';
import { useTableControls } from '../../hooks/useTableControls';
import { DataTable, Alert } from '../../components/UI';
import { formatDistanceToNow } from 'date-fns';

function AuditLogPage() {
  // 1. Table controls
  const {
    queryParams,
    setPage,
    setSearch,
    handleSortChange
  } = useTableControls({
    initialSort: { key: 'createdAt', direction: 'desc' }
  });

  // 2. Real-time data fetching
  const { data, meta, loading, error } = useRealtimeResource('audit_logs', {
    queryParams
  });

  // 3. Column definitions
  const columns = useMemo(() => [
    { header: 'Description', accessor: 'description' },
    {
      header: 'Initiator',
      accessor: 'initiator',
      render: (row) => row.Initiator?.username || 'System'
    },
    { header: 'Operation', accessor: 'operation', sortable: true },
    {
      header: 'Timestamp',
      accessor: 'createdAt',
      sortable: true,
      render: (row) => `${formatDistanceToNow(new Date(row.createdAt))} ago`
    }
  ], []);

  if (error) {
    return <Alert type="error" title="Sync Error" message={error} />;
  }

  // 4. Render
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Audit Logs</h1>

      <DataTable
        columns={columns}
        data={data || []}
        isLoading={loading}
        onSearch={setSearch}
        onSort={handleSortChange}
        searchPlaceholder="Filter logs..."
        serverSidePagination={{
          totalItems: meta?.totalItems || 0,
          currentPage: queryParams.page,
          itemsPerPage: queryParams.limit,
          onPageChange: setPage
        }}
      />
    </div>
  );
}

export default AuditLogPage;
```

---

## 7. Summary

* **React + Vite** power a fast, modern SPA
* **Context** handles global app state
* **Zustand** manages real-time, server-driven data
* **Custom hooks** standardize data access and UI behavior
* **RBAC** is enforced consistently across the UI

This architecture ensures scalability, maintainability, and real-time correctness across the MASCD-MIS client application.
