import react from "@vitejs/plugin-react-swc";
import * as dotenv from "dotenv";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import {
  API_ROUTES,
  BASENAME,
  PORT,
  PROXY_TARGET,
} from "./src/customization/config-constants";

export default defineConfig(({ mode }) => {
  // načtení .env
  const env = loadEnv(mode, process.cwd(), "");
  const envLangflowResult = dotenv.config({
    path: path.resolve(__dirname, "../../.env"),
  });
  const envLangflow = envLangflowResult.parsed || {};

  // výchozí cesty API
  const apiRoutes = API_ROUTES || ["^/api/v1/", "^/api/v2/", "/health"];
  const target =
    env.VITE_PROXY_TARGET || PROXY_TARGET || "http://127.0.0.1:7860";
  const port = Number(env.VITE_PORT) || PORT || 3000;

  // generování proxy pro stávající API cesty
  const proxyTargets = apiRoutes.reduce((proxyObj, route) => {
    proxyObj[route] = {
      target,
      changeOrigin: true,
      secure: false,
      ws: true,
    };
    return proxyObj;
  }, {} as Record<string, any>);

  return {
    base: BASENAME || "",
    build: {
      outDir: "build",
    },
    define: {
      "process.env.BACKEND_URL": JSON.stringify(
        envLangflow.BACKEND_URL ?? "http://127.0.0.1:7860"
      ),
      "process.env.ACCESS_TOKEN_EXPIRE_SECONDS": JSON.stringify(
        envLangflow.ACCESS_TOKEN_EXPIRE_SECONDS ?? 60
      ),
      "process.env.CI": JSON.stringify(envLangflow.CI ?? false),
      "process.env.LANGFLOW_AUTO_LOGIN": JSON.stringify(
        envLangflow.LANGFLOW_AUTO_LOGIN ?? true
      ),
    },
    plugins: [react(), svgr(), tsconfigPaths()],
    server: {
      port,
      proxy: {
        // Speciální pravidlo: vše /api/v1/* přesměruj na /api/relay
        "/api/v1": {
          target,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => "/api/relay",
          configure: (proxy) => {
            // přepíšeme request tak, aby do těla doplnil flowId
            proxy.on("proxyReq", (proxyReq, req) => {
              try {
                const originalBody: any = (req as any).body || {};
                const flowId = new URLSearchParams((req.url || "")).get("flow") || "chat1";
                const newBody = JSON.stringify({
                  flowId,
                  ...originalBody,
                });
                proxyReq.setHeader("content-type", "application/json");
                proxyReq.setHeader("content-length", Buffer.byteLength(newBody));
                proxyReq.write(newBody);
                proxyReq.end();
              } catch (e) {
                console.warn("Failed to rewrite proxy body", e);
              }
            });
          },
        },
        // ostatní API cesty
        ...proxyTargets,
      },
    },
  };
});

