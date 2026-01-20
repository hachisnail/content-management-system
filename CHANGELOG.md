# Changelog

## v0.6.0

### Features
- **New Public Layout:** Still a WIP
- **Domain Modules:** Added scaffolding for Articles, Inventory (Object Entry/Accessioning), and Appointments.
- **WIP States:** Added standardized "Work in Progress" views for upcoming features.

### Refactor & Technical
- **Domain-Driven Design (DDD):** Migrated entire client codebase from `pages/` to `features/` directory structure.
- **Routing Architecture:** Centralized route configuration with barrel file imports and "Best Match" active state logic.
- **Auth Scoping:** Optimized `App.jsx` to apply Context Providers only where necessary (Public vs. Auth scopes).
- **Cleanup:** Renamed `LoginTest` to `LoginPage` and removed legacy development pages.

## v0.5.2

### Bug Fixes & Improvements
- **Socket Stability:** Fixed multiple race conditions and null-reference errors in the real-time socket handling (`socket.js`). Added checks to ensure `socket.user` exists before being accessed during connection, subscription, activity pings, and disconnection events. This resolves a critical issue causing server crashes when user sessions were terminated or expired.
- **Client Refactor:** Refactored client-side component architecture for improved maintainability and code clarity.

## v0.5.1

### Fixes / Improvements
- Updated `scripts/bump-version.js` to improve automation and staging checks.
- Minor internal improvements to versioning workflow.

## v0.5.0

### Features
- File Management: Implemented a comprehensive file handling system, including file uploading, serving, and access control.
- User Management: Users can now manage their profiles, including changing their name, contact information, role, and password.

### Bug Fixes & Improvements

#### UI/UX
- Added styling to the unauthorized message for file access.
- Added loading spinners to data tables to improve user experience and reduce UI flickering.

#### Real-time & RBAC
- Addressed connection issues in the useRealtimeResource hook.
- Fixed a race condition in the Users Dashboard that caused syncing problems with real-time updates.
- Conducted further testing and refinement of the Role-Based Access Control (RBAC) system.
