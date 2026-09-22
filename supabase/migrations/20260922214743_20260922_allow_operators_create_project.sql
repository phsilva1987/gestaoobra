/*
# Allow operators to create projects

## Change
create_project() now allows both 'admin' and 'operator' global roles to create projects.
The creator always becomes project_operators.role = 'admin' for that project.
profiles.role is NOT changed — operator stays operator globally.
*/

CREATE OR REPLACE FUNCTION public.create_project(
  p_name text,
  p_type text DEFAULT 'Outro',
  p_orcamento numeric DEFAULT 0,
  p_data_inicio date DEFAULT NULL,
  p_data_fim date DEFAULT NULL
)
RETURNS public.projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_project public.projects;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = '42501';
  END IF;

  -- Both admin and operator can create projects
  IF v_profile.role NOT IN ('admin', 'operator') THEN
    RAISE EXCEPTION 'Perfil invalido para criacao de projeto' USING ERRCODE = '42501';
  END IF;

  IF p_name IS NULL OR btrim(p_name) = '' THEN
    RAISE EXCEPTION 'Project name is required' USING ERRCODE = '23502';
  END IF;

  INSERT INTO public.projects (name, type, orcamento, data_inicio, data_fim)
  VALUES (p_name, p_type, p_orcamento, p_data_inicio, p_data_fim)
  RETURNING * INTO v_project;

  -- Creator always becomes admin of the project
  INSERT INTO public.project_operators (project_id, user_id, role)
  VALUES (v_project.id, v_user_id, 'admin');

  RETURN v_project;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_project(text, text, numeric, date, date) TO authenticated;
