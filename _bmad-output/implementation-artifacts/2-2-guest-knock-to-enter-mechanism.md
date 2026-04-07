# Story 2.2: Guest "Knock-to-Enter" Mechanism

Status: done

## Story

As a guest,
I want to "knock" to request entry into a room,
so that I can wait for the host's approval.

## Acceptance Criteria

1. **Given** a guest on a room landing page (Join Invite page).
2. **When** they enter their name and click "Knock."
3. **Then** a `knock_request` is sent to the signaling server.
4. **Given** a host in that room.
5. **When** a guest knocks.
6. **Then** the host receives a `knock_received` event and sees the guest's name and avatar in a notification or list.

## Tasks / Subtasks

- [x] Define Knock Signaling Protocol (AC: 3, 6)
  - [x] Add `KNOCK_REQUEST` and `KNOCK_RECEIVED` to `SOCKET_EVENTS`
  - [x] Define Zod schema for knock payloads
- [x] Implement Server-Side Relay (AC: 3, 6)
  - [x] Handle `KNOCK_REQUEST` by finding the room host and emitting `KNOCK_RECEIVED` to them
- [x] Implement Guest "Knock" UI (AC: 2)
  - [x] Update `JoinInvite` component with a "Knock" button state
  - [x] Show a "Waiting for approval..." message after knocking
- [x] Implement Host "Knock" Notification (AC: 6)
  - [x] Update `RoomPage` to display a list of pending knock requests
- [x] Verify Knock Flow (AC: 3, 6)
  - [x] Test knocking from one tab and receiving it in the host's tab

## Dev Notes

### Architecture Patterns & Constraints
- **Security**: For now, this is a simple relay. Story 2.3 will add JWT-based formal approval.
- **State**: Pending knocks should be stored in the host's client state or relayed live. If the host refreshes, pending knocks might be lost (acceptable for MVP as per "Stateless" constraint).

### Source Tree Components
- `shared/index.ts`: New events/schemas.
- `server/src/features/signaling/handlers.ts`: Relay logic.
- `client/src/App.tsx`: UI for guest and host.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2]
