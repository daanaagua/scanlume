const COOKIE_NAME = "scanlume_bid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function readCookie(name: string) {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match?.split("=")[1];
}

function safeLocalStorageGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function createBrowserId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return `scanlume-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateBrowserId() {
  if (typeof window === "undefined") {
    return "server-browser-id";
  }

  const existing = readCookie(COOKIE_NAME) ?? safeLocalStorageGet(COOKIE_NAME);
  if (existing) {
    return existing;
  }

  const generated = createBrowserId();
  safeLocalStorageSet(COOKIE_NAME, generated);
  document.cookie = `${COOKIE_NAME}=${generated}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  return generated;
}
