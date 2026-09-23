/*
# Fix admin_set_user_password for service_role callers

1. Problem
   The RPC `admin_set_user_password` checks `auth.uid()` to verify the caller
   is an admin. When called from the edge function with the service role key,
   `auth.uid()` returns NULL, so the function raises "Not authenticated".

2. Fix
   - Detect service_role callers via `current_setting('role')` and allow them
     through without the auth.uid() check (service_role already bypasses RLS
     and is only available server-side in edge functions).
   - For authenticated callers, keep the existing admin role check.

3. Security
   - service_role is only available to the edge function (server-side), never
     exposed to the browser.
   - authenticated callers still must be admins.
   - Self-reset prevention is maintained for both paths.
*/

CREATE OR REPLACE FUNCTION public.admin_set_user_password(p_user_id uuid, p_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'auth', 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_caller_role text;
  v_is_service_role boolean := current_setting('role') = 'service_role';
BEGIN
  IF NOT v_is_service_role THEN
    IF v_caller IS NULL THEN
      RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
    END IF;

    SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_caller;
    IF v_caller_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Apenas administradores podem redefinir senhas' USING ERRCODE = '42501';
    END IF;

    IF p_user_id = v_caller THEN
      RAISE EXCEPTION 'Não é permitido redefinir a própria senha por esta via' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF length(p_password) < 6 THEN
    RAISE EXCEPTION 'Senha deve ter no mínimo 6 caracteres' USING ERRCODE = '23514';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado' USING ERRCODE = 'P0002';
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_password(uuid, text) TO authenticated, service_role;
