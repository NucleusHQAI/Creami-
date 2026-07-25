# 02 — Data model

Everything the app stores. The SQL here is meant to be applied as written.

## Principles

**One household, no ownership columns.** There is a single shared account, so nothing carries a `user_id`. If a second household ever needs this, add a `household_id` to every table and change the policies — but do not build that now, because carrying an unused foreign key on eleven tables costs something every day and buys nothing.

**Reference data is data, not code.** Ingredients, bases and categories live in tables and are editable in the app. Nothing from `seed/*.json` may be hardcoded into a component.

**Quantities are stored in grams, millilitres, or item counts.** Never "1/2 tsp". Spoon measures are a display concern; the conversions used for the seed data are recorded in `seed/recipes.json`.

**Soft-delete recipes, hard-delete everything else.** Deleting a recipe that a batch and three tasting notes point at should not cascade away the history of having eaten it.

## Entity map

```
categories ──┐
             ├──< recipes >──── recipe_ingredients >──── ingredients
bases ───────┘        │                                       │
  │                   │                                       │
  └── base_ingredients┘                                       │
                      │                                       │
                      ├──< batches >──< tasting_notes         │
                      └──< plan_items                          │
                                                               │
shopping_extras (free-standing)      shopping_checks ──────────┘
app_settings (single row)
```

---

## Tables

### `categories`
The five recipe groupings. Editable — colours drive the card accents.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `key` | text unique | `classic`, `fruit`, `bakery`, `coffee`, `chocolate` |
| `label` | text | "Creamy classics" |
| `emoji` | text | |
| `accent` | text | hex, drives card accent |
| `tint` | text | hex, drives card background wash |
| `sort_order` | int | |

### `ingredients`
The macro library. 71 seeded rows; users add more.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `slug` | text unique | stable identifier, used by the seed converter |
| `name` | text | |
| `category` | text | `dairy`, `protein`, `texture`, `flavour`, `nut-butter`, `fruit`, `sweet`, `confectionery`, `biscuit`, `nuts` |
| `basis` | text | `per_100g` \| `per_100ml` \| `per_item` |
| `kcal`, `protein_g`, `carbs_g`, `fat_g` | numeric | per the basis above |
| `density_g_per_ml` | numeric | default `1.0`. Converts between mass and volume |
| `grams_per_item` | numeric | required when `basis = 'per_item'` |
| `grams_per_tsp` | numeric | optional, for the quantity input's spoon helper |
| `negligible` | bool | true → engine contributes zero macros |
| `counts_toward_volume` | bool | false → excluded from the fill calculation |
| `notes` | text | technique note shown in the ingredient library |
| `is_seed` | bool | seeded rows are protected from deletion |

`basis = 'per_item'` requires `grams_per_item` — enforced by a check constraint, because an item ingredient without it silently computes zero.

### `bases`
The six base formulas.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `key` | text unique | `everyday`, `fruit`, `choc`, `dessert`, `cheesecake`, `coconut` |
| `name`, `tagline`, `summary`, `guidance` | text | display copy |
| `is_variation_of` | uuid → bases | nullable; `choc` is a variation of `everyday` |
| `fill_ingredient_id` | uuid → ingredients | the ingredient topped up to reach the freezer fill line |
| `sort_order` | int | |

### `base_ingredients`
What goes in a base, per full tub.

| Column | Type |
|---|---|
| `id` | uuid pk |
| `base_id` | uuid → bases, cascade |
| `ingredient_id` | uuid → ingredients, restrict |
| `quantity` | numeric |
| `unit` | text — `g` \| `ml` \| `item` |
| `note` | text nullable — "1/8 tsp", "Or skyr" |
| `sort_order` | int |

The fill ingredient's row here is the **nominal** amount. The engine overrides it — see `docs/04-macro-engine.md`.

