# MASCD-MIS Client-Side Documentation

Welcome to the client-side documentation for the MASCD-MIS application. This guide is designed to give every developer, from newcomers to seasoned contributors, a thorough understanding of our frontend architecture, core patterns, and development practices.

## 1. Introduction: What is the Client Application?

The client is a **Single Page Application (SPA)** built with **React** and bundled with **Vite**. It provides the user interface for the entire MASCD-MIS system.

### Key Features:

*   **Modern UI/UX**: A responsive and intuitive user interface built with reusable React components.
*   **Real-time Data**: Leverages WebSockets to receive and display live data updates from the server, ensuring the UI is always in sync.
*   **Role-Based Access Control (RBAC)**: Dynamically renders UI elements and controls access to pages based on the logged-in user's permissions.
*   **Client-Side Routing**: Uses `react-router-dom` to provide fast, seamless navigation between different views without full page reloads.

## 2. Getting Started: Setting Up Your Development Environment

Follow these steps to get the client running on your local machine.

### Prerequisites

*   **Node.js**: You'll need Node.js installed, preferably version 18 or higher.
*   **A running server instance**: The client application needs to connect to the server's API. Make sure you have the server running locally (see the `SERVER_GUIDE.md`).

### Installation Steps

1.  **Navigate to the Client Directory**:
    ```bash
    cd client
    ```

2.  **Install Dependencies**: This command installs all the necessary Node.js modules defined in `package.json`.
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

The `client/src` directory contains the heart of our application. Understanding its structure is key to finding your way around the codebase.

```
/client/src
├── api.js                 # Axios instance for making HTTP requests to the server.
├── main.jsx               # The main entry point of the React application.
├── router.jsx             # Defines all the application's routes and page components.
├── socket.js              # Configures the Socket.IO client for real-time communication.
|
├── assets/                # Static assets like images and SVGs.
├── components/            # Reusable UI components used across the application.
├── context/               # React Context providers for global state (Auth, Config).
├── hooks/                 # Custom React hooks that contain reusable logic.
├── layouts/               # High-level layout components (e.g., main app layout, auth pages layout).
├── pages/                 # Top-level components, where each file or folder represents a page.
├── stores/                # Zustand stores for managing centralized, real-time data.
└── utils/                 # Utility functions that can be used anywhere.
```

## 4. Core Architecture & State Management

Our state management strategy is layered to be both efficient and easy to manage.

*   **React Context**: Used for global, slowly-changing state.
    *   `AuthContext`: Provides the current user's authentication status (`user`, `isAuthenticated`) to the entire application.
    *   `ConfigContext`: Provides application-wide configuration, most importantly the `PERMISSIONS` object and the `hasPermission` helper function for checking user roles.

*   **Zustand (via custom hooks)**: Used for managing dynamic, real-time data from the server (like lists of users, donations, logs). This centralized store prevents data inconsistencies and race conditions, ensuring that if data is updated in one place, the change is reflected everywhere it's used.

## 5. Key Hooks: Your Toolkit for Building Features

Custom hooks are the primary way we build features. They encapsulate complex logic, making our components clean and declarative.

### `useAuth()` - Accessing the Current User

This is the hook for all things authentication.

*   **Usage**: `const { user, isAuthenticated, loading } = useAuth();`
*   **Returns**:
    *   `user`: The authenticated user object, which includes their roles and permissions. It's `null` if the user is not logged in.
    *   `isAuthenticated`: A simple boolean flag.
    *   `loading`: A boolean that is `true` while the hook is validating the session on initial app load.

### `useConfig()` - Checking Permissions

This hook provides tools for our Role-Based Access Control (RBAC) system.

*   **Usage**: `const { PERMISSIONS, hasPermission } = useConfig();`
*   **Returns**:
    *   `PERMISSIONS`: An object mapping permission names to their string values from the server (e.g., `MANAGE_USERS: 'manage:users'`). **Always use this object** to avoid typos.
    *   `hasPermission(user, permission)`: A helper function to check if a user object has a specific permission.

**Example: Conditionally rendering an "Admin" button**

```jsx
import { useAuth } from './context/AuthContext';
import { useConfig } from './context/ConfigContext';
import { Button } from './components/UI';

function UserActions({ targetUser }) {
  const { user: currentUser } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();

  // Only show the "Delete User" button if the current user has the 'manage:users' permission
  if (!hasPermission(currentUser, PERMISSIONS.MANAGE_USERS)) {
    return null;
  }

  return <Button danger onClick={() => deleteUser(targetUser.id)}>Delete User</Button>;
}
```

