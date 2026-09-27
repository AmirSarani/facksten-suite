import { withBasePath } from "@/lab/base-path";

/** Root-relative folders served from this app's `public/` (or its /uploads route). */
const LOCAL_ASSET = /^\/(images|uploads|downloads|placeholder\.svg)(\/|$|\.)/;

/**
 * Plain <img>/<source> tags do not get Next's basePath. DB/seed values are stored as
 * "/images/...", which 404s when the app is served under /facksten without nginx mapping
 * them. Prefix local assets only; external, data: and already-prefixed URLs pass through.
 */
export function assetUrl<T extends string | null | undefined>(src: T): T {
  if (typeof src !== "string" || !LOCAL_ASSET.test(src)) return src;
  return withBasePath(src) as T;
}
