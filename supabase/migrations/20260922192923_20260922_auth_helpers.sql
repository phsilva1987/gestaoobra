/*
# Auth helpers + profile auto-creation

## Overview
Creates security helper functions and a trigger that auto-creates a profile
row whenever a new user signs up via Supabase Auth.

## New objects
1. `is_project_member(project_id uuid)` — SECURITY DEFINER function, returns true
   if the calling user (auth.uid()) has a row in project_operators for that project.
   Uses an explicit JOIN with SECURITY DEFINER to bypass RLS on project_operators,
   avoiding recursive policy evaluation.
2. `is_project_admin(project_id uuid)` — same pattern, checks role = 'admin'.
3. `handle_new_user()` — trigger function that inserts a profile row with role='operator'
   when a new auth.users row is created.
4. Trigger `on_auth_user_created` on auth.users AFTER INSERT.

## Security
- Both helper functions are SECURITY DEFINER with `SET search_path = public`.
- They run with the function owner's privileges, bypassing RLS on project_operators.
- This is the anti-recursion strategy: policies on project_operators can call
  these functions without causing infinite recursion.
- New users default to role='operator'. Admin must be promoted manually in the DB.

## Bootstrap procedure for first admin
1. Create a user via Supabase Auth (Dashboard > Authentication > Users > Add user).
2. In Supabase Dashboard > SQL Editor, run:
     UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
3. Optionally insert the first project_operators row:
     INSERT INTO public.project_operators (project_id, user_id, role)
     SELECT p.id, u.id, 'admin'
     FROM public.profiles u, public.projects p
     WHERE u.email = 'your-email@example.com' AND p.name = 'Your Project';
*/

-- ============================================================
-- 1. is_project_member — check if current user belongs to project
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_operators
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
  );
$$;

-- ============================================================
-- 2. is_project_admin — check if current user is admin of project
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_project_admin(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_operators
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- ============================================================
-- 3. handle_new_user — auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.email, ''),
    'operator'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. Trigger on auth.users
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
