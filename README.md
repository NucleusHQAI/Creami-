# CREAMi Deluxe — recipe book app

A personal, household recipe book for the Ninja CREAMi Deluxe. Grew out of a single-file HTML document; this repo turns it into a real app with a database behind it, so recipes can be added and edited, tubs can be tracked through the freezer, and macros are calculated rather than typed.

**This repo currently contains the specification, not the application.** Nothing has been built yet. Everything in `docs/` describes what to build and `seed/` contains the data to build it with.

---

## What this is meant to become

A phone-first, installable web app with:

- **A recipe library** — the 40 recipes from the original document, plus anything added later. Full create, edit, delete.
- **Favourites** — one shared household account, so a favourite is just a favourite.
- **Ratings and tasting notes** — score a tub after eating it, record what to change next time.
- **A macro calculator** — pick a base and some ingredients, the app works out kcal and protein per tub and per serving. No more typing numbers in by hand.
- **Scaling** — view any recipe at full tub, half tub, or a custom fill volume.
- **A shopping list** — pick the recipes to make, get an aggregated and categorised list with persistent ticks.
- **A freezer tracker** — log a tub in, the app counts down the 24-hour freeze and tells you what's ready to spin.
- **Reference material** — the base formulas, the method, and the technique notes, kept from the original.

Offline reading works; edits sync when the connection comes back.

---

## Reading order

Start at the top and go down. The first three are load-bearing — the rest assume them.

| # | Document | What it settles |
|---|---|---|
| — | [`CLAUDE.md`](CLAUDE.md) | Coding conventions. **Read before writing any code.** |
| 00 | [`docs/00-product-brief.md`](docs/00-product-brief.md) | Scope, decisions already made, and what is deliberately out |
| 01 | [`docs/01-architecture.md`](docs/01-architecture.md) | Stack, folder layout, data flow, environment, deployment |
| 02 | [`docs/02-data-model.md`](docs/02-data-model.md) | Every table, the full SQL, RLS, and the TypeScript types |
| 03 | [`docs/03-design-system.md`](docs/03-design-system.md) | Colour, type, spacing, and the component inventory |
| 04 | [`docs/04-macro-engine.md`](docs/04-macro-engine.md) | The calculation algorithm, in detail, with test vectors |
| 05 | [`docs/05-feature-recipes.md`](docs/05-feature-recipes.md) | Browsing, searching, favouriting, creating and editing recipes |
| 06 | [`docs/06-feature-freezer.md`](docs/06-feature-freezer.md) | Batches, the 24-hour timer, ratings and tasting notes |
| 07 | [`docs/07-feature-shopping.md`](docs/07-feature-shopping.md) | Meal planning and the aggregated shopping list |
| 08 | [`docs/08-feature-reference-settings.md`](docs/08-feature-reference-settings.md) | Bases, method, technique notes, ingredient library, settings |
| 09 | [`docs/09-pwa-offline.md`](docs/09-pwa-offline.md) | Installability, offline reading, the mutation outbox |
| 10 | [`docs/10-task-backlog.md`](docs/10-task-backlog.md) | **The build order.** 48 numbered tasks with acceptance criteria |

## Seed data

`seed/` holds the content the app starts life with. It is finished and validated — all 40 recipes, 71 ingredients, 6 bases and 5 categories, with every cross-reference resolving. Do not rewrite it; convert it.

| File | Contents |
|---|---|
| `seed/recipes.json` | 40 recipes, quantities converted to grams and millilitres |
| `seed/ingredients.json` | 71 ingredients with approximate per-100 macros |
| `seed/bases.json` | The 6 base formulas and their ingredient lists |
| `seed/categories.json` | The 5 categories with their display colours |

**The nutrition figures in `seed/ingredients.json` are approximate typical UK supermarket values and are wrong for some brands.** They are editable defaults, not facts. Task 44 in the backlog covers correcting them against the labels actually in the cupboard.

---

## How to build this

The backlog is written so that each task is small enough to hand to a model on its own. A task states its goal, the files it touches, what it depends on, and how to tell when it is done.

Work the tasks in numbered order — the dependencies assume it. Before starting one, read `CLAUDE.md`, the feature document it names, and nothing else. The specs are deliberately separated so no single task needs the whole picture in context.

Phases 1–4 (tasks 1–26) produce a working app. Everything after that is additive.
