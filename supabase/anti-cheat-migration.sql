-- GrowIt anti-cheat migration
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor → New query → Run)
-- AFTER the app is redeployed, so the new columns match the new code.

alter table public.completions
  add column if not exists honesty text not null default 'full';
alter table public.completions
  add column if not exists note text not null default '';

alter table public.profile
  add column if not exists last_completed_at bigint;
alter table public.profile
  add column if not exists verified_streak integer not null default 0;