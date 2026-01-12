# MASCD-MIS Server-Side Documentation

Welcome to the server-side documentation for the MASCD-MIS application. This guide is designed to provide a comprehensive understanding of the server's architecture, features, and development practices. It is intended for developers of all levels, including those who are new to the project.

## 1. Introduction: What Does This Server Do?

The server is the backbone of the MASCD-MIS application. It is a Node.js application built with the Express.js framework that provides a robust and scalable foundation for all of the application's features.

### Key Responsibilities:

*   **REST API:** It exposes a set of secure RESTful API endpoints that the client-side (frontend) application consumes to perform actions like creating, reading, updating, and deleting data.
*   **Real-time Communication:** Using Socket.IO, the server pushes live data updates to connected clients, ensuring that users always see the most up-to-date information without needing to refresh their pages.
*   **Authentication & Authorization:** It manages user authentication (verifying user identity) and authorization (controlling what users are allowed to do) through a role-based access control (RBAC) system.
*   **Database Management:** It interacts with a MariaDB database via the Sequelize ORM to persist and retrieve application data.
*   **File Uploads:** It handles file uploads and storage.

## 2. Core Technologies

This project leverages a modern and widely-used stack:

-   **Runtime/Framework**: **Node.js** with **Express.js** — A fast and minimalist web framework for building APIs.
-   **Database**: **MariaDB** with **Sequelize** as the Object-Relational Mapper (ORM). Sequelize allows us to interact with the database using JavaScript objects and methods instead of writing raw SQL queries.
-   **Authentication**: **Passport.js** — A flexible and modular authentication middleware for Node.js, used here for managing user sessions.
-   **Real-time Communication**: **Socket.IO** — A library that enables real-time, bidirectional, and event-based communication between the server and clients.
-   **Modules**: **ES Modules (`import`/`export`)** are used throughout the project for a modern and clean module system.
-   **Code Quality**: **ESLint** and **Prettier** are configured to enforce a consistent and high-quality code style across the entire codebase.

## 3. Getting Started: Setting Up Your Development Environment

Follow these steps to get the server running on your local machine.

### Prerequisites

*   **Node.js**: You'll need Node.js installed, preferably version 18 or higher.
*   **MariaDB**: A running instance of the MariaDB database. You can install it locally or use a database service.
*   **Git**: A Git client to clone the repository.

### Installation Steps

1.  **Clone the Repository**: If you haven't already, clone the project to your local machine.

2.  **Navigate to the Server Directory**:
    ```bash
    cd server
    ```

3.  **Install Dependencies**: This command reads the `package.json` file and installs all the necessary Node.js modules.
    ```bash
    npm install
    ```

4.  **Create an Environment File (`.env`)**:
    The server requires a `.env` file to store sensitive information like database credentials and security keys. A template is usually provided as `.env.example`.
    *   Create a new file named `.env` in the `/server` directory.
    *   Copy the contents of `.env.example` (if it exists) into your new `.env` file.

5.  **Configure Environment Variables**:
    Open the `.env` file and fill in the required values. At a minimum, you will need to provide:
    *   `DB_HOST`: The address of your database server (e.g., `localhost`).
    *   `DB_USER`: Your database username.
    *   `DB_PASSWORD`: Your database password.
    *   `DB_NAME`: The name of the database you created for this application.
    *   `SESSION_SECRET`: A long, random string used to secure user sessions.
    *   `CORS_ORIGIN`: The URL of the client application (e.g., `http://localhost:5173`).

6.  **Run the Server**:
    This command starts the server in development mode using `nodemon`, which will automatically restart the server whenever you make changes to the code.
    ```bash
    npm run dev
    ```

If everything is configured correctly, you should see a message in your console indicating that the server is running and listening on a specific port (e.g., `Server is running on port 3000`).

## 4. Architecture Deep Dive: How the Server is Organized

The server follows a **layered architecture**. This design separates the code into distinct layers, each with a specific responsibility. This makes the codebase cleaner, easier to understand, and more maintainable.

### The Request Lifecycle

Here’s the typical journey of an API request through the layers:

`Client -> Route -> Middleware(s) -> Controller -> Service -> Model -> Database`

### Directory Structure Explained

```
/server/src
├── app.js               # Main Express application setup, global middleware registration.
├── socket.js            # Socket.IO server setup and initial connection logic.
├── socket-store.js      # A simple utility to access the Socket.IO instance globally.
|
├── config/              # Configuration files for modules like the database, Passport, and CORS.
├── controllers/         # Handles the HTTP request and response. Acts as the "traffic cop".
├── middlewares/         # Functions for cross-cutting concerns like auth and error handling.
├── models/              # Sequelize database models, defining the structure of our data.
├── routes/              # API route definitions. The "entry points" of the application.
├── services/            # Contains the core business logic and data manipulation.
└── utils/               # Reusable helper functions and utilities (e.g., queryBuilder).
```

### Layer-by-Layer Responsibilities

#### a. Routes (`/src/routes/*.js`)

*   **Purpose**: To define the API endpoints. Routes map a URL path and an HTTP method (GET, POST, PUT, DELETE) to a specific controller function.
*   **Example**: The `user.routes.js` file defines endpoints like `GET /api/users` to fetch all users or `DELETE /api/users/:id` to delete a specific user. Routes are also where we place authentication and authorization middleware to protect endpoints.

#### b. Middlewares (`/src/middlewares/*.js`)

