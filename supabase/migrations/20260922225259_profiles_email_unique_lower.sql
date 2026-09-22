/*
# Enforce one profile per e-mail address

1. Changes
   - Add a unique index on `lower(email)` for `public.profiles`.

2. Security
   - Stops two accounts existing whose e-mail differs only by capitalisation, which
     would make any lookup by e-mail ambiguous and could route a project invitation
     to the wrong account.

3. Notes
   1. Verified there are currently no duplicate addresses, so the index is created
      without affecting existing data.
*/

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_key
  ON public.profiles (lower(email));
