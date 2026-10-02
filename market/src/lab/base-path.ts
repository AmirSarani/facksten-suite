/** Shop is mounted at /pushrsp — prefix absolute fetch URLs for nginx. */
export const LAB_BASE_PATH =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_BASE_PATH?.trim()) ||
  "/pushrsp";

export function withBasePath(path: string): string {
  if (!path.startsWith("/")) return path;
  if (path.startsWith(LAB_BASE_PATH + "/") || path === LAB_BASE_PATH) return path;
  return `${LAB_BASE_PATH}${path}`;
}
