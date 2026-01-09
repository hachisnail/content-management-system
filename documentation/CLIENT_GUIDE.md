# MASCD-MIS Client Documentation

This document provides a guide to the core client-side hooks, components, and patterns used in this application. Understanding these concepts is essential for building new features and maintaining existing ones.

## 1. Authentication & Permissions (RBAC)

Our application uses Role-Based Access Control (RBAC) to manage user permissions. This is handled through the `useAuth` and `useConfig` hooks.

### `useAuth()`
This hook provides the currently authenticated user's session data.

-   **Returns:** An object with `{ user, isAuthenticated, loading, ... }`.
-   `user`: The user object, including their roles and permissions. `null` if not authenticated.
-   `isAuthenticated`: A boolean flag indicating if a user is logged in.

### `useConfig()`
This hook provides access to application configuration, including the master list of permissions.

-   **Returns:** An object with `{ PERMISSIONS, hasPermission, ... }`.
-   `PERMISSIONS`: An object mapping permission names to string constants (e.g., `{ VIEW_AUDIT_LOGS: 'view:audit_logs' }`). **Always use this object** instead of raw strings to avoid typos.
-   `hasPermission(user, permission)`: A utility function to check if a user has a specific permission.

### Example: Conditionally Rendering a UI Element

To show an element only to users with a specific permission, use `hasPermission` with the `user` object from `useAuth` and a permission from `PERMISSIONS`.

```jsx
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { hasPermission, PERMISSIONS } = useConfig();

  if (!hasPermission(user, PERMISSIONS.MANAGE_USERS)) {
    return <p>You do not have access to this section.</p>;
  }

  return (
    <div>
      {/* Admin content goes here */}
    </div>
  );
};
```

---

## 2. Data Fetching & UI State Management

The application now uses a centralized, `zustand`-based store for all real-time data, which eliminates race conditions and ensures data consistency. Components interact with this store via two specialized hooks.

-   **`useRealtimeResource`**: For fetching and subscribing to **lists** of data (e.g., users, logs). It supports server-side pagination, sorting, and filtering.
-   **`useRealtimeRecord`**: For fetching and subscribing to a **single record** by its ID (e.g., a specific user's profile).

This dual-hook approach provides both efficiency for single-record views and scalability for large data tables.

### `useTableControls(options)`

This hook's role is unchanged. It manages the state of UI controls (pagination, search) and generates a `queryParams` object to be passed to `useRealtimeResource`.

-   **Returns:** `queryParams`, `setPage`, `setSearch`, `handleSortChange`, etc.

### `useRealtimeResource(resourceName, options)`

This is the primary hook for fetching **lists** of data. It connects to the central store and handles server-side data operations.

-   **`resourceName`**: The name of the API resource (e.g., `'audit_logs'`).
-   **`options`**: A configuration object.
    -   `queryParams`: **(Recommended)** The `queryParams` object from `useTableControls`.
-   **Returns:**
    -   `data`: An array of items for the current page.
    -   `meta`: An object with pagination details (`{ totalItems, ... }`).
    -   `loading`: A boolean loading state.
    -   `error`: Any error that occurred during fetching.

### `useRealtimeRecord(resourceName, id, options)`

A specialized, highly-efficient hook for a **single record**.

-   **`resourceName`**: The name of the resource (e.g., `'users'`).
-   **`id`**: The ID of the record.
-   **`options`**: `{ isEnabled: boolean }`.
-   **Returns:**
    -   `data`: The user object, or `null` if not found/loading.
    -   `loading`: A boolean loading state.
    -   `error`: Any fetch error.

---

## 3. UI Components

The primary UI component for displaying this data is `<DataTable />`. Its props remain largely the same.

---

## 4. Full Example: Building a Paginated, Real-time Log Page

This example ties all the concepts together to create a page similar to `AuditLogs.jsx`.

```jsx
import React from 'react';
import { useRealtimeResource } from '../../hooks/useRealtimeResource';
import { useTableControls } from '../../hooks/useTableControls';
import { DataTable, Alert } from '../../components/UI';

function LogPage() {
  // 1. Set up table controls.
  const { 
    queryParams,
    setPage, 
    setSearch, 
    handleSortChange 
  } = useTableControls({ 
    defaultLimit: 15, 
    initialSort: { key: 'createdAt', direction: 'desc' }
  });

  // 2. Fetch data using the queryParams from the controls hook.
  //    The new hook is simpler and always uses a 'refetch' strategy,
  //    making it robust and keeping the server as the source of truth.
  const { data, meta, loading, error } = useRealtimeResource('audit_logs', { 
    queryParams
  });

  // 3. Derive state for the UI.
  const logs = data || [];
  const totalCount = meta?.totalItems || 0;

  // 4. Define columns for the DataTable. (Implementation omitted for brevity)
  const columns = [
    // ... column definitions
  ];

  if (error) return <Alert type="error" title="Sync Error" message={error} />;

  // 5. Render the DataTable and connect all the props.
  return (
    <div className="space-y-6">
      <h1>System Logs</h1>
      
      <DataTable 
        columns={columns} 
        data={logs} 
        isLoading={loading && queryParams.page === 1}
        onSearch={setSearch}
        onSort={handleSortChange}
        searchPlaceholder="Filter by description..."
        serverSidePagination={{
          totalItems: totalCount,
          currentPage: queryParams.page,
          itemsPerPage: queryParams.limit,
          onPageChange: setPage
        }}
      />
    </div>
  );
}

export default LogPage;
```
