/*
# Restrict user directory search

1. Changes
   - `search_profiles(p_query text)` now requires a query of at least 3 characters,
     escapes LIKE wildcards so `%` cannot be used to match everything, matches names
     by prefix and emails exactly, and returns at most 10 rows.

2. Security
   - Prevents any signed-in project admin from dumping the full name/email directory
     of every account in the system.

3. Notes
   1. Legitimate use (typing a colleague's name or full email when inviting them to a
      project) continues to work unchanged.
*/

CREATE OR REPLACE FUNCTION public.search_profiles(p_query text)
RETURNS TABLE(id uuid, name text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_q text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM project_operators po
    WHERE po.user_id = auth.uid() AND po.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Not authorized: admin role required';
  END IF;

  v_q := btrim(coalesce(p_query, ''));

  -- Require a meaningful query: no enumerating the directory with one character.
  IF length(v_q) < 3 THEN
    RETURN;
  END IF;

  -- Neutralise LIKE metacharacters so '%' cannot match every row.
  v_q := replace(replace(replace(v_q, '\', '\\'), '%', '\%'), '_', '\_');

  RETURN QUERY
  SELECT p.id, p.name, p.email
  FROM profiles p
  WHERE p.name ILIKE v_q || '%' ESCAPE '\'
     OR lower(p.email) = lower(btrim(coalesce(p_query, '')))
  ORDER BY p.name
  LIMIT 10;
END;
$function$;
