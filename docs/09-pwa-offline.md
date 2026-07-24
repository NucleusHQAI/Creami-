# 09 — Installable app and offline

Phone-first means kitchen, and kitchens have patchy signal. Supermarkets are worse.

Build this **last**. Every task here is additive and none of the features depend on it. Adding a service worker early to an app still under construction produces a week of "why am I seeing the old version".

## Scope, honestly stated

| Capability | Supported |
|---|---|
| Install to home screen | Yes |
| Read recipes offline | Yes, fully |
| Read the shopping list offline | Yes |
| Tick shopping items offline | Yes, queued |
| Favourite offline | Yes, queued |
| Mark a batch spun or finished offline | Yes, queued |
| Create or edit a recipe offline | **No** — blocked, with an explanation |
| Log a new batch offline | **No** — blocked |

The split is deliberate. Queued mutations are safe when they are small, idempotent and unlikely to conflict — a tick, a heart, a status change. Recipe editing involves a multi-row write with delete-then-insert semantics, and replaying that from a queue after an unknown delay is a genuinely hard problem for a feature two people will use approximately never. Blocking it with a clear message is the right trade.

## Installability

`vite-plugin-pwa` in `generateSW` mode.

```ts
VitePWA({
  registerType: 'prompt',
  includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
  manifest: {
    name: 'CREAMi Deluxe Recipe Book',
    short_name: 'CREAMi',
    description: 'Protein ice cream recipes for the Ninja CREAMi Deluxe',
    theme_color: '#fffaf2',
    background_color: '#fffaf2',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
})
```

`registerType: 'prompt'`, not `autoUpdate` — show a "New version available, reload" toast and let the person decide. Silently swapping the bundle under someone mid-edit loses their work.

Icons: the berry circle with a white "C", matching the wordmark. A maskable variant is required or Android crops it badly.

## Caching

**App shell** — precached by Workbox. Standard, and the plugin handles it.

**Google Fonts** — `CacheFirst`, one year. Without this the app renders in Times New Roman offline, which looks broken even though it works.

**Supabase API responses** — do *not* cache these in the service worker. Two caching layers over the same data disagree with each other in ways that are miserable to debug. Data offline is handled by persisting the Query cache instead.

## Data offline

TanStack Query's persistence, into IndexedDB via `idb-keyval`.

```ts
const persister = createAsyncStoragePersister({
  storage: { getItem, setItem, removeItem },   // idb-keyval
  key: 'creami-query-cache',
  throttleTime: 1000,
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 30,   // 30 days
  buster: APP_VERSION,                 // bump to discard on schema change
})
```

`buster` matters. When the shape of the data changes, a stale cached response deserialises into something the components cannot render, and the app white-screens offline with no obvious cause. Tie it to the app version and it clears itself.

Do not persist auth state through this — the Supabase client already manages the session in `localStorage`.

## The mutation outbox

Queued writes for the three allowed offline mutations.

TanStack Query has `onlineManager` and mutation resumption built in, and it handles this well enough that writing a custom queue is not justified.

```ts
// Mutations that may be queued must be registered with a mutation key
queryClient.setMutationDefaults(['toggleFavourite'], {
  mutationFn: toggleFavourite,
  retry: 3,
})
```

Then `persistQueryClient` persists paused mutations, and `queryClient.resumePausedMutations()` on reconnect replays them.

Rules:

- Only `toggleFavourite`, `setCheck`, `toggleExtra`, `markSpun` and `markFinished` are registered this way. Nothing else may be queued.
- Every one is idempotent — they set an absolute value, never increment. Replaying twice is harmless.
- On reconnect, resume, then invalidate everything.
- Conflicts do not need resolving. Last write wins, and with two people in one household the odds of a genuine collision are negligible.

## Offline UI

**A connection banner.** When offline, a persistent strip below the top bar: "Offline — showing saved recipes". Berry background, not alarming red. Being offline is normal.

**Pending count.** When mutations are queued: "3 changes will sync when you're back online".

**Blocked actions.** Disable "Add recipe", "Edit" and "Log a batch" while offline, with an explanatory tooltip rather than a silent failure. A disabled button with no reason given is worse than an error.

**Stale data age.** Where cached data is over 24 hours old, say so quietly: "Last updated 2 days ago."

```ts
const isOnline = useSyncExternalStore(
  (cb) => onlineManager.subscribe(cb),
  () => onlineManager.isOnline(),
)
```

`navigator.onLine` is not sufficient by itself — it reports true for a connected wifi network with no route to the internet, which is exactly what a phone at the edge of range looks like.

## Testing it

Manual, and it must actually be done:

1. Load the app, browse a few recipes.
2. Chrome DevTools → Network → Offline.
3. Recipes still readable, images and fonts still present.
4. Tick shopping items, favourite something. Both respond instantly.
5. "3 changes will sync" appears.
6. Back online. Changes reach the database. Banner clears.
7. Hard-reload while offline. The app still boots from the precached shell.
8. On a real phone: install to home screen, confirm it opens without browser chrome and with the right icon.

Step 7 is the one most likely to fail and the one most likely to be skipped.

## Acceptance

- The app installs to an iPhone and an Android home screen with the correct icon and name.
- A previously-visited recipe is fully readable with no connection.
- Fonts render offline.
- Ticking a shopping item offline persists and syncs on reconnect.
- Editing a recipe offline is blocked with a clear explanation.
- A new deployment prompts to reload rather than swapping silently.
- Clearing the app's storage recovers cleanly rather than white-screening.