### `useTableControls(options)` - Managing UI State for Tables

Data tables often have complex UI state: pagination, sorting, search queries, etc. This hook manages all of it.

*   **Usage**: `const { queryParams, setPage, setSearch, handleSortChange } = useTableControls({ ...options });`
*   **Returns**:
    *   `queryParams`: A memoized object containing the current state (`page`, `limit`, `sortBy`, `sortDir`, `search`). This object is ready to be passed directly to `useRealtimeResource`.
    *   State Setters: Functions to update the state, like `setPage`, `setSearch`, and `handleSortChange`.

### `useRealtimeResource(resourceName, options)` - Fetching Lists of Data

This is the primary hook for fetching and subscribing to **lists** of data (e.g., a table of users, a list of audit logs).

*   **Usage**: `const { data, meta, loading, error } = useRealtimeResource('users', { queryParams });`
*   **`resourceName`**: The name of the API resource (e.g., `'users'`, `'audit_logs'`).
*   **`options.queryParams`**: The `queryParams` object from `useTableControls`. The hook automatically re-fetches data whenever these params change.
*   **Returns**:
    *   `data`: An array of items for the current page.
    *   `meta`: An object containing pagination details from the server (`totalItems`, `totalPages`, etc.).
    *   `loading`: A boolean loading state.
    *   `error`: Any error that occurred.

### `useRealtimeRecord(resourceName, id)` - Fetching a Single Record

This is a specialized, highly efficient hook for fetching and subscribing to a **single record** by its ID. It's perfect for detail pages (e.g., a user's profile page).

*   **Usage**: `const { data, loading, error } = useRealtimeRecord('users', userId);`
*   **Returns**:
    *   `data`: The single record object (e.g., the user), or `null` if not found.
    *   `loading`/`error`: Standard state indicators.

## 6. Putting It All Together: A Practical Example

Let's build a paginated, real-time page to display system audit logs. This demonstrates how all the core hooks work in harmony.

```jsx
import React from 'react';
import { useRealtimeResource } from '../../hooks/useRealtimeResource';
import { useTableControls } from '../../hooks/useTableControls';
import { DataTable, Alert, PageHeader } from '../../components/UI';
import { formatDistanceToNow } from 'date-fns'; // for formatting dates

// This component will render our page
function AuditLogPage() {
  // 1. Set up state management for our table UI (pagination, search, sorting).
  //    We provide initial sorting settings.
  const { 
    queryParams,
    setPage, 
    setSearch, 
    handleSortChange 
  } = useTableControls({ 
    initialSort: { key: 'createdAt', direction: 'desc' }
  });

  // 2. Fetch the data.
  //    We pass the resource name ('audit_logs') and the queryParams from our controls hook.
  //    The hook handles all the complexity of fetching, caching, and subscribing to real-time updates.
  const { data, meta, loading, error } = useRealtimeResource('audit_logs', { 
    queryParams
  });

  // 3. Define the columns for our DataTable.
  //    This declarative structure tells the table how to render each piece of data.
  const columns = React.useMemo(() => [
    { header: 'Description', accessor: 'description' },
    { header: 'Initiator', accessor: 'Initiator.username', default: 'System' },
    { header: 'Operation', accessor: 'operation' },
    { 
      header: 'Timestamp', 
      accessor: 'createdAt',
      // Use a custom cell renderer to format the date
      cell: ({ value }) => `${formatDistanceToNow(new Date(value))} ago`
    },
  ], []);

  // 4. Handle error states gracefully.
  if (error) {
    return <Alert type="error" title="Data Sync Error" message={error.message} />;
  }

  // 5. Render the UI.
  //    We connect the state and setters from our hooks to the DataTable component props.
  return (
    <div className="space-y-6">
      <PageHeader title="System Audit Logs" />
      
      <DataTable 
        columns={columns} 
        data={data || []} // Default to an empty array while loading
        isLoading={loading}
        
        // Search and Sort controls
        onSearch={setSearch}
        onSort={handleSortChange}
        searchPlaceholder="Filter by description or initiator..."

        // Server-side pagination controls
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

This example showcases the power of our architecture. The component itself is simple and declarative. It describes *what* state it needs and *how* to display it, while the custom hooks handle all the complex logic of fetching, state management, and real-time updates.