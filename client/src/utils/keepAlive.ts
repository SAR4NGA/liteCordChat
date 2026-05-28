/**
 * Prevents Render's free-tier web service from sleeping by pinging /health
 * every 10 minutes. Only runs in production builds — no-ops in dev.
 *
 * Render spins down free services after 15 minutes of inactivity.
 * This keeps the signaling server warm so peers don't hit a 30-60 s cold start.
 */
export function startKeepAlive(serverUrl: string): void {
  if (import.meta.env.DEV) return;

  const ping = () =>
    fetch(`${serverUrl}/health`, { method: 'GET' }).catch(() => {
      // Intentionally silent — a failed ping is not critical
    });

  // Ping immediately on load, then every 10 minutes
  ping();
  setInterval(ping, 10 * 60 * 1000);
}
