# Story 3.1: Triptych UI Layout Implementation

Status: done

## Story

As a participant,
I want to see three distinct areas (Lobby, Team 1, Team 2) within a room,
so that I can understand the spatial layout of the session.

## Acceptance Criteria

1. **Given** an active room session.
2. **When** the room page loads.
3. **Then** I see three side-by-side columns: "Lobby", "Team 1", and "Team 2".
4. **Given** the member list.
5. **Then** members are grouped visually under the area they are currently in.
6. **When** I click a "Join" or "Move" button on a different area.
7. **Then** my `roomArea` state is updated on the server and synced to all peers.

## Tasks / Subtasks

- [x] Implement Triptych CSS Layout (AC: 3)
  - [x] Create a 3-column responsive flex/grid layout in `RoomPage`
  - [x] Add headers for each area (Lobby, Team 1, Team 2)
- [x] Implement Area-Based Member Rendering (AC: 5)
  - [x] Filter and render users within their respective area columns
- [x] Implement Area Navigation Logic (AC: 6, 7)
  - [x] Add "Move Here" buttons to each column (excluding the current one)
  - [x] Connect buttons to `moveArea` action in `useSocketStore`
- [x] Verify Spatial Layout (AC: 3, 5)
  - [x] Confirm members move between columns in real-time across multiple tabs

## Dev Notes

### Architecture Patterns & Constraints
- **Spatial UX**: This layout is the foundation for the "Scoped Audio" logic in Story 3.3.
- **Styling**: Use Vanilla CSS or basic inline styles for the 3-column layout.

### Source Tree Components
- `client/src/App.tsx`: Refactor `RoomPage` rendering.
- `client/src/store/useSocketStore.ts`: Ensure `moveArea` is correctly handled (already implemented in Epic 1/2, but needs validation).

### References
- [Source: _bmad-output/planning-artifacts/prd.md#UX-DR1]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1]
