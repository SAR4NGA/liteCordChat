# Story 2.1: Shareable Invite URL Generation

Status: done

## Story

As a host,
I want to share a unique URL with my team,
so that they can find and join my specific room.

## Acceptance Criteria

1. **Given** an active room.
2. **When** I view the room details.
3. **Then** I see a unique invite URL (e.g., `/join/{roomId}`).
4. **When** I click a "Copy" button.
5. **Then** the URL is copied to my clipboard.
6. **When** a guest opens the invite URL.
7. **Then** the app parses the `roomId` and prompts them to join that specific room.

## Tasks / Subtasks

- [x] Implement Routing with React Router (AC: 6, 7)
  - [x] Set up `BrowserRouter` in `main.tsx`
  - [x] Define routes for `/` (Home/Create) and `/join/:roomId` (Join)
- [x] Implement Invite URL UI (AC: 3, 4, 5)
  - [x] Create a "Copy Invite Link" component
  - [x] Use the `navigator.clipboard` API for copying
- [x] Handle Deep-Linking (AC: 7)
  - [x] Extract `roomId` from URL parameters on the Join page
  - [x] Pre-fill the room ID input for the guest
- [x] Verify Invite Flow (AC: 3, 6)
  - [x] Manually test creating a room and joining via a generated link in a new tab

## Dev Notes

### Architecture Patterns & Constraints
- **Routing**: Use `react-router-dom` v7 (as found in package.json).
- **URL Structure**: `/join/:roomId` is the standard for invites.

### Source Tree Components
- `client/src/main.tsx`: Router setup.
- `client/src/App.tsx`: Refactor into components and routes.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1]
