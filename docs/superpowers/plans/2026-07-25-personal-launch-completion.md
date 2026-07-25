# Personal Launch Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining work needed to use CREAMi Deluxe personally on a phone and desktop, without adding unnecessary production-grade infrastructure.

**Architecture:** Keep the existing Vite/React/TanStack Query/Supabase architecture. Close correctness gaps in the current feature code, add a generated service worker and IndexedDB-backed Query persistence, and reuse the existing toast and shell components for update/offline feedback.

**Tech Stack:** React 18, TypeScript, TanStack Query 5, Supabase, Vite PWA, Workbox, IndexedDB, Vitest.

---

### Task 1: Close Existing Correctness Gaps

**Files:**
- Modify: `src/lib/api/export.ts`
- Modify: `src/lib/api/bases.ts`
- Modify: `src/features/reference/pages/BaseEditPage.tsx`
- Modify: `src/lib/api/batches.ts`
- Modify: `src/features/freezer/hooks/useCreateTastingNote.ts`
- Modify: `src/features/recipes/hooks/useToggleFavourite.ts`
- Modify: `src/features/freezer/components/RecipeInsights.tsx`
- Test: adjacent `*.test.ts` and `*.test.tsx` files

- [x] **Step 1: Add failing tests for each reported gap**

Cover complete export table inclusion, fill-ingredient updates during base edits, trigger-owned `ready_at`, recipe-list invalidation after tasting notes, detail-cache optimistic favouriting, and the three-batch insight threshold.

- [x] **Step 2: Run focused tests and verify failures**

Run: `npm.cmd test -- <test files>`

Expected: each new assertion fails for the audited behaviour.

- [x] **Step 3: Implement minimal fixes**

Use the existing API/hook boundaries. Keep writes narrow, preserve optimistic rollback, and never send `ready_at` from the client.

- [x] **Step 4: Run focused and full checks**

Run: `npm.cmd test && npm.cmd run lint && npm.cmd run typecheck`

Expected: all checks pass.

### Task 2: Add Installable PWA Shell

**Files:**
- Modify: `vite.config.ts`
- Modify: `src/main.tsx`
- Modify: `src/app/ToastProvider.tsx` only if required by the existing toast API
- Create: `src/app/PwaUpdatePrompt.tsx`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`
- Create: `public/icon-maskable-512.png`
- Create: `public/apple-touch-icon.png`
- Modify: `tsconfig.app.json`
- Test: `src/app/PwaUpdatePrompt.test.tsx`

- [x] **Step 1: Write the update-prompt component test**

Assert that `needRefresh` presents a “New version available” message and that the reload action calls `updateServiceWorker(true)`.

- [x] **Step 2: Configure `VitePWA`**

Use `registerType: 'prompt'`, the manifest from `docs/09-pwa-offline.md`, and `CacheFirst` runtime caching only for Google Fonts.

- [x] **Step 3: Generate required icons**

Use the existing berry-and-white-C visual language. Keep generous maskable safe-zone padding.

- [x] **Step 4: Register and display update state**

Use `virtual:pwa-register/react`; do not auto-update while a form may be open.

- [x] **Step 5: Verify production artefacts**

Run: `npm.cmd run build`

Expected: `dist/manifest.webmanifest`, service worker files, and all four icons exist.

### Task 3: Add Pragmatic Offline Support

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/app/providers.tsx`
- Create: `src/lib/query-persister.ts`
- Create: `src/lib/online-status.ts`
- Create: `src/components/OfflineBanner.tsx`
- Modify: `src/app/layout/AppShell.tsx`
- Modify: allowed offline mutation hooks for favourites, checks, extras, spun and finished
- Modify: recipe editing and batch logging entry points
- Test: `src/lib/query-persister.test.ts`
- Test: `src/components/OfflineBanner.test.tsx`

- [x] **Step 1: Add persistence dependencies**

Install pinned compatible versions of `@tanstack/react-query-persist-client` and `idb-keyval`.

- [x] **Step 2: Write persistence and banner tests**

Assert IndexedDB persister get/set/delete behaviour, online-manager subscription, offline text, and pending mutation count.

- [x] **Step 3: Persist the Query cache**

Use `PersistQueryClientProvider`, 30-day `maxAge`, matching query `gcTime`, and package version as the cache buster. Resume paused mutations after restore and reconnect.

- [x] **Step 4: Register only permitted mutation defaults**

Allow absolute-value mutations for favourite, checks, extras, spun and finished. Do not queue recipe edits or new batches.

- [x] **Step 5: Add offline UI**

Show “Offline — showing saved recipes”, pending-change count, and clear explanations on blocked edit/add/log actions.

- [x] **Step 6: Run automated checks**

Run: `npm.cmd test && npm.cmd run lint && npm.cmd run typecheck && npm.cmd run build`

Expected: all automated checks pass.

### Task 4: Finish Launch Documentation

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `docs/10-task-backlog.md` only to record current completion/deferment

- [x] **Step 1: Replace the stale project-status section**

State that Tasks 1–43 are implemented, Task 44 needs household nutrition labels, and install/offline/deployment status reflects this run.

- [x] **Step 2: Add exact Windows launch instructions**

Document `npm.cmd ci`, the two Supabase variables, `npm.cmd run dev`, and phone LAN testing with `--host 0.0.0.0`.

- [x] **Step 3: Document one-time Supabase actions**

Create one email/password household user, disable public signup, and retain RLS. Mention that publishable keys are client-safe but service-role keys are forbidden.

- [x] **Step 4: Document human-only calibration**

List the four labels required for Task 44 and explain that the app is usable before calibration.

### Task 5: Verify And Launch

**Files:**
- Verify: repository root
- Verify: hosted Supabase project `creami-deluxe`
- Verify: Netlify configuration

- [x] **Step 1: Run the complete automated suite**

Run: `npm.cmd test && npm.cmd run lint && npm.cmd run typecheck && npm.cmd run build`

Expected: tests pass, lint has no errors, typecheck passes, and initial JS remains below 200 KB gzipped.

- [x] **Step 2: Run the app against hosted Supabase**

Run: `npm.cmd run dev -- --host 127.0.0.1`

Expected: login renders and authenticated recipe data loads after the household user is created.

- [x] **Step 3: Test anonymous access**

Query base tables and both public views with only the publishable key.

Expected: zero recipe rows.

- [ ] **Step 4: Perform browser PWA checks**

Verify manifest, service worker registration, offline hard reload, cached recipe reading, font caching, pending-mutation sync, and blocked unsafe actions.

- [ ] **Step 5: Deploy when credentials permit**

Use existing `netlify.toml`, set the two Vite environment variables, deploy `dist`, and verify a deep-link refresh.

- [x] **Step 6: Record unavoidable manual checks**

Real iPhone/Android installation, cupboard calibration, and the final phone acceptance journeys remain manual evidence rather than code blockers.
