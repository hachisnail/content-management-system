# MASCD-MIS Server-Side Documentation

This document provides a comprehensive guide to the server-side architecture, patterns, and features of the MASCD-MIS application. It is intended for developers working on the API and real-time services.

## 1. Getting Started

### Prerequisites
-   Node.js (v18 or higher recommended)
-   MariaDB
-   A running PostgreSQL database instance

### Installation
1.  Navigate to the `/server` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `/server` directory. You can copy `.env.example` if it exists, or create a new file.
4.  Populate the `.env` file with your database credentials and other required environment variables (see **Environment Configuration** section).
5.  Run the server in development mode (with auto-reloading):
    ```bash
    npm run dev
    ```
The server should now be running on the port specified in your `.env` file (e.g., `http://localhost:3000`).

---

## 2. Core Technologies

-   **Runtime/Framework**: Node.js with Express.js
-   **Database**: MariaDB with Sequelize as the ORM
-   **Authentication**: Passport.js for session-based authentication
-   **Real-time Communication**: Socket.IO for WebSocket communication
-   **Modules**: ES Modules (`import`/`export` syntax) are used throughout the project.
-   **Linting/Formatting**: ESLint and Prettier, configured to enforce a consistent code style.

---

## 3. Architecture Deep Dive

The server follows a layered architecture to promote separation of concerns, making the codebase clean, scalable, and maintainable.

**Request Flow:** `Client -> Route -> Middleware(s) -> Controller -> Service -> Model -> Database`

```
/server/src
├── app.js               # Main Express application setup, middleware registration
├── socket.js            # Socket.IO server setup and event listeners
├── socket-store.js      # In-memory store for tracking socket/user connections
|
├── config/              # Configuration files for various modules (DB, CORS, etc.)
├── controllers/         # Handles HTTP request/response logic, calls services
├── middlewares/         # Custom Express middlewares (auth, error handling, etc.)
├── models/              # Sequelize database models and associations
├── routes/              # API route definitions (the entry points)
├── services/            # Encapsulates business logic and database interactions
└── utils/               # Reusable utilities (e.g., queryBuilder)
```

### Layer Responsibilities

#### a. Routes (`/src/routes/*.js`)
-   **Purpose**: Defines API endpoints. They map URL paths and HTTP methods to specific controller functions. They are the "front door" of the application.
-   **Integration**: Routes often include authentication and authorization middlewares to protect endpoints.
-   **Example (`user.routes.js`)**:
    ```javascript
    import { Router } from 'express';
    import * as userController from '../controllers/user.controller.js';
    import { isAuthenticated, hasPermission } from '../middlewares/auth.middleware.js';

    const router = Router();

    // GET all users (protected route, requires 'view:users' permission)
    router.get('/', isAuthenticated, hasPermission('view:users'), userController.getAllUsers);

    // DELETE a user (requires 'manage:users' permission)
    router.delete('/:id', isAuthenticated, hasPermission('manage:users'), userController.deleteUser);
    
    export default router;
    ```

#### b. Middlewares (`/src/middlewares/*.js`)
-   **Purpose**: Functions that execute *during* the request-response cycle. Used for handling cross-cutting concerns like authentication, logging, and error handling.
-   **Key Middlewares**:
    -   `auth.middleware.js`: Contains `isAuthenticated` to verify a user's session and `hasPermission` for Role-Based Access Control (RBAC).
    -   `error.middleware.js`: A global error handler. Any error passed to `next(error)` in a controller or service will be caught here and sent as a standardized JSON response.
    -   `activity.middleware.js`: Logs user actions to the audit trail after a controller has successfully executed a state-changing operation.

#### c. Controllers (`/src/controllers/*.js`)
-   **Purpose**: To orchestrate the request and response. Controllers should be "thin" and delegate heavy lifting to services.
-   **Responsibilities**:
    1.  Extract and sanitize input from `req` (params, query, body).
    2.  Call one or more **Services** to apply business rules and interact with the database.
    3.  Format the data from the service into a standard JSON response.
    4.  Emit **Socket.IO events** to notify clients of data changes.
    5.  Catch errors and pass them to the global error handler (`next(error)`).

