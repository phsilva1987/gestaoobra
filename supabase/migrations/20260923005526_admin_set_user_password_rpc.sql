/*
# Admin password reset fallback

1. New function
   - `admin_set_user_password(p_user_id uuid, p_password text)`: updates the
     `encrypted_password` column in `auth.users` directly using `crypt()` with
     a bcrypt salt.

2. Security
   - SECURITY DEFINER, executable only by `authenticated` + `service_role`.
   - Internally checks that the caller (auth.uid()) has role 'admin' in
     public.profiles before proceeding.
   - Rejects if the target is the caller themselves.

3. Notes
   1. This is a fallback for the Supabase Auth Admin API's `updateUserById`,
      which can fail with "Database error loading user" when the auth.identities
      row was inserted manually rather than by GoTrue.
   2. The password is hashed with the same bcrypt scheme (bf, cost 6) that
      Supabase Auth uses, so the resulting hash is compatible.
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
BEGIN
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
