# Story 3.3: Scoped Audio Segregation Logic

Status: done

## Story

As a participant,
I want to only hear people who are in the same area as me,
so that we can have focused team conversations without global noise.

## Acceptance Criteria

1. **Given** two users in different areas (e.g., User A in Team 1, User B in Lobby).
2. **When** User A speaks.
3. **Then** User B hears nothing.
4. **When** User B moves into Team 1.
5. **Then** User B can immediately hear User A.

## Tasks / Subtasks

- [x] Implement Scoped Muting Logic (AC: 3, 5)
  - [x] Update the audio rendering logic in `RoomPage` to check peer `roomArea`
  - [x] Enable/Disable remote audio tracks based on area matching
- [x] Implement Real-Time Area Sync (AC: 5)
  - [x] Ensure that when any user moves, all other users recalculate their audio output for that user
- [x] Verify Audio Isolation (AC: 1, 3, 5)
  - [x] Test moving between areas and confirm the "✨" (speaking) or audio indicators only trigger for same-area peers (or logic-wise confirm tracks are disabled)

## Dev Notes

### Architecture Patterns & Constraints
- **Client-Side Filtering**: Since we are using a full mesh P2P network, every peer receives every other peer's audio. We enforce "privacy" by muting/unmuting the remote tracks on the receiver's side based on the `roomArea` metadata.
- **Performance**: Use React's `useEffect` to reactively update track states when `room.members` or `currentUser.roomArea` changes.

### Source Tree Components
- `client/src/App.tsx`: Audio rendering loop update.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#UX-DR1]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3]