### `recipes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `slug` | text unique | |
| `name` | text | |
| `category_id` | uuid → categories, restrict | |
| `base_id` | uuid → bases, restrict | |
| `profile` | text | the one-line flavour description |
| `image_path` | text nullable | bundled local path or a path in the `recipe-images` Storage bucket |
| `tip` | text | "Best result" note |
| `mixin_note` | text | human-readable mix-in summary |
| `method_override` | text nullable | null means use the standard method from settings |
| `is_favourite` | bool default false | shared account, so this lives on the recipe |
| `macro_override_kcal` | numeric nullable | set → displayed instead of the computed value |
| `macro_override_protein_g` | numeric nullable | as above |
| `reference_kcal` | int nullable | original document's estimate. Calibration only |
| `reference_protein_g` | int nullable | as above |
| `is_seed` | bool default false | |
| `archived_at` | timestamptz nullable | soft delete |
| `created_at`, `updated_at` | timestamptz | `updated_at` maintained by trigger |

Every list query filters `archived_at is null`.

### `recipe_ingredients`
A recipe's flavour additions and mix-ins.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `recipe_id` | uuid → recipes, cascade | |
| `ingredient_id` | uuid → ingredients, restrict | nullable — see below |
| `role` | text | `addition` \| `mixin` |
| `quantity` | numeric nullable | |
| `unit` | text nullable | `g` \| `ml` \| `item` |
| `display` | text | what the UI shows: "1 tsp vanilla bean paste" |
| `optional` | bool default false | |
| `free_text` | text nullable | for lines with no ingredient match |
| `sort_order` | int | |

`ingredient_id` is nullable so a recipe can carry a line like "a squeeze of whatever citrus is in the fruit bowl". A row must have either an `ingredient_id` **or** a `free_text` — check constraint enforces it. Free-text lines contribute no macros and are shown with a small marker so it is obvious why.

### `batches`
A tub, from freezer to finished.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `recipe_id` | uuid → recipes, restrict | |
| `status` | text | `freezing` \| `ready` \| `spun` \| `finished` |
| `frozen_at` | timestamptz | when it went in |
| `ready_at` | timestamptz | `frozen_at` + freeze hours, computed on insert |
| `spun_at`, `finished_at` | timestamptz nullable | |
| `respin_count` | int default 0 | how many RE-SPINs it took |
| `added_milk_ml` | int nullable | how much milk was added before re-spinning |
| `notes` | text nullable | |
| `created_at` | timestamptz | |

`status` is stored rather than derived, because `spun` and `finished` are events only a human knows about. `freezing` → `ready` **is** derived: the app compares `ready_at` to now and does not need a cron job. Persist `ready` only when the user acts on the batch.

### `tasting_notes`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `recipe_id` | uuid → recipes, cascade | |
| `batch_id` | uuid → batches, set null | nullable — you can rate without having logged a batch |
| `rating` | int nullable | 1–5, check constrained |
| `notes` | text nullable | |
| `created_at` | timestamptz | |

Kept separate from `recipes` so the same recipe accumulates a history. Average rating comes from the `recipe_ratings` view.

### `plan_items`
Recipes queued up to be made — this is what the shopping list is built from.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `recipe_id` | uuid → recipes, cascade | unique |
| `multiplier` | numeric default 1 | 2 = two tubs of it |
| `created_at` | timestamptz | |

### `shopping_extras`
Manually added shopping lines that no recipe generated.

| Column | Type |
|---|---|
| `id` | uuid pk |
| `label` | text |
| `category` | text nullable |
| `is_checked` | bool default false |
| `created_at` | timestamptz |

### `shopping_checks`
Tick state for the auto-generated lines. Keyed by ingredient rather than by row, because the generated list is recomputed on every render and row identity is not stable.

| Column | Type |
|---|---|
| `ingredient_id` | uuid pk → ingredients, cascade |
| `is_checked` | bool default false |
| `updated_at` | timestamptz |

### `app_settings`
Exactly one row, enforced.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | int pk | `1` | check `id = 1` |
| `max_fill_ml` | int | `525` | frozen-base target before mix-ins |
| `freeze_hours` | int | `24` | |
| `default_milk_ingredient_id` | uuid → ingredients | semi-skimmed | global milk swap |
| `servings_per_tub` | int | `2` | |
| `standard_method` | text | the Blend/Fill/Freeze/Process/Mix-in text | |
| `updated_at` | timestamptz | | |

