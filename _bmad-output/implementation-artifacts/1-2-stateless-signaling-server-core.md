# Story 1.2: Stateless Signaling Server Core

Status: done

## Story

As a user,
I want to create a temporary voice room instantly,
so that I can start a session without an account.

## Acceptance Criteria

1. **Given** a running signaling server.
2. **When** a client sends a `create_room` request.
3. **Then** the server generates a unique room ID and stores it in its in-memory Map.
4. **Given** an existing room ID.
5. **When** a client sends a `join_room` request with that ID.
6. **Then** the server adds the user to the room's member list in RAM.
7. **Given** a room with members.
8. **When** a member disconnects.
9. **Then** the server removes them from the in-memory Map and notifies remaining members.

## Tasks / Subtasks

- [x] Implement Room State Management (AC: 3, 6, 9)
  - [x] Create a `RoomManager` class using a Node.js `Map` to store room state in RAM
  - [x] Define the `Room` and `User` interfaces in the server feature
- [x] Implement Socket.io Event Handlers (AC: 2, 5, 8)
  - [x] Handle `create_room` event: generate UUID, create room state, emit `room_created`
  - [x] Handle `join_room` event: validate room existence, add user, notify others
  - [x] Handle `disconnect` event: remove user from rooms, cleanup empty rooms
- [x] Add Zod Validation for Payloads (AC: 2, 5)
  - [x] Define schemas for create/join requests in the `shared` package
  - [x] Implement middleware or helper to validate incoming socket data
- [x] Verify Stateless Logic (AC: 3, 6, 9)
  - [x] Write Vitest integration tests for room lifecycle (Create -> Join -> Disconnect)

## Dev Notes

### Architecture Patterns & Constraints
- **Statelessness**: No persistent database. All state must reside in the Node.js process RAM.
- **Privacy**: No user metadata should be stored beyond the active session.
- **Performance**: Room lookups in the `Map` should be O(1).

### Source Tree Components
- `server/src/features/rooms/`: Room management logic.
- `server/src/features/signaling/`: Socket.io event handlers.
- `shared/validation.ts`: Zod schemas for signaling data.

### Testing Standards
- **Server**: Integration tests using `socket.io-client` to simulate peer behavior.

### Project Structure Notes
- Adheres to the Feature-First structure defined in `architecture.md`.

### References
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- [Source: _bmad-output/planning-artifacts/epics.md#Epic 1: Zero-Friction Foundation & Basic Voice]

## Dev Agent Record

### Agent Model Used

Gemini 2.0 Flash

### Debug Log References

### Completion Notes List

### File List
