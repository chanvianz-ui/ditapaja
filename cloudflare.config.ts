import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "ditapaja",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      SUPABASE_SECRET_KEY: bindings.secret(),
      ADMIN_USER_ID: bindings.secret(),
    },
  }),
});
