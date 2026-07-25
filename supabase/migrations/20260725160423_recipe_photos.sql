alter table public.recipes
  add column image_path text
  constraint recipes_image_path_length check (
    image_path is null or char_length(image_path) <= 512
  );

-- Existing seed artwork ships with the app. User-added photos use paths in
-- the recipe-images Storage bucket.
update public.recipes
set image_path = '/recipe-images/' || slug || '.webp'
where is_seed = true and image_path is null;

create or replace view public.recipe_list_view as
  select r.id, r.slug, r.name, r.profile, r.is_favourite, r.archived_at,
         r.created_at, r.updated_at,
         c.key as category_key, c.label as category_label,
         c.emoji, c.accent, c.tint,
         b.key as base_key, b.name as base_name,
         rr.average_rating, rr.rating_count,
         (select count(*) from batches bt
           where bt.recipe_id = r.id and bt.status in ('freezing','ready')) as active_batches,
         r.image_path
  from public.recipes r
  join public.categories c on c.id = r.category_id
  join public.bases b      on b.id = r.base_id
  left join public.recipe_ratings rr on rr.recipe_id = r.id;

alter view public.recipe_list_view set (security_invoker = true);

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'recipe-images',
  'recipe-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy recipe_images_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'recipe-images');

create policy recipe_images_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'recipe-images');
