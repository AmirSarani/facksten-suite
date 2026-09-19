/** Minimal Intel HEX loader for AVR program memory (little-endian words). */
export function loadHex(source: string, target: Uint8Array): void {
  for (const line of source.split(/\r?\n/)) {
    if (!line.startsWith(":")) continue;
    const len = parseInt(line.slice(1, 3), 16);
    const addr = parseInt(line.slice(3, 7), 16);
    const type = parseInt(line.slice(7, 9), 16);
    if (type === 0) {
      for (let i = 0; i < len; i++) {
        const b = parseInt(line.slice(9 + i * 2, 11 + i * 2), 16);
        if (addr + i < target.length) target[addr + i] = b;
      }
    } else if (type === 1) {
      break;
    }
  }
}
