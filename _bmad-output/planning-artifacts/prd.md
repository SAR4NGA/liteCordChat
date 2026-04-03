---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ["_bmad-output/planning-artifacts/research/technical-webrtc-p2p-mesh-research-20260402.md", "_bmad-output/brainstorming/brainstorming-session-20260402-0043.md"]
workflowType: 'prd'
briefCount: 0
researchCount: 1
brainstormingCount: 1
projectDocsCount: 0
classification:
  projectType: web_app
  domain: general
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - liteCordChat

**Author:** Sar4n
**Date:** 2026-04-02

## Executive Summary

**liteCordChat** is a high-performance, low-bandwidth voice coordination engine designed for users with limited data quotas and low-end hardware. It provides a "zero-friction, zero-trace" experience by eliminating mandatory accounts and social media bloat, focusing strictly on real-time team communication. By utilizing a WebRTC P2P mesh architecture and an optimized "Mid-Fi" Opus audio profile, the platform enables seamless coordination for up to 5 users without compromising system performance or consuming excessive data.

### Core Value Proposition
- **Performance-First Architecture:** Optimized for low-end PCs and mobile devices, ensuring high-quality voice even during resource-intensive tasks.
- **Data-Sovereign Ephemerality:** Rooms exist entirely in signaling RAM and user memory; no persistent databases or user tracking are involved.
- **Structured Coordination:** Designed specifically for team-based scenarios where standard group calls fail, providing clear audio separation and "Knock-to-Enter" access control.
- **Zero-Friction Entry:** Instant, browser-native access via a single shareable URL.

## Project Classification
- **Project Type:** Web Application (Zero-Install SPA)
- **Domain:** Real-Time Communication / Social Utility
- **Complexity:** Medium (WebRTC P2P Mesh & Stateless Signaling)
- **Project Context:** Greenfield (New Product Development)

## Success Criteria

### User Success
- **Frictionless Entry:** Entry into a voice room within 10 seconds of URL click (no accounts/installs).
- **Audio Clarity:** Clear coordination in 16-24kbps mono environments without robotic artifacts.
- **Privacy Assurance:** Rooms and histories are purged from the universe once the last person leaves.

### Business Success
- **Organic Adoption:** 1,000+ monthly active rooms created through organic sharing within 6 months.
- **Resource Efficiency:** Zero server-side media processing costs; scaling limited only by signaling overhead.
- **Trust Metric:** 100% adherence to the "Zero-Persistence" mandate.

### Measurable Outcomes
- **Latency:** Sub-200ms glass-to-glass latency for 95% of users.
- **Data Consumption:** <15MB of data used per hour of active voice chat.
- **Hardware Impact:** <5% CPU utilization on a 10-year-old reference PC.

## User Journeys

### 1. The "Ghost" Host (The Instant Migration)
**Situation:** Kael's team is lagging in a bloated Discord call during a competitive match.
**Action:** Kael instantly generates a missthediss room and drops the link: *"Move now."*
**Moment of Value:** He clicks **Approve** on each "Knock" and sees his team populate the Lobby with zero lag.
**Resolution:** The team wins the match with stable audio and Kael closes the tab, knowing the room is instantly erased.

### 2. The "Phantom" Guest (The Data Relief)
**Situation:** Amara plays with expensive, metered data and a 10-year-old laptop.
**Action:** She joins the voice room via the link sent by Kael.
**Moment of Value:** She sees the **Live Data Counter** at *12MB/hour* and realizes she can stay on the call all day.
**Resolution:** For the first time, she coordinates fully with her team without game stuttering or data anxiety.

### 3. The "Gatekeeper" Admin (The Spy Defense)
**Situation:** An opposing team scout tries to "Knock" and overhear a tactical split.
**Action:** Kael hits **Deny** and toggles the **"Lock Door"** state.
**Moment of Value:** The room shifts to "Vetted Only" at the signaling layer, securing the strategizing session.
**Resolution:** The team continues in a sealed vault that will vanish the moment they're done.

## Domain-Specific Requirements

### Technical Constraints & Privacy
- **IP Masking:** Mandatory use of **mDNS** to prevent private IP leakage during the ICE handshake.
- **E2EE Enforcement:** Strict **DTLS/SRTP** encryption for all media; signaling acts as a blind relay only.