`default_milk_ingredient_id` is the reason the milk guide from the original document becomes useful rather than decorative: change it once, and every recipe's macros update.

---

## Views

```sql
create view recipe_ratings as
  select recipe_id,
         round(avg(rating)::numeric, 1) as average_rating,
         count(rating)                  as rating_count,
         max(created_at)                as last_rated_at
  from tasting_notes
  where rating is not null
  group by recipe_id;

-- Everything the recipe list needs, in one round trip.
create view recipe_list_view as
  select r.id, r.slug, r.name, r.profile, r.image_path, r.is_favourite, r.archived_at,
         c.key as category_key, c.label as category_label,
         c.emoji, c.accent, c.tint,
         b.key as base_key, b.name as base_name,
         rr.average_rating, rr.rating_count,
         (select count(*) from batches bt
           where bt.recipe_id = r.id and bt.status in ('freezing','ready')) as active_batches
  from recipes r
  join categories c on c.id = r.category_id
  join bases b      on b.id = r.base_id
  left join recipe_ratings rr on rr.recipe_id = r.id;
```

Macros are **not** in the view. They are computed client-side, because they depend on the current `max_fill_ml`, the current default milk, and the scaling the user has selected — none of which the database knows about.

---

## Row Level Security

Every table: RLS on, and a single policy granting full access to any authenticated user.

This is only safe because public signup is disabled. **Turn it off in the Supabase dashboard before the app is reachable from the internet** — Authentication → Providers → Email → disable "Enable sign ups". If someone can create an account, these policies hand them the entire database.

Anonymous access is granted nowhere. The `anon` role can read nothing.

---

## Migration 0001

