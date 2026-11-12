# DiTapAja — Migrasi Cloudflare Workers

Status: Vinext compatibility check and both framework builds passed on `main`. Cloudflare Workers build is configured for Vinext; deployment remains intentionally paused until runtime variables and smoke tests are ready. DNS has not been changed.

## Working model

- GitHub default branch and only active development branch: `main`.
- Cloudflare Worker: `ditapaja`, connected to `chanvianz-ui/ditapaja` on `main`.
- Vercel remains available as a fallback during migration.
- The existing `next dev`, `next build`, and `next start` scripts remain available.
- Vinext uses separate namespaced scripts: `dev:vinext`, `build:vinext`, `start:vinext`, and `deploy:vinext`.

## Compatibility audit

The `vinext check` report completed successfully:

- 100% compatible: 9 supported checks, 0 partial, 0 issues.
- App Router detected: 27 pages, 1 layout, and 10 route handlers.
- Imports detected by the checker: `next/navigation`, `next/server`, and `next/link`.
- Repository app source audit found no use of `next/image`, ISR/revalidation APIs, or `"use cache"`.
- Initial Cloudflare cache/image choices: no custom CDN cache, no data cache, no Cloudflare Images optimizer.
- Generated `.cloudflare/types` are not included in the shared Next.js `tsconfig` yet because this app does not import Cloudflare Worker bindings directly; including those globals changes the existing `Response.json()` type from the standard DOM type to `unknown` across the legacy Next.js client pages. Add a separate Cloudflare-specific type-check config if application code later imports `cloudflare:workers`.

Compatibility checks do not replace runtime tests. Authentication, order/payment proof uploads, admin operations, card creation, and public NFC routes still need smoke tests on the Worker URL.

## Target architecture

- Next.js App Router source remains in `app/`.
- Vinext runs the app on Vite and Cloudflare Workers.
- Cloudflare Vite plugin v2 beta and the `cf` CLI are used; do not run `wrangler setup` or `npx wrangler deploy` for this project.
- Supabase remains the Auth, Postgres, Storage, and RLS backend.
- First deployment target is the Worker URL; custom domains and DNS stay unchanged until explicit cutover approval.

## Cloudflare build state

- Git source is `main`.
- Workers Builds production build command is `npm run build:vinext`; the latest Cloudflare build completed successfully.
- Workers Builds deploy command is intentionally a no-op placeholder until smoke tests pass; do not replace it with `npm run deploy:vinext` yet.
- Worker Preview builds are disabled to keep this one-branch migration workflow simple.
- GitHub Actions currently passes `vinext check`, `npm run build:vinext`, and the existing `npm run build` on Node.js 22.
- Build-time public Supabase variables currently point to Supabase Staging for testing.
- Do not put Supabase secret keys in build variables.
- Runtime server variables/secrets still need separate configuration before testing server-side admin/payment-proof flows:
  - `SUPABASE_SECRET_KEY` — runtime Secret for the selected Supabase environment.
  - `ADMIN_USER_ID` — runtime variable for the selected admin account.
- Never commit `.env` files or secret values.

## Safe migration sequence

1. Keep Vercel and its domains unchanged.
2. Run compatibility and both framework builds in GitHub Actions.
3. Configure Cloudflare Builds to use `npm run build:vinext` and `npm run deploy:vinext` only after CI is green.
4. Configure runtime variables/secrets for the intended Supabase environment.
5. Deploy and smoke-test the Worker URL: public landing pages, registration/login, dashboard, NFC card creation and tracking, order creation/history, payment proof upload/verification, and admin pages.
6. Resolve any route/runtime or binding issues before assigning a custom domain.
7. Plan DNS/domain cutover only after the Worker passes the full test flow. Keep Vercel ready for rollback.

## Rollback

- Keep the current Vercel project and its Production deployment intact.
- Do not change nameservers, Cloudflare zone records, or Vercel domains during the compatibility/build phase.
- If a Worker release fails smoke testing, leave the domain on Vercel and fix or roll back the Worker independently.
