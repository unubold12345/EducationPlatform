/**
 * The native mobile app (a separate project, `educationplatform-mobile`) has no browser origin. It names its
 * deep-link scheme in an `expo-origin` header instead, the convention of Better Auth's Expo plugin.
 *
 * This does not weaken the same-origin check for browsers: a web page always sends its own `Origin` on a
 * state-changing request and cannot remove it, and its origin is never a custom scheme. So a request with no
 * `Origin` at all and a trusted `expo-origin` can only come from a non-browser client, where the session
 * cookie is attached on purpose rather than by the browser.
 */
export const MOBILE_APP_SCHEME = "educationplatform://";
// Expo Go's development scheme; trusted only by a development server, as the Expo plugin itself does.
const DEVELOPMENT_SCHEME = "exp://";

export function mobileOrigins(env: Record<string, string | undefined> = process.env): string[] {
  return env.NODE_ENV === "development" ? [MOBILE_APP_SCHEME, DEVELOPMENT_SCHEME] : [MOBILE_APP_SCHEME];
}

/** True for a native-app request: no browser `Origin`, and an `expo-origin` that is one of the app's schemes. */
export function fromMobileApp(headers: Headers, env: Record<string, string | undefined> = process.env): boolean {
  if (headers.get("origin") !== null) return false;
  const named = headers.get("expo-origin");
  return !!named && mobileOrigins(env).some(scheme => named.startsWith(scheme));
}
