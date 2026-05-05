export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// WebRTC ICE servers. STUN-only is sufficient when both peers are on networks
// that allow direct UDP between them, but it cannot traverse symmetric NATs
// (common on mobile carriers, corporate firewalls, double-NAT home routers).
// For those cases a TURN relay is required — configure via env:
//   VITE_TURN_URL=turn:turn.example.com:3478,turns:turn.example.com:5349
//   VITE_TURN_USERNAME=...
//   VITE_TURN_CREDENTIAL=...
const buildIceServers = (): RTCIceServer[] => {
  const stun: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ];

  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

  if (!turnUrl) {
    console.info(
      '[config] No TURN server configured (VITE_TURN_URL). Peers behind ' +
      'symmetric NATs will fail to connect. Set VITE_TURN_URL/VITE_TURN_USERNAME/' +
      'VITE_TURN_CREDENTIAL to enable relay fallback.'
    );
    return stun;
  }

  return [
    ...stun,
    {
      urls: turnUrl.split(',').map(s => s.trim()).filter(Boolean),
      username: turnUsername,
      credential: turnCredential,
    },
  ];
};

export const ICE_SERVERS: RTCIceServer[] = buildIceServers();