#### d. Services (`/src/services/*.js`)
-   **Purpose**: The core of the application. Contains all business logic, data validation, and database queries.
-   **Responsibilities**:
    -   Interact directly with **Models** to perform CRUD operations.
    -   Encapsulate complex logic that might involve multiple models or external APIs.
    -   Utilize the `queryBuilder` utility to handle dynamic filtering, sorting, and pagination.

#### e. Models (`/src/models/*.js`)
-   **Purpose**: Define the application's data structure (database schemas) and their relationships. See the **Models and Associations** section for a detailed breakdown.

---

## 4. Configuration Deep Dive (`/src/config`)

Configuration is centralized in the `/src/config` directory, keeping settings organized and easy to manage.

-   **`cors.js`**: Configures Cross-Origin Resource Sharing. The `CORS_ORIGIN` environment variable determines which frontend URL is allowed to make requests to this server.
-   **`database.js`**: Reads database credentials from environment variables and configures the Sequelize connection settings, including connection pooling and SSL for production.
-   **`env.js`**: Loads environment variables from a `.env` file into `process.env` using the `dotenv` package. This is one of the first files loaded when the server starts.
-   **`mailer.js`**: (If present) Configures a transporter (e.g., Nodemailer) for sending emails, such as password resets or notifications.
-   **`passport.js`**: Configures the Passport.js authentication strategies. It defines the `LocalStrategy` for handling email/password logins and the serialization/deserialization of user sessions.
-   **`permissions.js`**: Defines the Role-Based Access Control (RBAC) rules, mapping roles (like `admin`, `editor`) to specific permissions (like `manage:users`, `view:donations`).
-   **`session.js`**: Configures the `express-session` middleware, including the session secret, cookie settings, and the session store (e.g., `connect-session-sequelize`).

---

## 5. Models and Associations

The data layer is managed by Sequelize. The main models and their relationships are defined as follows.

-   **`index.js`**: This crucial file imports all model definitions, initializes them with the Sequelize instance, and sets up the associations between them. It exports a unified `db` object that the services use.

### Model: `User`
-   **Schema**: `id`, `username`, `firstName`, `lastName`, `email`, `password` (hashed), `contactNumber`, `role` (JSON array, e.g., `['admin', 'viewer']`), `status` ('pending', 'active', 'disabled'), `isOnline`, `socketId` (array of active socket connections), `last_active`.
-   **Purpose**: Represents application users, their roles, and their real-time connection status.

### Model: `Donation`
-   **Schema**: `id`, `donorName`, `donorEmail`, `contactNumber`, `itemDescription`, `quantity`, `status` ('pending', 'review', 'accepted', 'rejected'), `adminNotes`.
-   **Purpose**: Represents donation records, which can be made by guests (unregistered users).

### Model: `AuditLog`
-   **Schema**: `id`, `description`, `operation`, `affectedResource`, `beforeState` (JSON), `afterState` (JSON), `initiator`.
-   **Purpose**: A log of significant events and data changes within the system. It records what happened, who did it, and the state of the data before and after the change.

### Associations
-   **`User` <-> `AuditLog`**: A `User` can have many `AuditLog` entries. An `AuditLog` belongs to one initiating `User`.
    -   `User.hasMany(AuditLog, { foreignKey: 'initiator' })`
    -   `AuditLog.belongsTo(User, { foreignKey: 'initiator' })`
-   **`User` <-> `Donation`**: While not directly associated via a foreign key in the database (to allow guest donations), the business logic can link them via the `donorEmail` field if a user with that email exists.

---

## 6. Authentication and Authorization (RBAC)

### a. Authentication Flow (Who are you?)
1.  **Login**: User sends `email` and `password` to the `/api/auth/login` endpoint.
2.  **Passport `LocalStrategy`**: The strategy defined in `config/passport.js` is triggered. It finds the user by email and compares the provided password with the hashed password in the database.
3.  **Session Creation**: If credentials are valid, `passport.serializeUser` is called. It stores the user's ID in the session store (`req.session.passport.user = user.id`). A session cookie is sent back to the client's browser.
4.  **Subsequent Requests**: The client's browser automatically sends the session cookie with every request.
5.  **`isAuthenticated` Middleware**: This middleware runs on protected routes. It uses `req.isAuthenticated()` (a Passport.js method) to check if a valid session exists. If not, it returns a `401 Unauthorized` error.

