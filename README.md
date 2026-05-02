# liteCordChat

**liteCordChat** is a high-performance, low-bandwidth voice coordination engine designed for users with limited data quotas and low-end hardware. It provides a "zero-friction, zero-trace" experience by eliminating mandatory accounts and social media bloat, focusing strictly on real-time team communication.

By utilizing a WebRTC P2P mesh architecture and an optimized "Mid-Fi" Opus audio profile, the platform enables seamless coordination for up to 5 users without compromising system performance or consuming excessive data.

## Features

- **Performance-First Architecture:** Optimized for low-end PCs and mobile devices, ensuring high-quality voice even during resource-intensive tasks.
- **Data-Sovereign Ephemerality:** Rooms exist entirely in signaling RAM and user memory; no persistent databases or user tracking are involved.
- **Structured Coordination:** Designed specifically for team-based scenarios where standard group calls fail, providing clear audio separation and "Knock-to-Enter" access control.
- **Zero-Friction Entry:** Instant, browser-native access via a single shareable URL.
- **Live Data Counter:** Real-time indicator of data consumed (e.g., MB/hour).
- **Static Fade UX:** Purposeful analog-style fade when bandwidth drops, using comfort noise instead of digital cutouts.
- **Triptych Layout:** Logical room areas including Lobby, Team 1, and Team 2, with scoped audio segregation.

## Project Structure

This project is a monorepo setup containing the following workspaces:
- `client/`: React-based single-page application (SPA) using Vite.
- `server/`: Node.js stateless signaling server.
- `shared/`: Shared types and utilities across client and server.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

1. Clone the repository and navigate to the project root:
   ```bash
   git clone <repository-url>
   cd liteCordChat
   ```
2. Install dependencies for all workspaces:
   ```bash
   npm install
   ```

### Running Locally

You can run the client and server using the provided npm scripts from the root directory:

- Start the development client:
  ```bash
  npm run dev:client
  ```
- Start the development server:
  ```bash
  npm run dev:server
  ```

## Roadmap

- **Text Chat Space (Planned):** A dedicated text-based chat space to complement the voice coordination engine, allowing for easy link sharing and text communication during active sessions.
- **Inter-Admin PTT Backchannel:** Allowing hosts/admins to communicate privately.
- **Self-Hosted "Ignition" Docker Kit:** Easy deployment for private servers.

## License

*(Add your license information here)*
