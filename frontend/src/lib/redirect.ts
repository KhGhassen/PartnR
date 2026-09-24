// Login and Register accept ?redirect= so a visitor who lands on a shared
// event link and signs in gets back to that event instead of the home page.
// Accepting the value verbatim would be a classic open redirect, so it is
// reduced to an internal path or dropped.
export function safeRedirect(raw: string | null | undefined, fallback = '/'): string {
  if (!raw) return fallback;
  // Must be a same-origin path: leading slash, but not protocol-relative
  // ("//evil.com") nor the backslash variant browsers normalise the same way.
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  return raw;
}

/** Builds the login URL that brings the user back to `path` afterwards. */
export function loginUrl(path: string): string {
  return `/login?redirect=${encodeURIComponent(path)}`;
}
