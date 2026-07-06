const sessions = new Map<string, { connected: boolean; updatedAt: number }>();

export function markSessionConnected(sessionId: string) {
  sessions.set(sessionId, { connected: true, updatedAt: Date.now() });
}

export function isSessionConnected(sessionId: string) {
  const entry = sessions.get(sessionId);
  if (!entry) return false;
  // expire after 5 minutes
  if (Date.now() - entry.updatedAt > 1000 * 60 * 5) {
    sessions.delete(sessionId);
    return false;
  }
  return !!entry.connected;
}

export function clearSession(sessionId: string) {
  sessions.delete(sessionId);
}

export default {
  markSessionConnected,
  isSessionConnected,
  clearSession,
};
