import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Connect, type Plugin } from "vite";

const BASE = "/portfolio-admin/";

/** Opening the bare origin (localhost:5174/) redirects to the base instead of Vite's "did you mean" page. */
function redirectRootToBase(): Plugin {
  const redirect: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(302, { Location: BASE });
      res.end();
      return;
    }
    next();
  };
  return {
    name: "redirect-root-to-base",
    configureServer: (server) => void server.middlewares.use(redirect),
    configurePreviewServer: (server) => void server.middlewares.use(redirect),
  };
}

export default defineConfig({
  base: BASE,
  plugins: [redirectRootToBase(), react(), tailwindcss()],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
  },
});
