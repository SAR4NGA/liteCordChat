# Story 2.5: One-Click "Burn" Room Logic

Status: done

## Story

As a host,
I want to instantly "burn" (delete) the room and disconnect everyone,
so that I can ensure total privacy after a session ends.

## Acceptance Criteria

1. **Given** an active room.
2. **When** the host clicks "Burn Room."
3. **Then** the signaling server deletes the room state from memory immediately.
4. **Then** all connected members are notified and forcefully disconnected/redirected.
5. **Then** the invite link becomes invalid instantly.

## Tasks / Subtasks

- [x] Implement Server-Side "Burn" Logic (AC: 3, 4, 5)
  - [x] Add `burnRoom` method to `RoomManager`
  - [x] Handle `BURN_ROOM` event in signaling handlers
  - [x] Force all sockets in the room to leave and emit `ROOM_BURNED`
- [x] Implement Client-Side Cleanup (AC: 4)
  - [x] Add `burnRoom` action to `useSocketStore`
  - [x] Handle `ROOM_BURNED` event: clear local state and redirect to Home
- [x] Update Host UI (AC: 2)
  - [x] Add a "Burn Room" button in `RoomPage` (with confirmation)
- [x] Verify Instant Deletion (AC: 5)
  - [x] Test burning a room and confirm members are redirected and can't re-join

## Dev Notes

### Architecture Patterns & Constraints
- **Instant Termination**: The server should not just mark the room as inactive but completely remove it from the `Map`.
- **User Experience**: Provide a "Destructive" styling for the Burn button to prevent accidental clicks.

### Source Tree Components
- `server/src/features/rooms/room-manager.ts`: Deletion logic.
- `server/src/features/signaling/handlers.ts`: Disconnect logic.
- `client/src/store/useSocketStore.ts`: Action and cleanup.
- `client/src/App.tsx`: UI button.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#UX-DR4]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5]
