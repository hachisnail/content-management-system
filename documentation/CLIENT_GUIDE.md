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

We use a combination of two hooks, `useTableControls` and `useRealtimeResource`, to manage server-side data operations (pagination, sorting, filtering) and display it in a table.

### Step 1: `useTableControls(options)`

This hook manages the state of UI controls like pagination, search, and filters. It generates a `queryParams` object that can be passed directly to the data-fetching hook.

-   **`options`**: An object for configuration.
    -   `defaultLimit`: The number of items per page (e.g., `10`).
    -   `initialSort`: The default sort order (e.g., `{ key: 'createdAt', direction: 'desc' }`).
-   **Returns:**
    -   `page`, `setPage`: Current page number and its setter.
    -   `limit`, `setLimit`: Items per page and its setter.
    -   `search`, `setSearch`: The raw search query and its setter.
    -   `filters`, `handleFilterChange`: Current filters and a function to update them.
    -   `queryParams`: A memoized object containing the combined state (`{ page, limit, search, sort_by, sort_dir, ...filters }`). **This is the object you will pass to the data-fetching hook.**
    -   `handleSortChange`: A function to be passed to a table component's `onSort` prop.

### Step 2: `useRealtimeResource(resourceName, options)`

This is the primary hook for fetching data and subscribing to real-time updates via WebSockets.

-   **`resourceName`**: The name of the API resource (e.g., `'audit_logs'`).
-   **`options`**: A configuration object.
    -   `queryParams`: **(Required)** The `queryParams` object from `useTableControls`.
    -   `updateStrategy`: `'refetch'` (default) or `'manual'`.
        -   `'refetch'`: The safest strategy. Any real-time event will cause a full refetch of the current page. Best for complex data tables.
        -   `'manual'`: A smoother UX for simple lists. On page 1, new items are prepended to the list without a refetch. On other pages, it falls back to refetching.
    -   `onUpdate`: A callback function that fires in `'manual'` mode when an item is updated, allowing for custom logic.
-   **Returns:**
    -   `data`: An array of items for the current page.
    -   `meta`: An object with pagination details (`{ totalItems, itemsPerPage, currentPage, totalPages }`).
    -   `loading`: A boolean loading state.
    -   `error`: Any error that occurred during fetching.

---

## 3. UI Components

The primary UI component for displaying this data is `<DataTable />`.

### `<DataTable props>`

A flexible table component designed to work with our data hooks.

-   **`columns`**: An array of objects defining the table columns.
    -   `header`: The text to display in the `<th>`.
    -   `accessor`: The key in the data object to use for sorting.
    -   `sortable`: `true` if the column should be sortable.
    -   `render`: A function `(row) => JSX` that returns the JSX to render for a cell.
-   **`data`**: The `data` array from `useRealtimeResource`.
-   **`isLoading`**: The `loading` boolean from `useRealtimeResource`. For a better UX, pass `loading && page === 1`.
-   **`onSearch`**: The `setSearch` function from `useTableControls`.
-   **`onSort`**: The `handleSortChange` function from `useTableControls`.
-   **`serverSidePagination`**: An object containing all pagination data.
    -   `totalItems`: The `totalCount` derived from `meta.totalItems`.
    -   `currentPage`: The `page` from `useTableControls`.
    -   `itemsPerPage`: The `limit` from `useTableControls`.
    -   `onPageChange`: The `setPage` function from `useTableControls`.

---

## 4. Full Example: Building a Paginated, Real-time Log Page

This example ties all the concepts together to create a page similar to `AuditLogs.jsx`.

```jsx
import React, { useState } from 'react';
import useRealtimeResource from '../../hooks/useRealtimeResource';
import { useTableControls } from '../../hooks/useTableControls';
import { DataTable, Badge, Button, Alert, Dropdown } from '../../components/UI';
import { Clock, Filter, Check } from 'lucide-react';

function LogPage() {
  // 1. Set up table controls. Default sort is newest first.
  const { 
    page, setPage, 
    limit, 
    search, setSearch, 
    filters, handleFilterChange, 
    queryParams, 
    handleSortChange 
  } = useTableControls({ 
    defaultLimit: 15, 
    initialSort: { key: 'createdAt', direction: 'desc' }
  });

  // 2. Fetch data using the queryParams from the controls hook.
  //    Use 'manual' strategy for smooth real-time prepending of new logs.
  const { data, meta, loading, error } = useRealtimeResource('audit_logs', { 
    queryParams,
    updateStrategy: 'manual'
  });

  // 3. Derive state for the UI.
  const logs = data || [];
  const totalCount = meta?.totalItems || 0;

  // 4. Define columns for the DataTable.
  const columns = [
    { 
      header: "Timestamp", 
      accessor: "createdAt",
      sortable: true,
      render: (log) => (
        <div>
          {new Date(log.createdAt).toLocaleString()}
        </div>
      )
    },
    { 
      header: "Operation", 
      accessor: "operation",
      sortable: true,
      render: (log) => <Badge>{log.operation}</Badge>
    },
    { 
      header: "Description", 
      accessor: "description",
      render: (log) => <p>{log.description}</p>
    },
  ];

  if (error) return <Alert type="error" title="Sync Error" message={error} />;

  // 5. Render the DataTable and connect all the props.
  return (
    <div className="space-y-6">
      <h1>System Logs</h1>
      
      <DataTable 
        columns={columns} 
        data={logs} 
        isLoading={loading && page === 1} // Only show big loader on first load
        onSearch={setSearch}
        onSort={handleSortChange}
        searchPlaceholder="Filter by description..."
        serverSidePagination={{
          totalItems: totalCount,
          currentPage: page,
          itemsPerPage: limit,
          onPageChange: setPage
        }}
        filterSlot={
          <Dropdown trigger={<Button icon={Filter}>Filter Action</Button>}>
            {['CREATE', 'UPDATE', 'DELETE'].map(op => (
              <button key={op} onClick={() => handleFilterChange('operation', op)}>
                {op}
              </button>
            ))}
          </Dropdown>
        }
      />
    </div>
  );
}

export default LogPage;
```
