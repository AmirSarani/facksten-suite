/** Local SVG placeholders — no remote image fetch / next image optimizer */
export function productImage(seed: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="#f4f3f3"/>
  <rect x="80" y="80" width="480" height="480" rx="32" fill="#eeeeee"/>
  <circle cx="320" cy="280" r="72" fill="#ff7a00" opacity="0.25"/>
  <text x="320" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#584235">${label.replace(/[<>&]/g, "")}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function articleImage(title: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#f4f3f3"/><stop offset="1" stop-color="#e8e8e8"/>
  </linearGradient></defs>
  <rect width="960" height="540" fill="url(#g)"/>
  <rect x="60" y="60" width="840" height="420" rx="24" fill="#fff" stroke="#e0c0af"/>
  <text x="480" y="290" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" fill="#1a1c1c">${title.slice(0, 40).replace(/[<>&]/g, "")}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
