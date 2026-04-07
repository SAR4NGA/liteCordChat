/**
 * sessionStore — thin wrapper around sessionStorage for persisting room
 * context across browser refreshes within the same tab.
 *
 * Why sessionStorage (not localStorage)?
 *  - sessionStorage is cleared when the tab closes → matches the app's
 *    "zero-trace, ephemeral" philosophy perfectly.
 *  - Opening a link in a new tab gets a fresh session, which is correct.
 */

const KEY = 'litecord_session';

export interface SessionData {
  roomId: string;
  userName: string;
  avatar: string;
  token?: string; // JWT for locked rooms
}

export const sessionStore = {
  save(data: SessionData): void {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // storage quota or private-mode restriction — silently ignore
    }
  },

  load(): SessionData | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SessionData) : null;
    } catch {
      return null;
    }
  },

  clear(): void {
    sessionStorage.removeItem(KEY);
  },
};
