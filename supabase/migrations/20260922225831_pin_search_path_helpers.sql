/*
# Pin the schema lookup path on trigger helper functions

1. Changes
   - `set_updated_at()` and `protect_profile_role()` now declare `SET search_path = public`.

2. Security
   - Without a fixed search path, a caller-controlled path could make these functions
     resolve objects from an unexpected schema.
*/

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
