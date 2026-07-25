-- Existing seeded databases may still have the empty settings value created
-- by 0001. Fill it once without overwriting a milk selected in the app.
update app_settings
set default_milk_ingredient_id = (
  select id
  from ingredients
  where slug = 'semi-skimmed-milk'
)
where id = 1
  and default_milk_ingredient_id is null
  and exists (
    select 1
    from ingredients
    where slug = 'semi-skimmed-milk'
  );
