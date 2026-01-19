# Project Versioning & Release Guide

This document defines the **standard operating procedure (SOP)** for managing updates, versioning, and releases for this project.

The goal is to produce **clean, atomic release commits** where:

* Feature work is committed normally
* Releases are represented by a **single, authoritative snapshot commit + tag**

---

## 1. Semantic Versioning (SemVer)

We follow **Semantic Versioning** using the format:

```
MAJOR.MINOR.PATCH
```

| Type      | Format  | When to Use                                                            | Example         |
| --------- | ------- | ---------------------------------------------------------------------- | --------------- |
| **PATCH** | `x.x.1` | Bug fixes, performance improvements, or small tweaks. No new features. | `1.0.0 → 1.0.1` |
| **MINOR** | `x.1.x` | New features that are backward compatible.                             | `1.0.1 → 1.1.0` |
| **MAJOR** | `1.x.x` | Breaking changes, major refactors, API or DB changes.                  | `1.1.0 → 2.0.0` |

---

## 2. Release Philosophy: “Release Snapshot”

This project uses a **Release Snapshot** model.

A release is defined by:

* One **release commit**
* One **Git tag**

⚠️ **Important distinction**

Feature work and release metadata are **separate concerns**.

### Feature commits

* Implement functionality
* Fix bugs
* Refactor code
* May span multiple commits

### Release commits

* Update version numbers
* Update `CHANGELOG.md`
* Create an immutable Git tag
* Do **not** include feature code

---

## 3. Standard Release Workflow (Two-Phase Model)

### Phase 1: Feature Development

1. Implement features and fixes
2. Commit changes normally

Example:

```bash
git add .
git commit -m "feat: implement file management system"
```

Repeat as needed until the release is ready.

---

### Phase 2: Release Snapshot (Version Bump)

Once **all feature commits are complete**, create the release snapshot.

---

### Step 1: Ensure a Clean Working Tree

The bump script **requires**:

* No unstaged changes
* No uncommitted feature code

```bash
git status
```

---

### Step 2: Update the Changelog

Edit `CHANGELOG.md` and add a new section for the release.

Example:

```md
## v0.5.0

### Features
- File uploading, serving, and access control
- User profile management

### Fixes
- Fixed realtime sync race conditions
- Improved RBAC enforcement
```

Save the file.

---

### Step 3: Run the Version Bump Script

The bump script will:

1. Update version numbers in:

   * `server/src/config/env.js`
   * `client/src/config.js`
2. Append the release entry to `CHANGELOG.md`
3. Commit **only**:

   * Version files
   * Changelog
4. Create a Git tag (`vX.Y.Z`)

**Command syntax**

```bash
npm run bump -- <VERSION> "<RELEASE_DESCRIPTION>"
```

**Example**

```bash
npm run bump -- 0.5.0 "File management, RBAC fixes, and UI improvements"
```

---

### Step 4: Push the Release (Final Step)

The script commits and tags **locally**.

Push both:

```bash
git push && git push --tags
```

This completes the release.

---

## 4. Handling Major Releases (Breaking Changes)

Major releases may include:

* Database schema changes
* API breaking changes
* Behavior-altering refactors

### Major Release Checklist

* Database backup strategy confirmed
* Migration or reset behavior documented
* README updated if setup changes
* Breaking changes clearly documented in:

  * `CHANGELOG.md`
  * Release commit message

**Example**

```bash
npm run bump -- 1.0.0 "OFFICIAL RELEASE: Full system overhaul with RBAC and soft delete support"
git push && git push --tags
```

---

## 5. Troubleshooting

### “The script refuses to run”

**Cause:** Uncommitted or unstaged feature changes exist.

**Fix:**

```bash
git add .
git commit -m "feat: finalize changes for release"
```

Then rerun the bump script.

---

### “I used the wrong version number”

```bash
git tag -d v0.5.0
git reset --soft HEAD~1
npm run bump -- <CORRECT_VERSION> "<DESCRIPTION>"
git push && git push --tags
```

---

## 6. Summary

* Feature code is committed **before** releases
* The bump script commits **release metadata only**
* One release equals:

  * One commit
  * One tag
* Git tags are the single source of truth for releases

This workflow guarantees:

* Clean Git history
* Safe rollbacks
* Professional release tracking
