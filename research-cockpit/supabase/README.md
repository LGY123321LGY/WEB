# Supabase setup

Project URL:

```text
https://sqeqiqqzslhpoazlcfkl.supabase.co
```

Initial admin:

```text
GitHub username: LGY123321LGY
Email: lyin01864@gmail.com
```

## Apply database schema

Open Supabase Dashboard, then go to SQL Editor and run these files in order:

1. `supabase/migrations/202607300001_initial_workspace.sql`
2. `supabase/migrations/202607300002_seed_admin.sql`

## Configure GitHub login

In Supabase Dashboard, go to Authentication > Providers > GitHub and enable GitHub.

Use the OAuth app values from GitHub:

- Client ID can be copied into Supabase.
- Client Secret must be pasted directly into Supabase. Do not share it in chat or commit it to Git.

Set the GitHub OAuth callback URL to the callback URL shown by Supabase in the GitHub provider settings.

## Local frontend env

The local app reads:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Never put `service_role`, database passwords, SSH keys, or OAuth secrets in frontend env files.
