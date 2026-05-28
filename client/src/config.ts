export const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

// WebRTC ICE servers.
// Built-in TURN relay (Metered Open Relay) ensures cross-ISP / symmetric-NAT
// peers can always connect. Env vars override if a custom TURN server is preferred.
const buildIceServers = (): RTCIceServer[] => {
  const stun: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ];

  // Allow env-var override for custom TURN deployments
  const envTurnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  const turnUrl = envTurnUrl?.trim();
  
  const turnUsername = import.meta.env.VITE_TURN_USERNAME as string | undefined;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;

  const turn: RTCIceServer[] = (turnUrl && turnUrl.length > 0)
    ? [
        {
          urls: turnUrl.split(',').map(s => s.trim()).filter(Boolean),
          username: turnUsername,
          credential: turnCredential,
        }
      ]
    : [
        {
          urls: 'turn:global.relay.metered.com:80',
          username: '042b7eafed0e0c838156f12f',
          credential: 'RTOHU11Okf2QsG5A',
        },
        {
          urls: 'turn:global.relay.metered.com:443',
          username: '042b7eafed0e0c838156f12f',
          credential: 'RTOHU11Okf2QsG5A',
        },
        {
          urls: 'turn:global.relay.metered.com:443?transport=tcp',
          username: '042b7eafed0e0c838156f12f',
          credential: 'RTOHU11Okf2QsG5A',
        },
        {
          urls: 'turns:global.relay.metered.com:443',
          username: '042b7eafed0e0c838156f12f',
          credential: 'RTOHU11Okf2QsG5A',
        }
      ];

  return [...stun, ...turn];
};

export const ICE_SERVERS: RTCIceServer[] = buildIceServers();
