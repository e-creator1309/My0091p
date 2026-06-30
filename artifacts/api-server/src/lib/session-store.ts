import { randomUUID } from "crypto";

interface Session {
  cookies: Record<string, string>;
  username: string;
  createdAt: number;
  lastUsed: number;
}

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Map<string, Session>();

// Cleanup expired sessions every 30 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [token, session] of sessions) {
      if (now - session.lastUsed > SESSION_TTL_MS) {
        sessions.delete(token);
      }
    }
  },
  30 * 60 * 1000,
);

export function createSession(
  cookies: Record<string, string>,
  username: string,
): string {
  const token = randomUUID();
  const now = Date.now();
  sessions.set(token, { cookies, username, createdAt: now, lastUsed: now });
  return token;
}

export function getSession(token: string): Session | undefined {
  const session = sessions.get(token);
  if (!session) return undefined;
  if (Date.now() - session.lastUsed > SESSION_TTL_MS) {
    sessions.delete(token);
    return undefined;
  }
  session.lastUsed = Date.now();
  return session;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}
