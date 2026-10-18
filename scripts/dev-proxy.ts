/**
 * Local stand-in for the server's nginx: serves the whole suite on one origin
 * so cross-app links and cookies behave like production.
 *
 *   node scripts/dev-proxy.ts        → http://localhost:8080
 *
 * Expects the three dev servers on their usual ports (3010, 3020, 5174).
 */
import http from "node:http";
import net from "node:net";

const PORT = Number(process.env.PROXY_PORT ?? 8080);
const MARKET = 3010;
const PORTFOLIO_WEB = 3020;
const PORTFOLIO_ADMIN = 5174;

/** Same order of precedence as the nginx locations (longest prefix first). */
const ROUTES: Array<[prefix: string, port: number]> = [
  ["/portfolio-admin", PORTFOLIO_ADMIN],
  ["/portfolio", PORTFOLIO_WEB],
  ["/covers/", PORTFOLIO_WEB],
  ["/avatars/", PORTFOLIO_WEB],
  ["/pushrsp", MARKET],
  ["/images/", MARKET],
  ["/downloads/", MARKET],
  ["/favicon.ico", MARKET],
];

function targetPort(url: string): number | null {
  const path = url.split("?")[0];
  for (const [prefix, port] of ROUTES) {
    if (path === prefix || path.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`) || path.startsWith(`${prefix}?`)) {
      return port;
    }
  }
  return null;
}

/** nginx serves /images/... from the shop's public dir; Next serves it under the basePath. */
function upstreamPath(url: string, port: number): string {
  if (port === MARKET && (url.startsWith("/images/") || url.startsWith("/downloads/") || url === "/favicon.ico")) return `/pushrsp${url}`;
  if (port === PORTFOLIO_WEB && (url.startsWith("/covers/") || url.startsWith("/avatars/"))) return `/portfolio${url}`;
  return url;
}

const server = http.createServer((req, res) => {
  const url = req.url ?? "/";
  if (url === "/" || url === "/portfolio/fa" || url.startsWith("/portfolio/fa/")) {
    const to = url === "/" ? "/pushrsp" : url.replace("/portfolio/fa", "/portfolio") || "/portfolio";
    res.writeHead(302, { Location: to });
    res.end();
    return;
  }
  const port = targetPort(url);
  if (port === null) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not routed. Try /pushrsp, /portfolio or /portfolio-admin/");
    return;
  }
  const upstream = http.request(
    {
      host: "127.0.0.1",
      port,
      method: req.method,
      path: upstreamPath(url, port),
      headers: { ...req.headers, "x-forwarded-proto": "http", "x-forwarded-host": req.headers.host ?? "" },
    },
    (up) => {
      res.writeHead(up.statusCode ?? 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on("error", (err) => {
    if (!res.headersSent) res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(`Upstream :${port} unavailable (${err.message}). Is its dev server running?`);
  });
  req.pipe(upstream);
});

// HMR websockets (Next + Vite).
server.on("upgrade", (req, socket, head) => {
  const port = targetPort(req.url ?? "/");
  if (port === null) return socket.destroy();
  const up = net.connect(port, "127.0.0.1", () => {
    const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
    for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
    up.write(`${lines.join("\r\n")}\r\n\r\n`);
    if (head.length) up.write(head);
    socket.pipe(up).pipe(socket);
  });
  up.on("error", () => socket.destroy());
  socket.on("error", () => up.destroy());
});

server.listen(PORT, () => {
  console.log(`PushRSP suite on http://localhost:${PORT}  (/pushrsp, /portfolio, /portfolio-admin/)`);
});
