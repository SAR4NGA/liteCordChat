# Story 4.4: Dynamic Audio Track Management

Status: done

## Story

As a user on a strict data budget,
I want the app to stop sending/receiving audio for peers in different areas,
so that I can save maximum bandwidth while still remaining in the mesh.

## Acceptance Criteria

1. **Given** two users in different areas.
2. **When** they are not in the same area.
3. **Then** the WebRTC transceiver for that peer is set to `inactive` (or `sendonly`/`recvonly` as appropriate).
4. **When** they move into the same area.
5. **Then** the transceiver is reactivated to `sendrecv`.

## Tasks / Subtasks

- [x] Implement Dynamic Transceiver Management (AC: 3, 5)
  - [x] Update `useWebRTC` to manage transceiver directions based on `roomArea`
  - [x] Trigger renegotiation when directions change
- [x] Optimize Bandwidth (AC: 3)
  - [x] Verify that data consumption drops significantly when in different areas
- [x] Verify Seamless Resumption (AC: 5)
  - [x] Confirm audio resumes instantly when moving back into the same area

## Dev Notes

### Architecture Patterns & Constraints
- **Transceivers**: Use `RTCRtpTransceiver.direction` to stop the flow of data without closing the connection.
- **Renegotiation**: Changing direction usually requires a new offer/answer exchange (Perfect Negotiation handles this).

### Source Tree Components
- `client/src/hooks/useWebRTC.ts`: Direction logic.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.4]
