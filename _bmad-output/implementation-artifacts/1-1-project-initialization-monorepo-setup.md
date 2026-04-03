# Story 1.1: Project Initialization & Monorepo Setup

Status: complete

## Story

As a developer,
I want to set up the Vite/React frontend and Node.js backend in a monorepo,
so that I can share signaling types between them.

## Acceptance Criteria

1. **Given** a new project directory.
2. **When** I run the initialization scripts for the client, server, and shared folders.
3. **Then** the monorepo structure is established with TypeScript and basic build tools.
4. **Given** the monorepo structure.
5. **When** I define a type in the `shared` folder.
6. **Then** both `client` and `server` can import and use that type.

## Tasks / Subtasks

- [x] Initialize Root Monorepo (AC: 1, 2, 3)
  - [x] Create root `package.json` with npm workspaces (`client`, `server`, `shared`)
  - [x] Initialize root `tsconfig.json` for base configuration
- [x] Initialize Shared Types Package (AC: 4, 5, 6)
  - [x] Create `shared/package.json` and `shared/tsconfig.json`
  - [x] Create `shared/index.ts` for basic type exports
- [x] Initialize Client Package (AC: 1, 2, 3)
  - [x] Scaffold Vite + React + TypeScript + SWC in `client/`
  - [x] Configure `client/tsconfig.json` to reference `shared`
- [x] Initialize Server Package (AC: 1, 2, 3)
  - [x] Initialize Node.js + Express + TypeScript in `server/`
  - [x] Configure `server/tsconfig.json` to reference `shared`
  - [x] Install `socket.io` and `express` dependencies
- [x] Verify Monorepo Integration (AC: 6)
  - [x] Add a dummy type in `shared` and import in `client` and `server`

## Dev Notes

### Architecture Patterns & Constraints
- **Monorepo**: Using npm workspaces to manage `client`, `server`, and `shared`.
- **Technology Stack**: React (Client), Node.js (Server), Socket.io (Signaling), TypeScript (Strict).
- **Styling**: Vanilla CSS (CSS Modules) in the client.
- **Build Tooling**: Vite with SWC for the client.

### Source Tree Components
- `client/`: Frontend application.
- `server/`: Signaling backend.
- `shared/`: Shared types and validation schemas (Zod).

### Testing Standards
- **Client**: Vitest for unit tests.
- **Server**: Vitest for unit tests.

### Project Structure Notes
- Alignment with the structure defined in `architecture.md`.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Zero-Friction Foundation & Basic Voice]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List
- Initialized root monorepo with npm workspaces.
- Created `shared` package for shared types.
- Created `client` package with Vite/React/TS/SWC.
- Created `server` package with Node/Express/TS/Socket.io.
- Successfully ran `npm install`.
- Verified integration by building both `client` and `server` packages.

### File List
- package.json
- tsconfig.json
- shared/package.json
- shared/tsconfig.json
- shared/index.ts
- client/package.json
- client/tsconfig.json
- client/tsconfig.node.json
- client/vite.config.ts
- client/index.html
- client/src/main.tsx
- client/src/App.tsx
- server/package.json
- server/tsconfig.json
- server/src/index.ts
