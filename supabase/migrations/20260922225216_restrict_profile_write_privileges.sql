/*
# Lock down writes to the profiles table

1. Changes
   - Revoke INSERT, UPDATE and DELETE on `public.profiles` from the `anon` and
     `authenticated` roles.
   - Re-grant UPDATE on the `name` column only to `authenticated`, so a signed-in
     user can still rename themselves (row policies still limit them to their own row).

2. Security
   - Removes the ability for any signed-in user to write `role` or `email` on a
     profile row through the data API. Privilege level is now changed only by
     server-side (service role) code.

3. Notes
   1. The application never inserts or deletes profile rows from the browser: rows are
      created by the `handle_new_user` trigger and by the admin edge functions, which
      run as the service role and are unaffected by these grants.
*/

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;

GRANT UPDATE (name) ON public.profiles TO authenticated;
