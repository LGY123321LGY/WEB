insert into public.access_requests (email, github_username, status, source, reviewed_at)
values ('lyin01864@gmail.com', 'LGY123321LGY', 'approved', 'initial_admin_seed', now())
on conflict do nothing;

comment on table public.profiles is 'The first admin is LGY123321LGY <lyin01864@gmail.com>. After GitHub OAuth login, the app upserts this account as admin; approve the profile status in Supabase if RLS blocks workspace writes.';
