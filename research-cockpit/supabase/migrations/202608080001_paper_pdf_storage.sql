alter table public.papers
  add column if not exists pdf_path text,
  add column if not exists pdf_url text,
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists mime_type text;

update public.papers
set pdf_url = url
where pdf_url is null and url is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'papers_file_size_nonnegative'
  ) then
    alter table public.papers
      add constraint papers_file_size_nonnegative check (file_size >= 0);
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('papers', 'papers', false, 52428800, array['application/pdf'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "approved users select own paper pdfs" on storage.objects;
create policy "approved users select own paper pdfs"
on storage.objects for select to authenticated
using (
  bucket_id = 'papers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_member()
);

drop policy if exists "approved users insert own paper pdfs" on storage.objects;
create policy "approved users insert own paper pdfs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'papers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_member()
);

drop policy if exists "approved users update own paper pdfs" on storage.objects;
create policy "approved users update own paper pdfs"
on storage.objects for update to authenticated
using (
  bucket_id = 'papers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_member()
)
with check (
  bucket_id = 'papers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_member()
);

drop policy if exists "approved users delete own paper pdfs" on storage.objects;
create policy "approved users delete own paper pdfs"
on storage.objects for delete to authenticated
using (
  bucket_id = 'papers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.is_approved_member()
);
