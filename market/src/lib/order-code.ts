import { randomBytes } from "node:crypto";

// Excludes 0/O and 1/I so a spoken/typed order code can't be misheard.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Random order code, e.g. "FS-7K3QX9PB". Collisions are astronomically unlikely (32^8) but
 * not impossible, so the DB still enforces `Order.code @unique` as the real guard. */
export function generateOrderCode(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < bytes.length; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return `FS-${code}`;
}

export type CodeExists = (code: string) => Promise<boolean>;

/** Draws codes until one is free (checked via `exists`) or `attempts` is exhausted. */
export async function generateUniqueOrderCode(exists: CodeExists, attempts = 5): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const code = generateOrderCode();
    if (!(await exists(code))) return code;
  }
  throw new Error("Could not generate a unique order code after several attempts");
}
