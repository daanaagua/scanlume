const USAGE_REFRESH_EVENT = "scanlume:usage-refresh";

export function announceUsageRefresh() {
  window.dispatchEvent(new CustomEvent(USAGE_REFRESH_EVENT));
}

export function subscribeUsageRefresh(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(USAGE_REFRESH_EVENT, handler);
  return () => window.removeEventListener(USAGE_REFRESH_EVENT, handler);
}

export { USAGE_REFRESH_EVENT };
