# Comprehensive Guide to Authentication and Authorization

This guide provides a detailed, step-by-step explanation of the authentication and authorization system in the MASCD-MIS application. It's designed for developers to understand not just *what* it does, but *how* it works, from the initial login request to permission-based access control.

## 1. Core Concepts: Authentication vs. Authorization

It's crucial to understand the two main pillars of our security system:

*   **Authentication**: This process answers the question, "**Who are you?**" It's the act of verifying a user's identity, typically by checking their email and password. In our system, a successful authentication results in the creation of a **session**.

*   **Authorization**: This process answers the question, "**What are you allowed to do?**" Once a user is authenticated, authorization determines which actions they can perform, which pages they can see, and which data they can access. We handle this using **Role-Based Access Control (RBAC)**.

Our application uses a traditional and robust **session-based authentication** system powered by **Passport.js**.

## 2. The User Login Journey: From Click to Cookie

Let's trace the exact flow of events when a user submits the login form.

**Client-Side**: The user enters their credentials and clicks "Login". A `POST` request is sent to the `/api/auth/login` endpoint.

---

**Server-Side**: The request arrives and begins its journey through the Express middleware.

*   **Step 1: The Route (`/src/routes/auth.routes.js`)**
    The request first hits our routing layer. The login route is configured to use Passport's `'local'` authentication strategy.

    ```javascript
    // in auth.routes.js
    router.post('/login', passport.authenticate('local'), authController.login);
    ```
    Notice `passport.authenticate('local')` is used as a middleware directly in the route.

*   **Step 2: The "Local" Strategy (`/src/config/passport.js`)**
    Passport now invokes the `LocalStrategy`. This strategy is designed for username/password authentication. Its job is to:
    1.  Extract the `email` and `password` from the request body.
    2.  Find a user in the `Users` database table with the matching email.
    3.  If a user is found, securely compare the submitted password with the **hashed password** stored in the database using `bcrypt.compare`.
    4.  If the passwords match, it calls the `done(null, user)` callback, passing the authenticated `user` object to Passport. If not, it calls `done(null, false, { message: '...' })`.

*   **Step 3: Session Creation & Serialization (`/src/config/passport.js`)**
    When `done(null, user)` is called, Passport knows the authentication was successful. It then triggers `passport.serializeUser`. This function's critical job is to decide **what piece of information to store in the session to identify the user**. To keep the session lightweight, we only store the user's ID.

    ```javascript
    // in passport.js
    passport.serializeUser((user, done) => {
      done(null, user.id); // Only the user's ID is saved in the session.
    });
    ```

*   **Step 4: The Session Store (`/src/config/session.js`)**
    The Express session middleware now saves the session data. In our case, it creates a record in the `sessions` table in the MariaDB database. This record contains the session ID and the serialized user ID from the previous step.

*   **Step 5: The Response and the Cookie**
    Finally, the `auth.controller.js` `login` function runs. It sends a `200 OK` response back to the client. Crucially, Express attaches a `Set-Cookie` header to this response. The cookie contains the **Session ID**, which acts as a key to unlock the session data stored on the server. The browser automatically and securely stores this cookie.

## 3. The Authenticated Request: How the Server Remembers You

Now that the user is logged in, every subsequent API request from the client to the server will "just work." Here’s how the server identifies the user on each of those requests.

*   **Step 1: The Cookie Travels Back**
    With every request to the server's domain, the browser automatically attaches the session cookie to the request headers.

*   **Step 2: The Session Middleware (`/src/app.js`)**
    The `session()` middleware is one of the first to run. It reads the session ID from the cookie, looks it up in the `sessions` database table, and retrieves the corresponding session data (which includes the `user.id` we stored). It attaches this data to the request object, often as `req.session`.

*   **Step 3: Populating the User with `deserializeUser` (`/src/config/passport.js`)**
    Next, the `passport.session()` middleware runs. It takes the `user.id` from the session data and calls `passport.deserializeUser`. This function does the reverse of `serializeUser`: it takes the ID and fetches the **full user object** from the `Users` database table.

    ```javascript
    // in passport.js
    passport.deserializeUser(async (id, done) => {
      try {
        const user = await db.User.findByPk(id); // Fetches the full user from DB.
        done(null, user);
      } catch (error) {
        done(error);
      }
    });
    ```

*   **Step 4: The Magic of `req.user`**
    Passport attaches the fully retrieved user object to the Express request object as `req.user`. This is the single most important step. From this point forward, for the entire lifecycle of this one request, **every downstream middleware and controller can access `req.user`** to know who the currently authenticated user is.

*   **Step 5: The `isAuthenticated` Gatekeeper (`/src/middlewares/auth.middleware.js`)**
    On protected routes, we use our custom `isAuthenticated` middleware. Its job is now incredibly simple: it just checks if `req.user` exists. If it does, the user is authenticated, and the request is allowed to proceed to the controller. If not, it sends a `401 Unauthorized` error.

## 4. Authorization (RBAC) with `hasPermission`

After the server knows *who* the user is, it needs to determine *what* they can do.

The `hasPermission` middleware is the gatekeeper for authorization. You can apply it to a route like this:
`router.delete('/users/:id', isAuthenticated, hasPermission('manage:users'), userController.deleteUser);`

Here’s how it works:
1.  It assumes `isAuthenticated` has already run, so `req.user` is available.
2.  It retrieves the user's roles from `req.user.roles` (e.g., `['admin']`).
3.  It looks up the permissions defined for those roles in the master permissions config file (`/src/config/permissions.js`).
4.  It checks if the required permission (`'manage:users'`) is included in the list of permissions for that user's roles.
5.  If yes, the request continues. If no, it sends a `403 Forbidden` error.

## 5. Client-Side Authentication Management

The client-side logic is centralized in `AuthContext.jsx`.

*   **`AuthContext.jsx`**: This React Context acts as the global provider for authentication state. When the application first loads, it makes an API call to `/api/auth/session` to check if there is an active session and fetches the user data if one exists.
*   **`useAuth()` Hook**: Components across the application use this hook to get the latest authentication state: `const { user, isAuthenticated } = useAuth();`. The hook ensures that any component using it will re-render if the authentication state changes (e.g., after login or logout).
*   **Login/Logout Functions**: The context also provides functions like `login(email, password)` and `logout()`. These functions are responsible for making the API calls to the server's authentication endpoints and updating the context's state based on the response.

## 6. Securing Real-time Connections (Socket.IO)

Socket.IO connections are also protected using the same session mechanism.

1.  When the client initiates a WebSocket connection, the browser automatically sends the session cookie.
2.  On the server, a special Socket.IO middleware is used to share the Express session context with the socket server.
3.  This middleware uses Passport to run the same `deserializeUser` logic, identifying the user from the session and attaching the user object to the `socket.request.user` property.
4.  This allows us to write secure, user-specific real-time logic. For example, we can check `socket.request.user.roles` before allowing a user to `join` a specific room.