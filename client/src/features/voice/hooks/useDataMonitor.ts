import { useState, useEffect, useRef } from 'react';
import { staticFadeEngine } from '../utils/static-fade';

interface PeerStats {
  latency: number; // ms
  isSpeaking: boolean;
  health: 'good' | 'unstable' | 'poor';
}

interface DataStats {
  totalBytes: number;
  rateKbps: number;      // current bandwidth in kbps
  formatted: string;     // human-readable live rate, e.g. "12.3 KB/s"
  peers: Map<string, PeerStats>;
  localHealth: 'good' | 'unstable' | 'poor';
}

const POLL_INTERVAL_MS = 2000;

export const useDataMonitor = (peerConnections: Map<string, RTCPeerConnection>) => {
  const [stats, setStats] = useState<DataStats>({
    totalBytes: 0,
    rateKbps: 0,
    formatted: '0 KB/s',
    peers: new Map(),
    localHealth: 'good'
  });
  const totalBytesRef = useRef(0);
  const lastUpdateRef = useRef<Map<string, { sent: number, received: number, lost: number }>>(new Map());

  useEffect(() => {
    const interval = setInterval(async () => {
      let sessionDelta = 0;
      const peerStats = new Map<string, PeerStats>();
      let aggregatePoorConnections = 0;

      for (const [peerId, pc] of peerConnections.entries()) {
        if (pc.connectionState !== 'connected') {
          peerStats.set(peerId, { latency: 0, isSpeaking: false, health: 'poor' });
          continue;
        }

        try {
          const reports = await pc.getStats();
          let peerSent = 0;
          let peerReceived = 0;
          let peerLost = 0;
          let latency = 0;
          let jitter = 0;
          let isSpeaking = false;

          reports.forEach(report => {
            if (report.type === 'outbound-rtp' && report.kind === 'audio') {
              peerSent = report.bytesSent || 0;
            }
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              peerReceived = report.bytesReceived || 0;
              peerLost = report.packetsLost || 0;
              jitter = (report.jitter || 0) * 1000; // to ms
              if (report.audioLevel !== undefined) {
                isSpeaking = report.audioLevel > 0.05;
              }
            }
            if (
              report.type === 'candidate-pair' &&
              report.state === 'succeeded' &&
              report.currentRoundTripTime !== undefined
            ) {
              latency = Math.round(report.currentRoundTripTime * 1000);
            }
          });

          const last = lastUpdateRef.current.get(peerId) || { sent: 0, received: 0, lost: 0 };

          if (last.sent > 0) sessionDelta += (peerSent - last.sent);
          if (last.received > 0) sessionDelta += (peerReceived - last.received);

          // Calculate health
          let health: PeerStats['health'] = 'good';
          if (latency > 200 || jitter > 30 || (peerLost - last.lost) > 2) {
            health = 'unstable';
          }
          if (latency > 500 || jitter > 100 || (peerLost - last.lost) > 10) {
            health = 'poor';
            aggregatePoorConnections++;
          }

          lastUpdateRef.current.set(peerId, { sent: peerSent, received: peerReceived, lost: peerLost });
          peerStats.set(peerId, { latency, isSpeaking, health });
        } catch (err) {
          console.error(`[DataMonitor] Error getting stats for ${peerId}:`, err);
        }
      }

      totalBytesRef.current += sessionDelta;

      // Show live rate (bytes transferred this interval / interval duration)
      // rather than a climbing cumulative total. 1 MB after a few minutes is
      // normal for voice — what users actually care about is current throughput.
      const rateBytes = sessionDelta / (POLL_INTERVAL_MS / 1000); // bytes/s
      const rateKbps  = Math.round((rateBytes * 8) / 1000);        // bits/s → kbps
      const rateKBs   = rateBytes / 1024;                           // KB/s for display
      const formatted = rateKBs >= 1
        ? `${rateKBs.toFixed(1)} KB/s`
        : `${Math.round(rateBytes)} B/s`;

      const localHealth =
        aggregatePoorConnections > (peerConnections.size / 2) ? 'poor' :
        aggregatePoorConnections > 0 ? 'unstable' : 'good';

      // Trigger static-fade effect based on connection health
      if (localHealth === 'poor') {
        staticFadeEngine.setFadeLevel(1.0);
      } else if (localHealth === 'unstable') {
        staticFadeEngine.setFadeLevel(0.4);
      } else {
        staticFadeEngine.setFadeLevel(0.0);
      }

      setStats({ totalBytes: totalBytesRef.current, rateKbps, formatted, peers: peerStats, localHealth });
    }, POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      staticFadeEngine.stop();
    };
  }, [peerConnections]);

  return stats;
};
