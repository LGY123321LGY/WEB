-- Use this only during the first setup if the initial migration stopped halfway.
-- It removes the workspace schema objects created by this project, then lets you rerun migrations cleanly.

drop table if exists public.paper_projects cascade;
drop table if exists public.research_notes cascade;
drop table if exists public.study_sessions cascade;
drop table if exists public.learning_phases cascade;
drop table if exists public.artifacts cascade;
drop table if exists public.experiments cascade;
drop table if exists public.papers cascade;
drop table if exists public.tasks cascade;
drop table if exists public.projects cascade;
drop table if exists public.admin_audit_logs cascade;
drop table if exists public.access_requests cascade;
drop table if exists public.profiles cascade;

drop function if exists public.is_approved_member() cascade;
drop function if exists public.is_admin() cascade;
drop function if exists public.touch_updated_at() cascade;

drop type if exists public.access_request_status cascade;
drop type if exists public.member_status cascade;
drop type if exists public.member_role cascade;
