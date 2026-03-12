const COOKIE_NAME = "scanlume_bid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

function readCookie(name: string) {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match?.split("=")[1];
}

export function getOrCreateBrowserId() {
  if (typeof window === "undefined") {
    return "server-browser-id";
  }

  const existing = readCookie(COOKIE_NAME) ?? window.localStorage.getItem(COOKIE_NAME);
  if (existing) {
    return existing;
  }

  const generated = crypto.randomUUID();
  window.localStorage.setItem(COOKIE_NAME, generated);
  document.cookie = `${COOKIE_NAME}=${generated}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  return generated;
}
