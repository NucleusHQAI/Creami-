# 06 — Freezer tracker, ratings and notes

The 24-hour freeze is the one hard constraint of CREAMi cooking, and it is exactly the sort of thing people get wrong from memory. The app tracks it.

## Model

A **batch** is one tub, from the moment it goes in the freezer to the moment it is finished.

```
   [Log a batch]
        ↓
    freezing ──(ready_at passes)──→ ready ──[Mark spun]──→ spun ──[Mark finished]──→ finished
                                                                        ↓
                                                              [Rate it] → tasting note
```

`ready_at` is set by a database trigger as `frozen_at + freeze_hours`, so it cannot drift out of step with the setting or be got wrong by the client.

**`freezing` → `ready` is derived, not written.** The app compares `ready_at` to the current time. There is no cron job, no scheduled function, and nothing to go stale while the app is closed. The status column is only *written* when a person acts — marking spun or finished.

That distinction matters when writing queries. "Ready" means:

```sql
status = 'freezing' and ready_at <= now()
```

Not `status = 'ready'`.

## The freezer screen — `/freezer`

Three sections, in this order:

### Ready to spin

The reason the screen exists. Prominent, berry-accented cards.

```
┌─────────────────────────────────────┐
│  ❄ READY                            │
│  Cinnamon Roll                      │
│  Frozen 26 hours ago                │
│                                     │
│  [ Mark as spun ]                   │
└─────────────────────────────────────┘
```

### Freezing

Everything not yet at `ready_at`, soonest first, with a countdown: "Ready in 6 hours", "Ready tomorrow at 14:30". Use `date-fns` `formatDistanceToNow` and re-render on an interval — once a minute is plenty.

### Spun, not finished

Tubs currently being eaten. Each offers "Mark finished" and "Add a note".

Below all three, a collapsed "History" section: finished batches, most recent first, with the rating if one was given.

Empty state when nothing is in the freezer: "Nothing freezing right now", with a "Browse recipes" button.

## Logging a batch

Reachable from the recipe detail page ("Log a batch") and from a floating action button on the freezer screen (which asks which recipe first).

The sheet asks for as little as possible:

| Field | Default |
|---|---|
| Recipe | pre-filled when coming from a recipe |
| When did it go in | Now. A "Set a different time" link reveals a datetime input |
| Notes | optional |

Then it shows what it worked out: "Ready to spin at 14:30 tomorrow." One confirm button. The whole interaction should be two taps from a recipe page.

## Marking spun

The moment a tub is spun is the moment the useful detail exists — did it need a re-spin, how much milk went in. Ask, but do not insist:

| Field | Notes |
|---|---|
| Re-spins | Stepper, 0–3, defaults to 0 |
| Milk added | Millilitres, optional, suggests 15–30ml |
| Notes | optional, free text |

Everything is skippable with a "Just mark it spun" button. A form that must be filled in is a form that stops getting used, and then the tracker is worthless.

`respin_count` and `added_milk_ml` accumulate into something genuinely useful over time — see below.

## Ratings and tasting notes

A tasting note is a rating, some text, or both, optionally attached to a batch.

Where they can be created:

- From a spun or finished batch — "How was it?"
- From the recipe detail page — "Add a note", not tied to any batch
- Prompted once when a batch is marked finished, dismissible

The form: 1–5 stars, and a text field placeheld with a real example — "Too icy, blend the fruit longer" — because that is the kind of note worth writing.

On the recipe detail page, notes appear newest first with their date and, where relevant, "from the batch made on 3 March".

The average comes from the `recipe_ratings` view and shows on the card as `★ 4.5`. Show the count too; one five-star rating is not the same as four.

## Insights

Cheap to compute once batches exist, and the payoff for logging anything at all. Put them on the recipe detail page:

- **"Made 4 times"** — the batch count.
- **"Usually needs 1 re-spin"** — the modal `respin_count` when at least three batches have one recorded.
- **"Typically 20ml of milk before re-spinning"** — the median `added_milk_ml`.

Show each only when there is enough data to mean anything. Three batches is the threshold. Below that, show nothing rather than a misleading average of one.

## Home banner

When any batch is ready, the recipe list shows a banner at the top:

> **2 tubs ready to spin** — Cinnamon Roll, Mango Lassi →

Query it with `queryKeys.batches.active` and `refetchOnWindowFocus: true`. Somebody opening the app in the morning should be told immediately.

## Data access

```ts
// src/lib/api/batches.ts
export function fetchBatches(status?: BatchStatus[]): Promise<Batch[]>
export function fetchActiveBatches(): Promise<Batch[]>   // freezing + ready + spun
export function createBatch(input: { recipeId: string; frozenAt?: Date; notes?: string }): Promise<Batch>
export function markSpun(id: string, input: { respins: number; milkMl?: number; notes?: string }): Promise<void>
export function markFinished(id: string): Promise<void>
export function deleteBatch(id: string): Promise<void>

// src/lib/api/tasting-notes.ts
export function createTastingNote(input: { recipeId: string; batchId?: string; rating?: number; notes?: string }): Promise<TastingNote>
export function deleteTastingNote(id: string): Promise<void>
```

Never send `ready_at` from the client — the trigger owns it. Send `frozen_at` and read `ready_at` back.

## Time handling

Everything is stored as `timestamptz` in UTC and displayed in the browser's local zone. `date-fns` handles the formatting. Do not build a custom relative-time function; British Summer Time will find the bug in it.

## Acceptance

- Logging a batch from a recipe takes two taps and shows the correct ready time.
- A batch frozen 25 hours ago appears under "Ready to spin" without anything having been written to it.
- The countdown updates without a page reload.
- Marking spun is possible without filling in anything.
- A rating appears on the recipe card and in the average.
- Deleting a recipe leaves its batches and notes intact.
- "Usually needs 1 re-spin" appears only once three batches carry the data.
