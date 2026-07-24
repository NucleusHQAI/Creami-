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
  max_fill_ml                int  not null default 680 check (max_fill_ml between 100 and 2000),
  freeze_hours               int  not null default 24  check (freeze_hours between 1 and 168),
  default_milk_ingredient_id uuid references ingredients(id) on delete set null,
  servings_per_tub           int  not null default 2 check (servings_per_tub > 0),
  standard_method            text not null default
    'Blend the base and flavour additions until completely smooth. Fill only to your Deluxe MAX FILL line. Freeze flat for at least 24 hours with the surface level. Process on LITE ICE CREAM. If powdery, add 15–30ml milk and RE-SPIN. Make a narrow hole to the bottom, add the extras and run MIX-IN once.',
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
  select r.id, r.slug, r.name, r.profile, r.is_favourite, r.archived_at,
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

insert into app_settings (id) values (1) on conflict do nothing;
