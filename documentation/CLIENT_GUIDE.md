```markdown
# MASCD-MIS Client-Side Documentation

Welcome to the client-side documentation for the MASCD-MIS application. This guide is designed to give every developer, from newcomers to seasoned contributors, a thorough understanding of our frontend architecture, core patterns, and development practices.

## 1. Introduction: What is the Client Application?

The client is a **Single Page Application (SPA)** built with **React** and bundled with **Vite**. It provides the user interface for the entire MASCD-MIS system.

### Key Features:

* **Modern UI/UX**: A responsive and intuitive user interface built with reusable React components and Tailwind CSS.
* **Real-time Data**: Leverages WebSockets (via `Socket.IO`) to receive and display live data updates from the server, ensuring the UI is always in sync.
* **Role-Based Access Control (RBAC)**: Dynamically renders UI elements and controls access to pages based on the logged-in user's permissions.
* **Client-Side Routing**: Uses `react-router-dom` to provide fast, seamless navigation between different views without full page reloads.

## 2. Getting Started: Setting Up Your Development Environment

Follow these steps to get the client running on your local machine.

### Prerequisites

* **Node.js**: You'll need Node.js installed, preferably version 18 or higher.
* **A running server instance**: The client application needs to connect to the server's API. Make sure you have the server running locally.

### Installation Steps

1.  **Navigate to the Client Directory**:
    ```bash
    cd client
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Development Server**:
    This command starts the Vite development server. It will open the application in your default web browser and automatically hot-reload whenever you make code changes.
    ```bash
    npm run dev
    ```

You should now see the application running, typically at `http://localhost:5173`.

## 3. Project Structure: A Tour of `/src`

The `client/src` directory contains the heart of our application.


```

/client/src
├── api.js                 # Axios instance for making HTTP requests to the server.
├── main.jsx               # The main entry point of the React application.
├── router.jsx             # Defines all the application's routes and page components.
├── socket.js              # Configures the Socket.IO client for real-time communication.
|
├── assets/                # Static assets like images and SVGs.
├── components/            # Reusable UI components (DataTable, Modal, etc.).
├── context/               # React Context providers for global state (Auth, Config).
├── hooks/                 # Custom React hooks containing reusable logic.
├── layouts/               # High-level layout components (MainLayout, AuthLayout).
├── pages/                 # Top-level components representing specific pages.
├── stores/                # Zustand stores for centralized, real-time data management.
└── utils/                 # Utility functions (time formatting, ID encoding).

```

## 4. Core Architecture & State Management

Our state management strategy is layered to be both efficient and easy to manage.

* **React Context**: Used for global, slowly-changing state.
    * `AuthContext`: Provides the current user's authentication status (`user`, `isAuthenticated`). It uses an "optimistic" loading strategy, initializing immediately from `localStorage` while verifying the session in the background.
    * `ConfigContext`: Provides application-wide configuration, including the master `PERMISSIONS` list and role definitions.

* **Zustand (via `createRealtimeStore`)**: Used for managing dynamic, real-time data from the server (users, donations, logs). This centralized store handles caching, polling fallbacks, and socket events to ensure data consistency.

## 5. Key Hooks: Your Toolkit for Building Features

Custom hooks are the primary way we build features. They encapsulate complex logic, making our components clean and declarative.

### `useAuth()` - Accessing the Current User

This is the hook for all things authentication.

* **Usage**: `const { user, isAuthenticated, login, logout } = useAuth();`
* **Returns**:
    * `user`: The authenticated user object. `null` if not logged in.
    * `isAuthenticated`: Boolean flag.
    * `loading`: **Always false** (due to optimistic loading). The app assumes the local storage data is correct until the background sync proves otherwise.

### `useConfig()` - Checking Permissions

This hook provides tools for our Role-Based Access Control (RBAC) system.

* **Usage**: `const { PERMISSIONS, hasPermission } = useConfig();`
* **Returns**:
    * `PERMISSIONS`: An object mapping permission names to string values (e.g., `MANAGE_USERS: 'manage:users'`).
    * `hasPermission(user, permission)`: A helper function to check if a user object has a specific permission.

**Example: Conditionally rendering an "Admin" button**

```jsx
const { user } = useAuth();
const { hasPermission, PERMISSIONS } = useConfig();

if (hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
  return <Button>Delete User</Button>;
}

```

### `useTableControls(options)` - Managing UI State for Tables

Data tables often have complex UI state: pagination, sorting, search queries, etc. This hook manages all of it.

* **Usage**: `const { queryParams, setPage, setSearch, handleSortChange } = useTableControls({ defaultLimit: 10 });`
* **Returns**:
* `queryParams`: A memoized object containing the current state (`page`, `limit`, `sortBy`, `sortDir`, `search`). This is designed to be passed directly to `useRealtimeResource`.
* `handleSortChange(key, direction)`: Pass this to the `DataTable`'s `onSort` prop.



### `useRealtimeResource(resourceName, options)` - Universal Data Hook

This is the **single, unified hook** for fetching data. It operates in two modes depending on whether you provide an `id`.

#### Mode A: Fetching a List (Table View)

When you provide `queryParams` but no `id`, it fetches a paginated list.

* **Usage**: `const { data, meta, loading } = useRealtimeResource('users', { queryParams });`
* **Returns**:
* `data`: Array of items for the current page.
* `meta`: Pagination metadata (`totalItems`).



#### Mode B: Fetching a Single Record (Detail View)

When you provide an `id`, it switches to "Single Entity" mode. It is highly optimized to subscribe only to updates for that specific record.

* **Usage**: `const { data, loading } = useRealtimeResource('users', { id: userId });`
* **Returns**:
* `data`: The single record object (or `null`).



## 6. Putting It All Together: A Practical Example

Let's build a paginated, real-time page to display audit logs.

```jsx
import React, { useMemo } from 'react';
import { useRealtimeResource } from '../../hooks/useRealtimeResource';
import { useTableControls } from '../../hooks/useTableControls';
import { DataTable, Alert } from '../../components/UI';
import { formatDistanceToNow } from 'date-fns';

function AuditLogPage() {
  // 1. Set up table controls (pagination, search, sorting)
  const { 
    queryParams,
    setPage, 
    setSearch, 
    handleSortChange 
  } = useTableControls({ 
    initialSort: { key: 'createdAt', direction: 'desc' }
  });

  // 2. Fetch the data using the unified hook
  //    The hook joins the 'audit_logs' socket room automatically.
  const { data, meta, loading, error } = useRealtimeResource('audit_logs', { 
    queryParams
  });

  // 3. Define columns. Note: Use 'render' for custom cell content.
  const columns = useMemo(() => [
    { header: 'Description', accessor: 'description' },
    { header: 'Initiator', accessor: 'initiator', render: (row) => row.Initiator?.username || 'System' },
    { header: 'Operation', accessor: 'operation', sortable: true },
    { 
      header: 'Timestamp', 
      accessor: 'createdAt',
      sortable: true,
      render: (row) => `${formatDistanceToNow(new Date(row.createdAt))} ago`
    },
  ], []);

  if (error) return <Alert type="error" title="Sync Error" message={error} />;

  // 4. Render the DataTable
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Audit Logs</h1>
      
      <DataTable 
        columns={columns} 
        data={data || []} 
        isLoading={loading}
        
        // Connect controls
        onSearch={setSearch}
        onSort={handleSortChange}
        searchPlaceholder="Filter logs..."

        // Server-side pagination config
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