*   **Purpose**: These are functions that run *during* the request-response cycle. They are perfect for handling tasks that apply to many different routes.
*   **Key Middlewares**:
    *   `auth.middleware.js`: Protects routes by verifying that a user is logged in (`isAuthenticated`) and has the necessary permissions to perform an action (`hasPermission`).
    *   `error.middleware.js`: This is a global error handler. If an error occurs anywhere in the application, it gets caught here and sent back to the client as a standardized JSON response.

#### c. Controllers (`/src/controllers/*.js`)

*   **Purpose**: Controllers orchestrate the process of handling a request. They should remain "thin," meaning they delegate the heavy lifting to the services.
*   **Responsibilities**:
    1.  Extract and validate input from the request (`req.params`, `req.query`, `req.body`).
    2.  Call the appropriate **Service** to execute the business logic.
    3.  Format the data received from the service into a JSON response.
    4.  Send the final response back to the client.
    5.  Handle any errors by passing them to the error-handling middleware.

#### d. Services (`/src/services/*.js`)

*   **Purpose**: This layer is the heart of the application. It contains all the business logic.
*   **Responsibilities**:
    -   Interact with the **Models** to perform Create, Read,Update, and Delete (CRUD) operations.
    -   Encapsulate complex logic that may involve multiple steps or data sources.
    -   Use the `queryBuilder` utility for dynamic filtering, sorting, and pagination.

#### e. Models (`/src/models/*.js`)

*   **Purpose**: Models define the structure of your data. Each model corresponds to a table in the database.
*   **Key File: `index.js`**: This file is central to the data layer. It imports all other model files, initializes them with Sequelize, and crucially, it sets up the **associations** (relationships) between them (e.g., a `User` has many `AuditLog` entries). It exports a single `db` object that the rest of the application uses to interact with the database.

## 5. Authentication and Authorization

We use a combination of session-based authentication and Role-Based Access Control (RBAC).

### a. Authentication Flow (Who are you?)

1.  **Login**: A user submits their email and password to the `/api/auth/login` endpoint.
2.  **Passport Strategy**: The `LocalStrategy` in `config/passport.js` is triggered. It finds the user by email and securely compares the submitted password with the hashed password stored in the database.
3.  **Session Creation**: If the credentials are correct, Passport creates a session. It stores the user's ID in the session store and sends a secure cookie back to the client's browser.
4.  **Subsequent Requests**: The browser automatically includes this cookie with every future request to the server.
5.  **Verification**: The `isAuthenticated` middleware checks for a valid session on protected routes. If the session is missing or invalid, it rejects the request with a `401 Unauthorized` error.

### b. Authorization Flow (What can you do?)

1.  **Permission Check**: The `hasPermission('permission-name')` middleware is used on routes that require specific privileges.
2.  **Role Lookup**: It checks the current user's roles (e.g., `['admin', 'editor']`).
3.  **Rule Enforcement**: It consults the `config/permissions.js` file, which maps roles to a list of allowed permissions. If the user's role has the required permission, the request proceeds. Otherwise, it is rejected with a `403 Forbidden` error.

## 6. The Reusable Query Builder (`/src/utils/queryBuilder.js`)

To avoid writing repetitive filtering, sorting, and pagination logic in every service, we use a powerful `queryBuilder` utility. It constructs a complex Sequelize query object from simple URL query parameters.

### How It Works

Imagine you want to fetch users. Instead of writing custom logic for each filter, you can simply make a request to `GET /api/users` with query parameters:

`/api/users?page=2&limit=20&sortBy=createdAt&sortDir=ASC&status=active&search=john`

The `queryBuilder.js` utility automatically translates this URL into a Sequelize query that:
*   Fetches the 2nd page of results.
*   With 20 items per page.
*   Sorted by the creation date in ascending order.
*   Where the `status` is 'active'.
*   And where the `firstName`, `lastName`, or `email` contains "john".

This keeps the service logic incredibly clean and declarative.

## 7. Real-time Functionality with Socket.IO

The server uses Socket.IO to provide real-time updates to clients. Our approach is designed to be robust and maintainable by automating event emissions.

### The Automated Hook Strategy

We **do not** manually sprinkle `io.emit(...)` calls throughout our controllers. This is an anti-pattern that leads to messy and inconsistent code.

Instead, we leverage **Sequelize Hooks**. These are functions that automatically run when a database record is created, updated, or deleted.

1.  **Action**: A service function modifies a model instance (e.g., `user.save()`).
2.  **Hook Trigger**: After the data is successfully saved to the database, Sequelize automatically triggers the `afterSave` hook for the `User` model.
3.  **Centralized Emission**: A centralized hook function (defined in `models/hooks.js`) gets the `io` instance and emits a socket event to the relevant "room". For example, it might emit a `users_updated` event with the updated user data.

This declarative approach means a developer only needs to attach the hook once. From then on, **every** change to that model—no matter where it originates in the code—will reliably and automatically trigger a real-time event. This makes the system extremely robust and easy to reason about.

## 8. Centralized Error Handling

All errors in the application are funneled to a single global error-handling middleware (`middlewares/error.middleware.js`).

When an error occurs in a service or controller, it is passed to `next(error)`. This middleware catches the error, logs it for debugging purposes, and formats a standardized JSON error response to be sent to the client. This ensures that clients always receive a consistent error format, and we never leak sensitive stack traces in a production environment.