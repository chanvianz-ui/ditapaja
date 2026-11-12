import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "ditapaja",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    compatibilityFlags: ["global_fetch_strictly_public"],
    observability: {
      enabled: true,
      logs: {
        enabled: true,
      },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
      SUPABASE_SECRET_KEY: bindings.secret(),
      ADMIN_USER_ID: bindings.secret(),
    },
    unsafe: {
      metadata: {
        services: [
          {
            binding: "WORKER_SELF_REFERENCE",
            service: "ditapaja",
            environment: "production",
          },
        ],
      },
    },
  }),
});
