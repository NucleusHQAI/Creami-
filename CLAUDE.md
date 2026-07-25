# Conventions

Read this before writing code in this repo. It exists so that work done by different people and models at different times still looks like one codebase.

## The short version

1. **Do the task you were given and stop.** Do not refactor neighbouring code, do not add features nobody asked for, do not upgrade dependencies. If you spot a real problem outside your task, note it in the pull request description and leave the code alone.
2. **Read the feature spec your task names.** Every task in `docs/10-task-backlog.md` points at one. It has the details this file does not.
3. **The seed data in `seed/` is finished.** Convert it, do not rewrite it, do not invent extra recipes or ingredients.
4. **British English throughout**, in the UI and in comments. Flavour, colour, yoghurt, favourite.
5. **No personal names anywhere.** The original document had sections built around named people. They are gone on purpose and must not come back — no person-specific picks, no per-person labels on recipe cards, no named starter rotation.

## Language and tooling

TypeScript, `strict: true`. No `any` — if the type is genuinely unknown, use `unknown` and narrow it. No non-null assertions (`!`); handle the null case.

Formatting is Prettier's problem, linting is ESLint's. Run `npm run lint && npm run typecheck` before you consider a task done. Do not hand-format code and do not add eslint-disable comments to silence a rule — fix the code.

## Files and naming

```
src/
  app/                 router, providers, root layout
  components/ui/       generic primitives — Button, Card, Pill, Sheet, Field
  components/          shared app components that are not primitives
  features/
    recipes/           components, hooks and helpers for one feature
    freezer/
    shopping/
    reference/
    settings/
  lib/                 supabase client, query keys, formatters, utilities
  lib/macros/          the macro engine — pure functions only, no React
  types/               database.types.ts (generated) and domain types
  styles/
```

- Components are `PascalCase.tsx`, one component per file, named the same as the file.
- Hooks are `useThing.ts`.
- Everything else is `kebab-case.ts`.
- A feature folder owns its own components. If a second feature needs one, move it to `src/components/`.

Prefer named exports. Default exports only for route-level page components, because the router lazy-loads them.

## React

Function components with hooks. No class components.

Keep components small enough to read in one screen. When one grows past roughly 150 lines, the usual cause is that data fetching, derived state and markup are all living together — pull the data work into a hook.

Derive state during render rather than syncing it in an effect. `useEffect` is for subscriptions, timers and imperative DOM work, not for keeping two pieces of state in agreement.

## Data

All server state goes through TanStack Query. Components never call the Supabase client directly — they call a hook from the feature folder, and that hook calls a function in `lib/`.

```
component  →  useRecipes()  →  fetchRecipes()  →  supabase
                (query)         (lib/api)
```

Query keys are defined once, in `src/lib/query-keys.ts`. Never write a key inline; you will get the invalidation wrong.

Mutations invalidate the narrowest key that covers what changed.

## Styling

Tailwind utility classes in the markup. The design tokens live in `tailwind.config.ts` and are documented in `docs/03-design-system.md`.

- Use the semantic token names — `bg-cream`, `text-ink`, `border-line` — never raw hex values in a class.
- No inline `style` attributes, except for genuinely dynamic values such as a category accent colour coming from the database.
- No CSS-in-JS, no styled-components, no separate `.css` files beyond the single global stylesheet.
- When the same cluster of classes appears three times, it wants to be a component in `components/ui/`.

## Errors and loading

Every screen that fetches data handles three states: loading, error, empty. Skeletons for loading, not spinners. A real message for errors, with a retry. Empty states say what to do next, not just "no results".

Never swallow an error. If you catch one, either show it or log it with enough context to find it later.

## Testing

The macro engine (`src/lib/macros/`) is pure and must have thorough Vitest coverage, including the golden vectors in `docs/04-macro-engine.md`. Every one of those must pass exactly.

Other pure helpers — unit conversion, shopping list aggregation, freeze timing — get tests too. UI components generally do not, unless the task says otherwise. There is no coverage target; test the things where being wrong would be silently expensive.

## Commits

One task per branch, one pull request per task, titled with the task number: `Task 12: recipe detail page`.

Write commit messages that say what changed and why. Do not list every file.

## Things that will be sent back

- Values from `seed/ingredients.json` hardcoded into components instead of read from the database
- Macro arithmetic written inline in a component instead of calling the engine
- New dependencies added without the task asking for them
- `localStorage` used for anything that belongs in the database
- Recipe or ingredient data duplicated between the client and the database
- Personal names, or per-person groupings, anywhere in the UI
