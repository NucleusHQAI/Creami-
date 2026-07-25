-- ============================================================
-- 0002_fix_seed_ingredient_delete_policy.sql
-- ============================================================
--
-- Task 6 (docs/10-task-backlog.md): the blanket household_all policy on
-- ingredients grants delete to any authenticated user, including on seeded
-- rows. Postgres combines permissive policies with OR, so a separate "no
-- delete" policy cannot override it. Replace household_all on ingredients
-- with a version that excludes delete, then add an explicit delete policy
-- restricted to non-seed rows.

drop policy household_all on ingredients;

create policy household_all on ingredients
  for select to authenticated using (true);

create policy household_insert_ingredients on ingredients
  for insert to authenticated with check (true);

create policy household_update_ingredients on ingredients
  for update to authenticated using (true) with check (true);

create policy household_delete_nonseed_ingredients on ingredients
  for delete to authenticated using (is_seed = false);
