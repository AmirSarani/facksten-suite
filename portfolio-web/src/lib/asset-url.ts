const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "/portfolio").replace(/\/$/, "");

/** Root-relative folders served from this app's `public/` or its media route. */
const LOCAL_ASSET = /^\/(covers|avatars|api\/media)\//;

/**
 * Plain <img> tags do not get Next's basePath. DB/seed values are stored as "/covers/...",
 * which 404s when the app is served under /portfolio without nginx mapping them. Prefix
 * local assets only; external, data: and already-prefixed URLs pass through.
 */
export function assetUrl<T extends string | null | undefined>(src: T): T {
  if (typeof src !== "string" || !LOCAL_ASSET.test(src)) return src;
  return `${BASE_PATH}${src}` as T;
}
