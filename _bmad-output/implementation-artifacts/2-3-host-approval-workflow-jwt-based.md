# Story 2.3: Host Approval Workflow (JWT-based)

Status: done

## Story

As a host,
I want to approve or deny "knock" requests,
so that I can control who enters the voice room.

## Acceptance Criteria

1. **Given** an incoming `knock_received` event.
2. **When** I click "Approve."
3. **Then** the server issues a signed JWT to the guest.
4. **When** the guest receives the `knock_approved` event with the JWT.
5. **Then** the guest uses that JWT to successfully `join_room`.
6. **When** I click "Deny."
7. **Then** the guest receives a `knock_denied` event.

## Tasks / Subtasks

- [x] Implement JWT Infrastructure (AC: 3, 5)
  - [x] Install `jsonwebtoken` on the server
  - [x] Define a `JWT_SECRET` (environment variable)
- [x] Implement Server-Side Approval (AC: 3, 7)
  - [x] Handle `KNOCK_APPROVE` event: verify host status, sign JWT with `roomId` and `userName`, emit `KNOCK_APPROVED` to guest
  - [x] Handle `KNOCK_DENY` event: emit `KNOCK_DENIED` to guest
- [x] Update Join Logic for JWT (AC: 5)
  - [x] Update `join_room` handler to optionally require/verify a JWT if the room is locked (or for all joins if using this as the primary security layer)
- [x] Implement Host UI for Approval (AC: 2, 6)
  - [x] Add `approveKnock` and `denyKnock` actions to `useSocketStore`
  - [x] Connect buttons in `RoomPage` to these actions
- [x] Implement Guest UI for Result (AC: 4, 7)
  - [x] Handle `KNOCK_APPROVED` and `KNOCK_DENIED` in `useSocketStore`
  - [x] Automatically trigger `joinRoom` with the received JWT upon approval
- [x] Verify Secure Entry (AC: 3, 5)
  - [x] Test the full loop: Knock -> Approve -> JWT Issued -> Auto Join

## Dev Notes

### Architecture Patterns & Constraints
- **Statelessness**: The server doesn't store the JWTs. Verification is done via the secret.
- **Security**: The JWT should contain the `roomId` and `userName` to prevent token reuse for different rooms/users.

### Source Tree Components
- `server/src/features/signaling/handlers.ts`: Approval/Deny logic and JWT issuance.
- `client/src/store/useSocketStore.ts`: Handling approval/denial events.
- `client/src/App.tsx`: UI interactions.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Protocol]
