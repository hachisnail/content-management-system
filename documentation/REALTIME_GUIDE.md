# Comprehensive Guide to the Real-Time System

This guide provides a deep dive into the real-time architecture of the MASCD-MIS application. Our goal is to create a user interface that feels alive, where data is always in sync with the database without ever needing to press a refresh button. This guide explains how we achieve this in a way that is robust, efficient, and easy for developers to use.

## 1. The Big Picture: An Event-Driven Architecture

At its core, our real-time system is event-driven. Instead of a client constantly asking the server for updates (polling), the server tells the client about changes as soon as they happen.

Here is the journey of a single data change from the database to the user's screen:

`Database Change` -> `Sequelize Hook` -> `Server-Side Event Emission` -> `Socket.IO` -> `Client-Side Central Store` -> `React Component Update`

This architecture solves many common problems in real-time applications, such as data inconsistency and race conditions, by creating a single, reliable flow of information.

## 2. Server-Side: Automated Event Emission

The most important principle of our server-side implementation is:

> **Golden Rule**: We NEVER manually emit socket events from controllers or services. Event emission is fully automated by listening directly to database changes.

This ensures that *every* change, no matter where it originates in the code, will reliably trigger a real-time update. We achieve this using **Sequelize Hooks**.

### What are Sequelize Hooks?

Sequelize hooks are functions that are automatically executed when a database operation occurs. We primarily use `afterCreate`, `afterUpdate`, and `afterDestroy`. When a user is saved, for example, the `afterUpdate` hook is triggered.

### Our Custom Hook Factories (`/src/models/hooks.js`)

We have created reusable "hook factories" that contain the logic for emitting socket events.

#### The Dual-Emission Strategy

For data that can be changed (like users or donations), we need to update two different kinds of views on the client:
1.  **List Views**: A table or list of many items.
2.  **Record Views**: A detailed view of a single item (e.g., a profile page).

To handle this efficiently, our `notifyMutableResource` factory uses a **dual-emission strategy**. When a record is updated (e.g., the User with ID `123`), it emits an event to two different Socket.IO "rooms":

1.  **A Generic Room** (e.g., `'users'`): The event sent to this room is a simple notification. It tells any client component listening (like a user table) that its data is now stale and it needs to refetch its list.
2.  **A Specific Room** (e.g., `'users_123'`): The event sent to this room contains the **full, updated data** for that specific user. This allows a detailed view (like a profile page for user 123) to update its state instantly without needing a second API call.

### How to Make a Model Real-Time

Making a new data model real-time is incredibly simple. Open `/src/models/index.js` and attach the appropriate hook factory to your Sequelize model.

*   **For Mutable Data** (e.g., Users, Products - things that can be created, updated, and deleted):
    Use `notifyMutableResource` for updates and `notifyDeletedResource` for deletions.

    ```javascript
    // in /src/models/index.js
    import { notifyMutableResource, notifyDeletedResource } from './hooks.js';

    // ... after db.User is defined ...

    // This handles all creates and updates for the User model.
    db.User.afterSave(notifyMutableResource('users'));

    // This handles all deletes for the User model.
    db.User.afterDestroy(notifyDeletedResource('users'));
    ```

*   **For Append-Only Data** (e.g., Audit Logs - things that are only ever created):
    Use `notifyNewResource`. This is simpler and only emits a `_created` event to the generic room.

    ```javascript
    // in /src/models/index.js
    import { notifyNewResource } from './hooks.js';
    db.AuditLog.afterCreate(notifyNewResource('audit_logs'));
    ```

## 3. Client-Side: The Centralized `zustand` Store

On the client, we need a way to manage the incoming real-time data. A naive approach where every component fetches its own data and listens to socket events leads to bugs, stale UIs, and network inefficiencies.

### Our Solution: A Single Source of Truth

We solve this by using a **centralized `zustand` store** for each resource. This means there is one, and only one, place in the entire application that manages user data, one place that manages donation data, and so on.

*   **`createRealtimeStore.js`**: This is a factory that creates our standard `zustand` store. It comes pre-packaged with all the necessary logic to:
    *   Fetch data from the API.
    *   Cache the results of API calls.
    *   Listen to socket events for the resource (`_created`, `_updated`, `_deleted`).
    *   Update its cache based on those events.
    *   Notify React components when the data they care about has changed.

This central store acts as a clean, reliable, and in-memory cache for our application's server state.

## 4. Client-Side: Consuming Real-Time Data with Hooks

As a frontend developer, you will almost never interact with the `zustand` store directly. Instead, you'll use one of two simple and declarative React hooks.

### `useRealtimeResource()` - For Fetching Lists

This is the hook you will use for any component that displays a **list or table** of data.

*   **Purpose**: To display paginated, filterable, and sortable collections of data.
*   **Usage**: `const { data, meta, loading } = useRealtimeResource('users', { queryParams });`
*   **How it Works**: You provide the resource name (`'users'`) and a `queryParams` object (typically from our `useTableControls` hook). The hook subscribes to the central `users` store and asks for the data corresponding to that specific query. If the store doesn't have that data cached, the store itself triggers an API fetch.
*   **How it Stays in Sync**: The central store listens for the generic `users_created` and `users_deleted` socket events. When it receives one, it knows that any list of users might now be out of date. It automatically re-fetches the data for any active queries, which in turn causes your component to re-render with the fresh data.

### `useRealtimeRecord()` - For Fetching a Single Item

This is a highly efficient hook used for components that display a **single record**, such as a detail or profile page.

*   **Purpose**: To display and get live updates for one specific item.
*   **Usage**: `const { data, loading } = useRealtimeRecord('users', userId);`
*   **How it Works**: You provide the resource name and the ID of the record you need. The hook subscribes to the central `users` store and selects that specific user from the cache.
*   **How it Stays in Sync**: The central store listens for the specific `users_123_updated` event (where `123` is the user ID). When it receives this event, it updates the user in its cache **directly with the new data from the event payload**. This is incredibly fast because it does not require an additional API call. The component re-renders instantly.

## 5. A Complete Development Workflow

Here’s how you would build a new real-time "Tasks" feature from start to finish.

1.  **Server: Define the Model**: Create your `Task` model in Sequelize.
2.  **Server: Enable Real-Time**: In `models/index.js`, add the hooks to your new `Task` model. Since tasks can be created, updated, and deleted, you'll use `notifyMutableResource` and `notifyDeletedResource`.

    ```javascript
    db.Task.afterSave(notifyMutableResource('tasks'));
    db.Task.afterDestroy(notifyDeletedResource('tasks'));
    ```

3.  **Client: Build the List Page (`TasksPage.jsx`)**:
    *   Use the `useTableControls` hook to manage pagination, sorting, and searching state.
    *   Call `useRealtimeResource('tasks', { queryParams })` to get the list of tasks.
    *   Pass the `data`, `meta`, `loading` state, and control functions to your `<DataTable>` component.

4.  **Client: Build the Detail Page (`TaskDetailPage.jsx`)**:
    *   Get the task ID from the URL parameters.
    *   Call `useRealtimeRecord('tasks', taskId)` to get the specific task data.
    *   Render the task details.

That's it. With just a few lines of code on both the client and server, you have created a fully-featured, robust, and real-time UI. The architecture handles all the complexity of data fetching, caching, and state synchronization for you.