# Story 4.3: Static Fade UX During Congestion

Status: done

## Story

As a user,
I want to be visually warned when my connection or a peer's connection is unstable,
so that I understand why audio might be cutting out.

## Acceptance Criteria

1. **Given** an active voice session.
2. **When** a peer's packet loss or jitter exceeds a certain threshold.
3. **Then** a "Static" warning icon (or fade effect) appears on their member card.
4. **When** my own connection is unstable.
5. **Then** I see a global "Network Unstable" warning.

## Tasks / Subtasks

- [x] Implement Network Health Monitoring (AC: 2, 4)
  - [x] Update `useDataMonitor` to retrieve `packetsLost` and `jitter` from `inbound-rtp` stats
  - [x] Calculate a "health score" for each peer connection
- [x] Implement Health Feedback UI (AC: 3, 5)
  - [x] Display a "low quality" icon when health is poor
  - [x] Add a global warning for the local user if their aggregate connection health is low
- [x] Implement Comfort Noise (Static Fade) (AC: 3)
  - [x] Create `StaticFadeEngine` using Web Audio API to generate white noise
  - [x] Mix noise into local output when health is unstable/poor
- [x] Verify Congestion UX (AC: 3, 5)
  - [x] Confirm indicators and static noise appear based on health score

## Dev Notes

### Architecture Patterns & Constraints
- **Thresholds**: 
  - Jitter > 30ms = Warning
  - Packet Loss > 5% = Critical
- **UX**: Use a "Static" icon (lightning bolt or broken signal) to match the "Ghost" aesthetic.
- **Audio**: Web Audio API generates procedural white noise for "Static Fade".

### Source Tree Components
- `client/src/features/voice/hooks/useDataMonitor.ts`: Stats tracking and engine trigger.
- `client/src/features/voice/utils/static-fade.ts`: Web Audio white noise engine.
- `client/src/features/triptych/components/RoomPage.tsx`: UI indicators.

### References
- [Source: _bmad-output/planning-artifacts/prd.md#UX-DR2]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]
