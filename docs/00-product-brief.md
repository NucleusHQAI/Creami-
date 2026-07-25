# 00 — Product brief

## What we are building

A private web app that replaces a single-file HTML recipe document with something that remembers things. One household, one CREAMi Deluxe, forty recipes to start with and room for however many come after.

The original document is good and the app should feel like it. Same warm, editorial, slightly-printed look. The difference is that it now has a database behind it, so a recipe can be added at 9pm on a Tuesday, a tub can be rated after it has actually been eaten, and the app can say "the tub you froze yesterday is ready".

## Decisions already taken

These came out of a scoping interview and are settled. Don't relitigate them mid-build.

| Question | Decision |
|---|---|
| Where does data live | Supabase — Postgres, with Supabase Auth |
| Accounts | One shared household account. Public signup **off**; the account is created by hand in the Supabase dashboard |
| Stack | React + Vite + TypeScript + Tailwind, deployed as a static build |
| Hosting | Netlify, auto-deploying from this repo |
| Design | Keep the original's look, rebuilt properly as components and tokens |
| Macros | Calculated from an editable ingredient library, not typed in per recipe |
| Freezer tracking | Batches with a 24-hour ready-at timer, plus a history |
| Device | Phone-first, installable, readable offline |

Because there is exactly one account, anything that would otherwise need per-user scoping does not. A favourite is a favourite. A rating is the household's rating. This removes a great deal of complexity and is the main reason the schema is as small as it is.

## What carries over from the original document

- **All 40 recipes.** They land in the database as ordinary editable records — rename them, change them, delete them.
- **The 6 base formulas.** Everyday creamy, Fruit and yoghurt, Chocolate creamy, Dessert-style, Cheesecake, Coconut. These stop being prose and become structured data that the macro engine actually reads.
- **The method.** Blend → Fill → Freeze → Process → Mix-in, and the LITE ICE CREAM / RE-SPIN / MIX-IN specifics.
- **The technique notes.** Xanthan gum dosing, quark versus cottage cheese, the milk guide, why a whey and casein blend behaves better than whey alone, and the standing caveat that macros are estimates.
- **The visual identity.** Cream background, berry accent, Bricolage Grotesque headlines, DM Sans body, DM Mono labels, generous rounded corners, the illustrated tub.

## What is deliberately dropped

- **Named starter and chocolate-pick sections** — both sections, and the per-recipe `pick` field that drove them. The `pick` field has already been stripped from `seed/recipes.json`.
- **A person-specific chocolate category label.** It is now just **Chocolate**.
- **The named starter rotation.** Favourites and ratings do this job now, and they do it based on what actually got eaten.
- **The marketing hero.** "Forty lower-calorie, high-protein flavours..." was copy for a document being read once. An app that gets opened daily opens on the recipes.
- **Hardcoded per-recipe kcal and protein.** The engine computes these. The original figures survive only as calibration reference data (see `docs/04-macro-engine.md`).

## Explicitly out of scope

Not "no forever" — just not now, and no task in the backlog builds toward them:

- Photo upload
- Multiple user accounts, sharing, or anything public-facing
- Printing and PDF export
- Importing recipes from URLs
- Nutrition beyond kcal, protein, carbs and fat
- Support for CREAMi models other than the Deluxe
- Anything social

## Who uses it and how

Two people, one login, mostly on a phone, often standing in a kitchen with cold hands. That last part is a design constraint, not a joke:

- Tap targets are large and well separated.
- The most common actions — favourite, log a tub in, tick a shopping item — are one tap and never behind a menu.
- Text is large enough to read from arm's length on a worktop.
- The app opens on what is useful now: what is ready to spin, and the recipe list.

## What "done" looks like

The build is finished when someone can, on their phone, with no help:

1. Find a recipe by flavour, category, or the fact they favourited it.
2. Read it, see its macros, and flip it to half-tub quantities.
3. Add a new recipe of their own and get correct macros back.
4. Tick four recipes and be handed one sensible shopping list.
5. Log a tub into the freezer and be told tomorrow that it is ready.
6. Rate the tub they just ate and write down what to change next time.
7. Do all the reading parts of that with no signal.
