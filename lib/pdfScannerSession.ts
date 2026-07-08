type SessionEntry = {
  connected: boolean;
  updatedAt: number;
  images: string[];
};

const sessions = new Map<string, SessionEntry>();

function getOrCreateEntry(sessionId: string): SessionEntry {
  const existing = sessions.get(sessionId);
  if (existing) {
    return existing;
  }

  const entry: SessionEntry = {
    connected: false,
    updatedAt: Date.now(),
    images: [],
  };

  sessions.set(sessionId, entry);
  return entry;
}

export function markSessionConnected(sessionId: string) {
  const entry = getOrCreateEntry(sessionId);
  entry.connected = true;
  entry.updatedAt = Date.now();
  sessions.set(sessionId, entry);
}

export function addSessionImage(sessionId: string, image: string) {
  const entry = getOrCreateEntry(sessionId);
  entry.images.push(image);
  entry.updatedAt = Date.now();
  sessions.set(sessionId, entry);
}

export function getSessionImages(sessionId: string) {
  const entry = sessions.get(sessionId);
  if (!entry) return [];

  return [...entry.images];
}

export function consumeSessionImages(sessionId: string) {
  const entry = sessions.get(sessionId);
  if (!entry || entry.images.length === 0) return [];

  const images = [...entry.images];
  entry.images = [];
  entry.updatedAt = Date.now();
  sessions.set(sessionId, entry);

  return images;
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
  addSessionImage,
  getSessionImages,
  consumeSessionImages,
  isSessionConnected,
  clearSession,
};
