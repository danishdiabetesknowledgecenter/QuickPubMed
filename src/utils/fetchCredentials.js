export function getFetchCredentialsForUrl(url) {
  if (typeof window === "undefined" || !window.location) {
    return "omit";
  }

  try {
    const requestUrl = new URL(String(url || ""), window.location.href);
    return requestUrl.origin === window.location.origin ? "same-origin" : "omit";
  } catch (_error) {
    return "omit";
  }
}