```sql
-- ============================================================
-- 0001_init.sql — CREAMi Deluxe recipe book
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- reference ----------

create table categories (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  label      text not null,
  emoji      text,
  accent     text not null default '#d94468',
  tint       text not null default '#ffe7ee',
  sort_order int  not null default 0
);

create table ingredients (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null unique,
  name                 text not null,
  category             text not null,
  basis                text not null check (basis in ('per_100g','per_100ml','per_item')),
  kcal                 numeric not null default 0 check (kcal >= 0),
  protein_g            numeric not null default 0 check (protein_g >= 0),
  carbs_g              numeric not null default 0 check (carbs_g >= 0),
  fat_g                numeric not null default 0 check (fat_g >= 0),
  density_g_per_ml     numeric not null default 1.0 check (density_g_per_ml > 0),
  grams_per_item       numeric check (grams_per_item is null or grams_per_item > 0),
  grams_per_tsp        numeric,
  negligible           boolean not null default false,
  counts_toward_volume boolean not null default true,
  notes                text,
  is_seed              boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- an item-based ingredient with no gram weight silently computes to zero
  constraint item_needs_weight
    check (basis <> 'per_item' or grams_per_item is not null)
);

create table bases (
  id                 uuid primary key default gen_random_uuid(),
  key                text not null unique,
  name               text not null,
  tagline            text,
  summary            text,
  guidance           text,
  is_variation_of    uuid references bases(id) on delete set null,
  fill_ingredient_id uuid not null references ingredients(id) on delete restrict,
  sort_order         int  not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table base_ingredients (
  id            uuid primary key default gen_random_uuid(),
  base_id       uuid not null references bases(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete restrict,
  quantity      numeric not null check (quantity >= 0),
  unit          text not null check (unit in ('g','ml','item')),
  note          text,
  sort_order    int not null default 0
);
create index on base_ingredients (base_id);

-- ---------- recipes ----------

create table recipes (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text not null unique,
  name                     text not null,
  category_id              uuid not null references categories(id) on delete restrict,
  base_id                  uuid not null references bases(id)      on delete restrict,
  profile                  text,
  tip                      text,
  mixin_note               text,
  method_override          text,
  image_path               text,
  is_favourite             boolean not null default false,
  macro_override_kcal      numeric check (macro_override_kcal is null or macro_override_kcal >= 0),
  macro_override_protein_g numeric check (macro_override_protein_g is null or macro_override_protein_g >= 0),
  reference_kcal           int,
  reference_protein_g      int,
  is_seed                  boolean not null default false,
  archived_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on recipes (category_id);
create index on recipes (archived_at) where archived_at is null;
create index on recipes (is_favourite) where is_favourite;

create table recipe_ingredients (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references recipes(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete restrict,
  role          text not null check (role in ('addition','mixin')),
  quantity      numeric check (quantity is null or quantity >= 0),
  unit          text check (unit in ('g','ml','item')),
  display       text not null,
  optional      boolean not null default false,
  free_text     text,
  sort_order    int not null default 0,
  -- a line is either a real ingredient or a note; never neither
  constraint has_ingredient_or_text
    check (ingredient_id is not null or free_text is not null)
);
create index on recipe_ingredients (recipe_id);

-- ---------- freezer ----------

create table batches (
  id            uuid primary key default gen_random_uuid(),
  recipe_id     uuid not null references recipes(id) on delete restrict,
  status        text not null default 'freezing'
                check (status in ('freezing','ready','spun','finished')),
  frozen_at     timestamptz not null default now(),
  ready_at      timestamptz not null,
  spun_at       timestamptz,
  finished_at   timestamptz,
  respin_count  int not null default 0 check (respin_count >= 0),
  added_milk_ml int check (added_milk_ml is null or added_milk_ml >= 0),
  notes         text,
  created_at    timestamptz not null default now()
);
create index on batches (status);
create index on batches (recipe_id);

create table tasting_notes (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null references recipes(id) on delete cascade,
  batch_id   uuid references batches(id) on delete set null,
  rating     int check (rating between 1 and 5),
  notes      text,
  created_at timestamptz not null default now()
);
create index on tasting_notes (recipe_id);

-- ---------- shopping ----------

create table plan_items (
  id         uuid primary key default gen_random_uuid(),
  recipe_id  uuid not null unique references recipes(id) on delete cascade,
  multiplier numeric not null default 1 check (multiplier > 0),
  created_at timestamptz not null default now()
);

create table shopping_extras (
  id         uuid primary key default gen_random_uuid(),
  label      text not null,
  category   text,
  is_checked boolean not null default false,
  created_at timestamptz not null default now()
);

create table shopping_checks (
  ingredient_id uuid primary key references ingredients(id) on delete cascade,
  is_checked    boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- ---------- settings ----------

create table app_settings (
  id                         int primary key default 1 check (id = 1),
  max_fill_ml                int  not null default 525 check (max_fill_ml between 100 and 2000),
  freeze_hours               int  not null default 24  check (freeze_hours between 1 and 168),
  default_milk_ingredient_id uuid references ingredients(id) on delete set null,
  servings_per_tub           int  not null default 2 check (servings_per_tub > 0),
  standard_method            text not null default
    'Blend the base and flavour additions until completely smooth. Top up the base mixture to your freezer fill line. Freeze flat for at least 24 hours with the surface level. Process on LITE ICE CREAM. If powdery, add 15 to 30ml milk and RE-SPIN. Make a narrow hole to the bottom, add the mix-ins and run MIX-IN once.',
  updated_at                 timestamptz not null default now()
);

-- ---------- triggers ----------

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger t_ingredients_updated before update on ingredients
  for each row execute function set_updated_at();
create trigger t_bases_updated       before update on bases
  for each row execute function set_updated_at();
create trigger t_recipes_updated     before update on recipes
  for each row execute function set_updated_at();
create trigger t_settings_updated    before update on app_settings
  for each row execute function set_updated_at();

-- ready_at is always derived from frozen_at, so the client never sets it
create or replace function set_batch_ready_at() returns trigger
language plpgsql as $$
declare hrs int;
begin
  select freeze_hours into hrs from app_settings where id = 1;
  new.ready_at := new.frozen_at + make_interval(hours => coalesce(hrs, 24));
  return new;
end $$;

create trigger t_batches_ready_at before insert or update of frozen_at on batches
  for each row execute function set_batch_ready_at();

-- ---------- views ----------

create view recipe_ratings as
  select recipe_id,
         round(avg(rating)::numeric, 1) as average_rating,
         count(rating)                  as rating_count,
         max(created_at)                as last_rated_at
  from tasting_notes
  where rating is not null
  group by recipe_id;

create view recipe_list_view as
  select r.id, r.slug, r.name, r.profile, r.image_path, r.is_favourite, r.archived_at,
         r.created_at, r.updated_at,
         c.key as category_key, c.label as category_label,
         c.emoji, c.accent, c.tint,
         b.key as base_key, b.name as base_name,
         rr.average_rating, rr.rating_count,
         (select count(*) from batches bt
           where bt.recipe_id = r.id and bt.status in ('freezing','ready')) as active_batches
  from recipes r
  join categories c on c.id = r.category_id
  join bases b      on b.id = r.base_id
  left join recipe_ratings rr on rr.recipe_id = r.id;

-- ---------- row level security ----------
-- Single shared household account. Safe ONLY while public signup is disabled
-- in the Supabase dashboard: Authentication → Providers → Email → "Enable sign ups" OFF.

alter table categories         enable row level security;
alter table ingredients        enable row level security;
alter table bases              enable row level security;
alter table base_ingredients   enable row level security;
alter table recipes            enable row level security;
alter table recipe_ingredients enable row level security;
alter table batches            enable row level security;
alter table tasting_notes      enable row level security;
alter table plan_items         enable row level security;
alter table shopping_extras    enable row level security;
alter table shopping_checks    enable row level security;
alter table app_settings       enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','ingredients','bases','base_ingredients','recipes',
    'recipe_ingredients','batches','tasting_notes','plan_items',
    'shopping_extras','shopping_checks','app_settings'
  ]
  loop
    execute format(
      'create policy household_all on %I for all to authenticated using (true) with check (true)', t
    );
  end loop;
end $$;

-- Seeded reference rows are protected from deletion; they can still be edited.
create policy no_delete_seed_ingredients on ingredients
  for delete to authenticated using (is_seed = false);

insert into app_settings (id) values (1) on conflict do nothing;
```

