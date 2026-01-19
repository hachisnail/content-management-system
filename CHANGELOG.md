# Changelog

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

## v0.5.1

### Fixes / Improvements
- Updated `scripts/bump-version.js` to improve automation and staging checks.
- Minor internal improvements to versioning workflow.