### Performance & QoS (The "Last Light" UX)
- **Static Fade:** Client implements a purposeful analog-style fade when bandwidth drops below 16kbps, using comfort noise instead of digital cutouts.
- **CPU Optimization:** Dynamic track disabling for non-active speakers to maintain the <5% CPU utilization target.

### Risk Mitigations
- **Firewall Traversal:** Support for **TURN-over-TLS (port 443)** to bypass strict corporate/regional firewalls.
- **Hard-TTL:** Signaling server forcefully purges room state after 10 minutes of inactivity.

## Innovation & Novel Patterns

### Key Innovation Areas
- **"Mid-Fi" Audio Philosophy:** Prioritizing accessibility and data efficiency over high-fidelity-at-all-costs.
- **The "Burn Room" Protocol:** A truly stateless, RAM-only signaling model that eliminates the need for user databases.
- **Analog-Style UX:** Using radio-chatter inspired signal degradation (Static Fade) to provide more intuitive feedback.

## Web App Specific Requirements

### Technical Architecture Considerations
- **Stack:** React-based SPA using **Vite**; initial JS bundle target **<1MB (gzip)**.
- **Browser Matrix:** Support for the latest 2 versions of Evergreen browsers (**Chrome, Firefox, Safari, Edge**).
- **SEO & Privacy:** Mandatory **"no-index" meta tags** and `robots.txt` blocks for all ephemeral room URLs.
- **Mobile First:** Responsive grid layout to support "Phantom" guests joining via mobile browsers.

## Functional Requirements

### Room Management & Gating
- **FR1:** Users can instantly create a temporary voice room without an account.
- **FR2:** Hosts can share a unique URL to invite guests into a specific room.
- **FR3:** Guests can "knock" to request entry into a locked room.
- **FR4:** Hosts can approve or deny "knock" requests in real-time.
- **FR5:** Hosts can toggle a "Lock Room" state to switch between public and vetted entry.
- **FR6:** Admins can trigger a **"One-Click Burn"** to instantly zero the room state.

### Voice Communication (The Utility Engine)
- **FR7:** Participants can communicate via low-latency P2P mono voice.
- **FR8:** Users can toggle local microphone states (Mute/Unmute/PTT).
- **FR9:** System implements randomly generated **Anonymous "Ghost" Avatars** for session identities.
- **FR10:** The system implements a "Static Fade" UX during network congestion.
- **FR11:** Client dynamically disables non-active peer audio tracks.

### Team Coordination (Triptych Layout)
- **FR12:** Every room provides three logical areas: Lobby, Team 1, and Team 2.
- **FR13:** Participants can move themselves between Team areas.
- **FR14:** System segregates audio based on team assignment; Lobby can hear all, but is gated from Teams.

### User Identity & Feedback
- **FR15:** Users can view a real-time "Data Consumed" counter (MB/hour).
- **FR16:** Users can view real-time latency (RTT) and speaker indicators for each peer.

## Non-Functional Requirements

### Performance
- **Latency:** Sub-200ms glass-to-glass for 95% of connections.
- **Data Budget:** Max **15MB/hour** per participant.
- **Resource Efficiency:** **<5% CPU utilization** on low-end hardware.

### Security
- **Zero-Trace:** No persistent storage of any user metadata or message logs.
- **Encryption:** Mandatory **DTLS/SRTP** for all media.
- **Authentication:** Stateless **JWT-based "Knock" protocol** existing only in memory.

## Project Scoping & Phased Development

### Phase 1: MVP (The "Last Light" Launch)
- **Core Goal:** Problem-Solving MVP (Stateless, high-perf voice).
- **Must-Haves:** Zero-Install SPA, Stateless Signaling, Knock Gatekeeper, Triptych Layout, Optimized Opus Voice, Analog Static Fade, Real-time Data Counter.

### Phase 2: Growth
- **Enhanced Utility:** Inter-Admin PTT Backchannel, Spatial Panning (Team vs. Backchannel), Self-Hosted "Ignition" Docker Kit, LocalStorage Room Bookmarks.

### Phase 3: Expansion
- **Scale & Performance:** Hybrid Mesh-Relay (10+ users), Migration to Media over QUIC (MoQ), Mobile Native Wrappers.

---

## Risk Mitigation Strategy
- **Technical:** 5-user CPU "Wall" mitigated by track disabling and VBR.
- **Market:** User inertia mitigated by data benchmarking and privacy-first marketing.
- **Resources:** RTC complexity mitigated by using Simple-Peer/PeerJS abstraction libraries.
