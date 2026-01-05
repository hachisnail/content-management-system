# Authentication Guide

This guide explains how the session-based authentication system works in this application.

## Overview

The application uses a traditional session-based authentication system with Passport.js on the server-side. Instead of using JWTs, it relies on session cookies to identify and authenticate users.

## Login Flow

1.  **Client-side:** The user enters their email and password in the login form and clicks "Login".
2.  **API Request:** The client sends a `POST` request to the `/api/auth/login` endpoint with the user's credentials.
3.  **Server-side:**
    *   The server receives the request and uses the "local" strategy in Passport.js to validate the credentials against the database.
    *   If the credentials are valid, a new session is created for the user.
    *   The server stores the session data in the `sessions` table in the database.
    *   The server sends a session cookie back to the client in the response headers. This cookie contains the session ID.
4.  **Client-side:**
    *   The browser automatically stores the session cookie.
    *   The client stores the user object in `localStorage` to keep the user logged in on the client-side between page reloads.

## Session Management

*   **Session Store:** Sessions are stored in the MariaDB database in the `sessions` table. This is managed by the `express-mysql-session` library.
*   **Session Timeout:** The session is configured to expire after one day of inactivity. This can be configured in `server/src/config/session.js`.

## Authenticated Requests

Once the user is logged in, the browser will automatically send the session cookie with every subsequent API request to the server.

To ensure this works correctly, the client-side `fetch` calls must include the `credentials: 'include'` option. This has been configured globally in `client/src/api.js`.

The server uses the `isAuthenticated` middleware to protect routes. This middleware checks for a valid session and will return a 401 Unauthorized error if the user is not authenticated.

## Socket Authentication

The Socket.IO connection is also authenticated using the same session.

1.  **Connection Request:** When the client attempts to connect to the Socket.IO server, it sends the session cookie along with the connection request. This is enabled by the `withCredentials: true` option in `client/src/socket.js`.
2.  **Server-side:** The Socket.IO server uses a middleware to access the session data from the request. It uses the `passport.session()` middleware to deserialize the user from the session and attach it to the `socket.request.user` object.
3.  **Authenticated Socket:** If the session is valid, the `socket.request.user` object will be populated, and the socket will be treated as an authenticated user. Otherwise, it will be treated as a guest.
