# Story 1.4: Mic Controls & Anonymous Avatars

Status: done

## Story

As a participant,
I want to control my microphone and see my session identity,
so that I can manage my presence in the room.

## Acceptance Criteria

1. **Given** an active voice session.
2. **When** I toggle my mute state or join the room.
3. **Then** my microphone responds accordingly and I am assigned a random "Ghost" avatar.

## Tasks / Subtasks

- [x] Implement Anonymous Avatar Generation (AC: 3)
  - [x] Create a utility to generate random "Ghost" avatars (colors/shapes or simple icons)
  - [x] Assign avatar during room creation/join
- [x] Implement Microphone Controls (AC: 2, 3)
  - [x] Add "Mute/Unmute" toggle functionality
  - [x] Sync mute state with signaling server (notify others)
- [x] Update UI with Session Identity (AC: 3)
  - [x] Display local user's avatar and name
  - [x] Display mute status for all peers in the room
- [x] Verify Mic & Avatar Logic (AC: 3)
  - [x] Confirm mute state affects local track and is visible to others
  - [x] Confirm avatars are randomly generated and persist for the session

## Dev Notes

### Architecture Patterns & Constraints
- **Privacy**: No real names or faces; use generated "Ghost" identities.
- **State Sync**: Use Socket.io to broadcast mute state changes to all peers in the room.

### Source Tree Components
- `client/src/utils/avatars.ts`: Avatar generation logic.
- `client/src/hooks/useMediaStream.ts`: Update to support muting.
- `client/src/App.tsx`: UI updates for controls and identity.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#UX-DR3]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
