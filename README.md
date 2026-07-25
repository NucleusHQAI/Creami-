# CREAMi Deluxe — recipe book app

A personal, household recipe book for the Ninja CREAMi Deluxe. It supports recipe creation and editing, freezer tracking, shopping lists, tasting notes and calculated macros.

## Project status

- Tasks 1–43 are implemented.
- Task 44 is pending because it needs the nutrition labels from the household cupboard. The app is usable before this calibration; macro results use the current approximate ingredient values.
- Task 45 is implemented; deployed builds generate the installable PWA and update prompt.
- Task 46's offline cache, safe mutation queue, connection banner and blocked-action handling are implemented. Real-device offline checks remain.
- Task 47 is ready to deploy but waiting for Netlify authentication.
- Task 48's final phone walkthrough and cupboard calibration remain manual.
- The hosted Supabase project exists, its schema is applied, and the seed data is loaded.
- One household email/password account still needs to be created, and public signup still needs to be disabled.

## What the app includes

- **Recipe library** — 40 seeded recipes plus household additions, with create, edit, duplicate and delete actions.
- **Favourites** — shared through the household account.
- **Ratings and tasting notes** — score finished tubs and record changes for next time.
- **Macro calculator** — calculates energy and macros per tub and serving from the selected base and ingredients.
- **Scaling** — view a recipe at full tub, half tub or a custom fill volume.
- **Shopping list** — aggregate ingredients for planned recipes and keep persistent ticks.
- **Freezer tracker** — log tubs, follow the freeze countdown and record spinning and finishing.
- **Reference material** — base formulas, the standard method, technique notes, ingredient values and settings.

## Run locally on Windows

You need Node.js with npm installed and the two client values from the hosted Supabase project.

1. Open PowerShell in the repository folder and install the locked dependencies:

   ```powershell
   npm.cmd ci
   ```

2. Create the local environment file:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` and set both values:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```

4. Start the app:

   ```powershell
   npm.cmd run dev
   ```

5. Open the local address shown in PowerShell, normally `http://localhost:5173`.

### Test from a phone on the same network

1. Connect the Windows computer and phone to the same private Wi-Fi network.
2. Start Vite on the local network:

   ```powershell
   npm.cmd run dev -- --host 0.0.0.0
   ```

3. If Windows Firewall asks, allow access on private networks.
4. Run `ipconfig` and find the computer's IPv4 address for that Wi-Fi connection.
5. On the phone, open `http://<IPv4-address>:5173`, for example `http://192.168.1.25:5173`.

Press `Ctrl+C` in PowerShell to stop the development server.

## One-time Supabase setup

Before signing in for the first time:

1. In Supabase Authentication, create one email/password user for the household.
2. Disable public email signup. The app deliberately has no signup screen.
3. Keep Row Level Security enabled. The existing policies restrict household data to authenticated access.

The Supabase publishable key is designed to be used by browser clients and is safe to place in `VITE_SUPABASE_PUBLISHABLE_KEY` when Row Level Security remains enabled. Never use a Supabase service-role key in this app, in any `VITE_` variable, or in a committed file.

## Task 44: cupboard calibration

Task 44 needs the nutrition labels for the protein powder, Greek yoghurt, quark and milk actually used in the household. Update those four entries in the ingredient library, then compare a few calculated recipes with their reference values.

This calibration improves accuracy but does not block local use. Until it is done, treat calculated nutrition as an estimate.

## Project documentation

| # | Document | What it covers |
|---|---|---|
| — | [`CLAUDE.md`](CLAUDE.md) | Coding conventions |
| 00 | [`docs/00-product-brief.md`](docs/00-product-brief.md) | Product scope and acceptance journeys |
| 01 | [`docs/01-architecture.md`](docs/01-architecture.md) | Stack, data flow, environment and deployment |
| 02 | [`docs/02-data-model.md`](docs/02-data-model.md) | Database schema, Row Level Security and types |
| 03 | [`docs/03-design-system.md`](docs/03-design-system.md) | Visual and component system |
| 04 | [`docs/04-macro-engine.md`](docs/04-macro-engine.md) | Macro calculations and calibration |
| 05 | [`docs/05-feature-recipes.md`](docs/05-feature-recipes.md) | Recipe features |
| 06 | [`docs/06-feature-freezer.md`](docs/06-feature-freezer.md) | Freezer and tasting features |
| 07 | [`docs/07-feature-shopping.md`](docs/07-feature-shopping.md) | Planning and shopping |
| 08 | [`docs/08-feature-reference-settings.md`](docs/08-feature-reference-settings.md) | Reference data and settings |
| 09 | [`docs/09-pwa-offline.md`](docs/09-pwa-offline.md) | Installability and offline design |
| 10 | [`docs/10-task-backlog.md`](docs/10-task-backlog.md) | Task history and remaining work |

## Seed data

`seed/` contains the validated starting data: 40 recipes, 71 ingredients, 6 bases and 5 categories. The nutrition figures are approximate UK supermarket values and remain editable through the ingredient library.
