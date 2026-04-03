---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/architecture.md", "_bmad-output/planning-artifacts/research/technical-webrtc-p2p-mesh-research-20260402.md"]
status: 'complete'
completedAt: '2026-04-03'
---

# liteCordChat - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for liteCordChat, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can instantly create a temporary voice room without an account.
FR2: Hosts can share a unique URL to invite guests into a specific room.
FR3: Guests can "knock" to request entry into a locked room.
FR4: Hosts can approve or deny "knock" requests in real-time.
FR5: Hosts can toggle a "Lock Room" state to switch between public and vetted entry.
FR6: Admins can trigger a "One-Click Burn" to instantly zero the room state.
FR7: Participants can communicate via low-latency P2P mono voice.
FR8: Users can toggle local microphone states (Mute/Unmute/PTT).
FR9: System implements randomly generated Anonymous "Ghost" Avatars for session identities.
FR10: The system implements a "Static Fade" UX during network congestion.
FR11: Client dynamically disables non-active peer audio tracks.
FR12: Every room provides three logical areas: Lobby, Team 1, and Team 2.
FR13: Participants can move themselves between Team areas.
FR14: System segregates audio based on team assignment; Lobby can hear all, but is gated from Teams.
FR15: Users can view a real-time "Data Consumed" counter (MB/hour).
FR16: Users can view real-time latency (RTT) and speaker indicators for each peer.

### NonFunctional Requirements

NFR1: Latency: Sub-200ms glass-to-glass for 95% of connections.
NFR2: Data Budget: Max 15MB/hour per participant.
NFR3: Resource Efficiency: <5% CPU utilization on low-end hardware.

### Additional Requirements

- Monorepo Setup: Shared Types between Client (React) and Server (Node.js).
- Stateless Signaling: In-Memory Map state, no database.
- JWT-based "Knock" Protocol: Tokenization for host approvals.
- WebRTC "Perfect Negotiation": Resolution of glare in mesh setup.
- Scoped Socket.io Rooms: Segregation of Lobby and Team signaling.
- CoTURN Infrastructure: Self-hosted NAT traversal over TLS (Port 443).

### UX Design Requirements

UX-DR1: Triptych Layout implementation (Lobby, Team 1, Team 2).
UX-DR2: Live Data Counter UI (MB/hour).
UX-DR3: Anonymous "Ghost" Avatar generation.
UX-DR4: "Static Fade" Analog-style audio degradation UI feedback.
UX-DR5: Responsive grid layout for mobile browsers.

### FR Coverage Map

FR1: Epic 1 - Room Creation (Basic)
FR2: Epic 2 - Invite URLs
FR3: Epic 2 - Guest Knocking
FR4: Epic 2 - Host Approval (JWT)
FR5: Epic 2 - Room Locking
FR6: Epic 2 - Room Burning (Stateless)
FR7: Epic 1 - P2P Mono Voice
FR8: Epic 1 - Mic Controls
FR9: Epic 1 - Anonymous Avatars
FR10: Epic 4 - Static Fade UX
FR11: Epic 4 - Active Track Management
FR12: Epic 3 - Triptych Layout
FR13: Epic 3 - Room Hopping
FR14: Epic 3 - Audio Segregation
FR15: Epic 4 - Live Data Counter
FR16: Epic 4 - QoS Indicators (RTT)

## Epic List

### Epic 1: Zero-Friction Foundation & Basic Voice
Establish the monorepo, stateless signaling server, and a basic 1-on-1 P2P voice connection using the "Perfect Negotiation" pattern.
**FRs covered:** FR1, FR7, FR8, FR9

### Epic 2: The "Gatekeeper" Protocol
Implement the "Knock-to-Enter" security flow, JWT-based host approvals, and room locking/burning.
**FRs covered:** FR2, FR3, FR4, FR5, FR6

### Epic 3: Triptych Team Coordination
Create the three-room layout (Lobby, Team 1, Team 2) and implement audio segregation/switching logic.
**FRs covered:** FR12, FR13, FR14

### Epic 4: "Last Light" Utility & QoS Feedback
Implement real-time data consumption tracking, latency indicators, and the "Static Fade" UX for low-bandwidth environments.
**FRs covered:** FR10, FR11, FR15, FR16

## Epic 1: Zero-Friction Foundation & Basic Voice
Establish the monorepo, stateless signaling server, and a basic 1-on-1 P2P voice connection using the "Perfect Negotiation" pattern.

### Story 1.1: Project Initialization & Monorepo Setup
As a developer,
I want to set up the Vite/React frontend and Node.js backend in a monorepo,
So that I can share signaling types between them.

**Acceptance Criteria:**
**Given** a new project directory.
**When** I run the initialization scripts for the client, server, and shared folders.
**Then** the monorepo structure is established with TypeScript and basic build tools.

### Story 1.2: Stateless Signaling Server Core
As a user,
I want to create a temporary voice room instantly,
So that I can start a session without an account.

**Acceptance Criteria:**
**Given** a running signaling server.
**When** a client sends a create_room request.
**Then** the server generates a unique room ID and stores it in its in-memory Map.

### Story 1.3: P2P Voice Handshake (Perfect Negotiation)
As a participant,
I want to connect directly to another user via WebRTC,
So that we can communicate with minimal latency.