### b. Authorization Flow (What can you do?)
1.  **`hasPermission` Middleware**: This middleware is used on routes that require specific permissions beyond just being logged in. It's the core of our RBAC system.
2.  **Permission Check**: `hasPermission('manage:users')` will:
    a. Get the current user from `req.user`.
    b. Look up the user's roles (e.g., `['admin']`).
    c. Check the `config/permissions.js` file to see if any of those roles have the `manage:users` permission.
3.  **Access Control**: If the user has the permission, the request continues to the controller. If not, it returns a `403 Forbidden` error.

---

## 7. The Reusable Query Builder (`/src/utils/queryBuilder.js`)

To standardize pagination, filtering, and sorting across all resources, we use a powerful and reusable query builder. This utility constructs a Sequelize options object from `req.query` parameters, dramatically simplifying service logic.

#### Supported Query Parameters
-   `page`: The page number for pagination (defaults to 1).
-   `limit`: The number of items per page (defaults to 10).
-   `sortBy`: The database column to sort by (e.g., `createdAt`).
-   `sortDir`: The sort direction (`ASC` or `DESC`, defaults to `DESC`).
-   `search`: A generic search term that queries across a predefined set of fields.
-   **Dynamic Filters**: Any other parameter (e.g., `status=pending`, `role=admin`) is treated as an exact `WHERE` filter.

#### Core Function: `buildQueryOptions(query, searchableFields)`
-   `query`: The `req.query` object from the controller.
-   `searchableFields`: An array of strings defining which model fields the `search` param should apply to.

#### Example Implementation

**1. Service (`services/user.service.js`)**
The service becomes clean and declarative.
```javascript
import { db } from '../models/index.js';
import { buildQueryOptions } from '../utils/queryBuilder.js';

export const findAll = async (queryParams = {}) => {
  // 1. Define fields for the generic 'search' parameter
  const searchableFields = ['firstName', 'lastName', 'email', 'username'];
  
  // 2. Build the full query options object
  const options = buildQueryOptions(queryParams, searchableFields);

  // Add any custom logic not covered by the builder
  options.attributes = { exclude: ['password'] };

  // 3. Use the generated options in the Sequelize call
  const { count, rows } = await db.User.findAndCountAll(options);

  // 4. Format the paginated response
  const { page = 1, limit = 10 } = queryParams;
  return {
    data: rows,
    meta: {
      totalItems: count,
      itemsPerPage: parseInt(limit, 10),
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
    },
  };
};
```

**2. Controller (`controllers/user.controller.js`)**
The controller simply passes the query string to the service.
```javascript
import * as userService from '../services/user.service.js';

export const getAllUsers = async (req, res, next) => {
  try {
    const result = await userService.findAll(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
```

---

## 8. Real-time Functionality with Socket.IO

The Socket.IO server provides real-time updates to connected clients.

-   **`socket.js`**: Initializes the Socket.IO server and attaches it to the Express HTTP server. It handles initial connection events and sets up listeners for client actions like `subscribe_resource`.
-   **`socket-store.js`**: A simple in-memory store to map a `userId` to their active `socket.id`(s). This allows us to find and target specific users.

### Emitting Events from Controllers
To ensure data consistency, events are emitted **after** a database operation is successful. The `io` instance is attached to the Express `app` object and can be accessed via `req.app.get('io')`.

**Convention:** Event names follow the pattern `{resource_name}_{action}`. This is critical for the client-side `useRealtimeResource` hook.

-   `users_created`, `users_updated`, `users_deleted`
-   `donations_created`, `donations_updated`, `donations_deleted`

**Example: Emitting an "updated" event**
```javascript
// In user.controller.js
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [updatedCount, updatedUsers] = await userService.update(id, req.body);
    
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // --- EMIT SOCKET EVENT ---
    const io = req.app.get('io');
    // Broadcast to the 'users' room that a user was updated.
    // The payload is the updated user data.
    io.to('users').emit('users_updated', updatedUsers[0]); 
    // ---

    res.status(200).json(updatedUsers[0]);
  } catch (error) {
    next(error);
  }
};
```
This ensures that all clients subscribed to the `users` resource will see the update in real-time without needing to refresh the page.