Note the policy ordering: `household_all` grants delete on `ingredients`, and `no_delete_seed_ingredients` restricts it. Postgres combines permissive policies with `OR`, so **this does not actually block anything** — it is written this way for clarity. To genuinely prevent seed deletion, drop `delete` from the `household_all` policy on `ingredients` and add an explicit permissive delete policy with `using (is_seed = false)`. Task 6 covers getting this right and testing it.

---

## TypeScript types

`src/types/database.types.ts` is generated, never hand-written:

```bash
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```

Regenerate it after every migration. `src/types/domain.ts` holds the hand-written shapes the app works with — the assembled recipe, the macro result, and so on. Those are defined in `docs/04-macro-engine.md` and `docs/05-feature-recipes.md`.

---

## Seeding

`scripts/generate-seed-sql.ts` reads `seed/*.json` and emits idempotent SQL into `supabase/seed/`. Written so it can be re-run safely:

1. `categories` — insert on conflict (key) do update
2. `ingredients` — same, on `slug`, with `is_seed = true`
3. `bases` — same, on `key`, resolving `fill_ingredient` and `is_variation_of` by lookup
4. `base_ingredients` — delete then re-insert per base
5. `recipes` — insert on conflict (slug) do nothing, `is_seed = true`
6. `recipe_ingredients` — only for recipes that were just inserted

Step 5 uses `do nothing` rather than `do update` on purpose: re-running the seed must never overwrite an edit made in the app. Steps 1–4 do update, because a corrected ingredient value should propagate.

Emit SQL rather than running inserts through the client. It is reviewable, it goes in version control, and it applies with the same tool as the migrations.
