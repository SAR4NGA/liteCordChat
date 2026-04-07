# Story 2.4: Room Locking Controls

Status: done

## Story

As a host,
I want to toggle a "Lock Room" state,
so that I can switch between public access and vetted entry.

## Acceptance Criteria

1. **Given** an open room.
2. **When** I toggle the lock state to "Locked."
3. **Then** the signaling server updates the room state in memory.
4. **Given** a locked room.
5. **When** a new guest attempts to `join_room` without a JWT.
6. **Then** the server rejects the request.
7. **When** the host toggles back to "Unlocked."
8. **Then** new guests can join directly again.

## Tasks / Subtasks

- [x] Implement Server-Side Lock Logic (AC: 3, 6, 8)
  - [x] Add `toggleLock` method to `RoomManager`
  - [x] Handle `TOGGLE_LOCK` event in signaling handlers
  - [x] Ensure `JOIN_ROOM` strictly enforces the `isLocked` check (requires JWT if locked)
- [x] Implement Client-Side State Sync (AC: 3, 8)
  - [x] Add `toggleLock` action to `useSocketStore`
  - [x] Handle `LOCK_TOGGLED` event to update local room state
- [x] Update Host UI (AC: 2, 7)
  - [x] Add a Lock/Unlock button in `RoomPage` visible only to the host
  - [x] Show a visual indicator of the room's current lock status
- [x] Verify Enforcement (AC: 5, 6)
  - [x] Test that direct join fails when locked
  - [x] Test that direct join succeeds when unlocked

## Dev Notes

### Architecture Patterns & Constraints
- **State Propagation**: When the lock state changes, all members in the room should be notified so their UI can reflect the status.

### Source Tree Components
- `server/src/features/rooms/room-manager.ts`: State management.
- `server/src/features/signaling/handlers.ts`: Event handling.
- `client/src/store/useSocketStore.ts`: Action and listener.
- `client/src/App.tsx`: UI toggle.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4]
