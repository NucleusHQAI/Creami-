-- Task 49: protected source attribution and data-driven online-recipe adaptation rules.

create table public.recipe_sources (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  source_url text,
  source_title text,
  source_site text,
  adaptation_summary text,
  retrieved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint recipe_sources_has_source
    check (nullif(btrim(source_url), '') is not null or nullif(btrim(source_title), '') is not null),
  constraint recipe_sources_web_url
    check (source_url is null or source_url ~* '^https?://')
);

create index recipe_sources_recipe_id_idx on public.recipe_sources(recipe_id);

create table public.adaptation_rules (
  id uuid primary key default gen_random_uuid(),
  match_term text not null,
  action text not null check (action in ('map', 'omit', 'base_hint')),
  replacement_ingredient_id uuid references public.ingredients(id) on delete restrict,
  suggested_base_id uuid references public.bases(id) on delete restrict,
  suggested_role text check (suggested_role in ('addition', 'mixin')),
  reason text not null,
  priority int not null default 0,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint adaptation_rules_action_values check (
    (action = 'map' and replacement_ingredient_id is not null and suggested_base_id is null)
    or (action = 'omit' and replacement_ingredient_id is null and suggested_base_id is null)
    or (action = 'base_hint' and replacement_ingredient_id is null and suggested_base_id is not null)
  )
);

create unique index adaptation_rules_normalised_match_term_idx
  on public.adaptation_rules(lower(btrim(match_term)));
create index adaptation_rules_replacement_ingredient_id_idx
  on public.adaptation_rules(replacement_ingredient_id)
  where replacement_ingredient_id is not null;
create index adaptation_rules_suggested_base_id_idx
  on public.adaptation_rules(suggested_base_id)
  where suggested_base_id is not null;

create trigger t_adaptation_rules_updated
  before update on public.adaptation_rules
  for each row execute function public.set_updated_at();

alter table public.recipe_sources enable row level security;
alter table public.adaptation_rules enable row level security;

create policy household_all on public.recipe_sources
  for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);
create policy household_all on public.adaptation_rules
  for all to authenticated
  using ((select auth.uid()) is not null)
  with check ((select auth.uid()) is not null);

grant select, insert, update, delete on table public.recipe_sources to authenticated;
grant select, insert, update, delete on table public.adaptation_rules to authenticated;

insert into public.adaptation_rules (
  match_term,
  action,
  replacement_ingredient_id,
  suggested_base_id,
  suggested_role,
  reason,
  priority,
  is_seed
)
select rule.match_term,
       rule.action,
       ingredient.id,
       base.id,
       rule.suggested_role,
       rule.reason,
       rule.priority,
       true
from (
  values
    ('yogurt', 'map', 'greek-yoghurt-0', null, 'addition',
      'Uses the existing 0% Greek yoghurt from your UK ingredient library.', 90),
    ('pb2', 'map', 'peanut-butter-powdered', null, 'addition',
      'Uses generic powdered peanut butter already in your ingredient library.', 100),
    ('graham cracker', 'map', 'digestive-light', null, 'mixin',
      'Light digestive biscuit is the closest existing UK-style replacement.', 100),
    ('instant pudding mix', 'omit', null, null, null,
      'Your selected base already supplies sweetness and structure.', 100),
    ('sugar-free pudding mix', 'omit', null, null, null,
      'Your selected base already supplies sweetness and structure.', 110),
    ('milk', 'base_hint', null, 'everyday', null,
      'Milk is supplied by the selected base and its derived freezer fill.', 20),
    ('protein powder', 'base_hint', null, 'everyday', null,
      'Protein powder is already supplied by the selected base.', 40),
    ('heavy cream', 'base_hint', null, 'dessert', null,
      'The Dessert-style base supplies richness without copying US heavy cream.', 80),
    ('half-and-half', 'base_hint', null, 'dessert', null,
      'The Dessert-style base supplies the dairy structure this line provides.', 80),
    ('cool whip', 'base_hint', null, 'dessert', null,
      'The Dessert-style base supplies body and sweetness without branded topping.', 80),
    ('birthday cake', 'base_hint', null, 'everyday', null,
      'Everyday creamy is the clearest starting point for a cake flavour.', 90),
    ('cheesecake', 'base_hint', null, 'cheesecake', null,
      'The Cheesecake base already supplies the characteristic dairy structure.', 120),
    ('cream cheese', 'base_hint', null, 'cheesecake', null,
      'Cream cheese is already represented by the Cheesecake base.', 110),
    ('coconut', 'base_hint', null, 'coconut', null,
      'The Coconut base supplies the intended coconut dairy profile.', 100),
    ('chocolate', 'base_hint', null, 'choc', null,
      'Chocolate creamy supplies the chocolate protein base.', 100),
    ('cocoa', 'base_hint', null, 'choc', null,
      'Chocolate creamy is the strongest base match for cocoa recipes.', 90),
    ('strawberry', 'base_hint', null, 'fruit', null,
      'Fruit and yoghurt leaves room for blended strawberries.', 80),
    ('raspberry', 'base_hint', null, 'fruit', null,
      'Fruit and yoghurt leaves room for blended raspberries.', 80),
    ('blueberry', 'base_hint', null, 'fruit', null,
      'Fruit and yoghurt leaves room for blended blueberries.', 80),
    ('banana', 'base_hint', null, 'fruit', null,
      'Fruit and yoghurt leaves room for blended banana.', 80),
    ('mango', 'base_hint', null, 'fruit', null,
      'Fruit and yoghurt leaves room for blended mango.', 80),
    ('coffee', 'base_hint', null, 'everyday', null,
      'Everyday creamy is the standard base for coffee flavours.', 60)
) as rule(match_term, action, ingredient_slug, base_key, suggested_role, reason, priority)
left join public.ingredients ingredient on ingredient.slug = rule.ingredient_slug
left join public.bases base on base.key = rule.base_key;