**Acceptance Criteria:**
**Given** two users in the same signaling room.
**When** they exchange SDP offers/answers using the "Polite/Impolite" pattern.
**Then** a stable P2P data and audio connection is established.

### Story 1.4: Mic Controls & Anonymous Avatars
As a participant,
I want to control my microphone and see my session identity,
So that I can manage my presence in the room.

**Acceptance Criteria:**
**Given** an active voice session.
**When** I toggle my mute state or join the room.
**Then** my microphone responds accordingly and I am assigned a random "Ghost" avatar.

## Epic 2: The "Gatekeeper" Protocol
Implement the "Knock-to-Enter" security flow, JWT-based host approvals, and room locking/burning.

### Story 2.1: Shareable Invite URL Generation
As a host,
I want to share a unique URL with my team,
So that they can find and join my specific room.

**Acceptance Criteria:**
**Given** an active room.
**When** I copy the invite link from the UI.
**Then** the URL contains the room's unique ID for guest navigation.

### Story 2.2: Guest "Knock-to-Enter" Mechanism
As a guest,
I want to "knock" to request entry into a room,
So that I can wait for the host's approval.

**Acceptance Criteria:**
**Given** a guest on a room landing page.
**When** they enter their name and click "Knock."
**Then** a knock_request is sent to the signaling server and displayed to the host.

### Story 2.3: Host Approval Workflow (JWT-based)
As a host,
I want to approve or deny "knock" requests,
So that I can control who enters the voice room.

**Acceptance Criteria:**
**Given** an incoming knock_request.
**When** I click "Approve."
**Then** the server issues a signed JWT to the guest, allowing them to join the P2P mesh.

### Story 2.4: Room Locking Controls
As a host,
I want to toggle a "Lock Room" state,
So that I can switch between public access and vetted entry.

**Acceptance Criteria:**
**Given** an open room.
**When** I toggle the lock state to "Locked."
**Then** the signaling server rejects new direct joins and requires "Knocking" for all subsequent guests.

### Story 2.5: One-Click "Burn" Room Logic
As an admin,
I want to trigger a "One-Click Burn,"
So that I can instantly zero the room state and disconnect all participants.

**Acceptance Criteria:**
**Given** an active session.
**When** I click the "Burn" button.
**Then** the signaling server purges the room from its Map and forces all sockets to disconnect.

## Epic 3: Triptych Team Coordination
Create the three-room layout (Lobby, Team 1, Team 2) and implement audio segregation/switching logic.

### Story 3.1: Triptych UI Layout Implementation
As a user,
I want to see a three-column "Triptych" layout,
So that I can clearly distinguish between the Lobby, Team 1, and Team 2.

**Acceptance Criteria:**
**Given** a joined voice room.
**When** the main room view loads.
**Then** I see three distinct areas for Lobby, Team 1, and Team 2 as per the UX design.

### Story 3.2: Room-to-Room Navigation (Hopping)
As a participant,
I want to move myself between the Lobby and Team areas,
So that I can coordinate with different groups.

**Acceptance Criteria:**
**Given** I am in the Lobby.
**When** I click to join "Team 1."
**Then** my client sends a move_request to the server and my local UI updates to reflect my new location.

### Story 3.3: Scoped Audio Segregation Logic
As a team member,
I want to only hear my teammates while in a Team area,
So that our tactical discussions remain private.

**Acceptance Criteria:**
**Given** I am in "Team 1."
**When** someone in "Team 2" speaks.
**Then** I do not hear their audio, and my client does not receive their signaling data for that stream.
**And** if I am in the "Lobby," I can hear everyone (unless they are gated).

## Epic 4: "Last Light" Utility & QoS Feedback
Implement real-time data consumption tracking, latency indicators, and the "Static Fade" UX for low-bandwidth environments.

### Story 4.1: Live Data Consumption Counter
As a user,
I want to see a live "Data Consumed" counter (MB/hour),
So that I can monitor my bandwidth usage in real-time.

**Acceptance Criteria:**
**Given** an active voice session.
**When** I speak or receive audio.
**Then** the UI updates a counter reflecting the estimated megabytes per hour consumed.

### Story 4.2: Real-time QoS Indicators (Latency/Speaker)
As a participant,
I want to see real-time latency (RTT) and speaker indicators for each peer,
So that I can understand the quality of our connection.

**Acceptance Criteria:**
**Given** an active connection.
**When** I hover over or view a peer's avatar.
**Then** I see their current round-trip time (RTT) and a visual indicator when they are speaking.

### Story 4.3: "Static Fade" UX during Congestion
As a user with a poor connection,
I want to experience a "Static Fade" UX instead of digital cutouts,
So that I can intuitively understand when my bandwidth is dropping.

**Acceptance Criteria:**
**Given** an active voice session.
**When** the available bandwidth drops below 16kbps.
**Then** the client introduces comfort noise (static) and an analog-style visual fade to signal the degradation.

### Story 4.4: Dynamic Audio Track Management
As a participant on a low-end device,
I want the client to dynamically disable non-active peer audio tracks,
So that I can minimize my CPU and data usage.

**Acceptance Criteria:**
**Given** a room with multiple participants.
**When** a participant is not speaking.
**Then** the client pauses their remote audio track to save resources, reactivating it instantly when they start talking.
