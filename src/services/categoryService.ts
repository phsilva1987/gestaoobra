import { supabase } from '../lib/supabase';
import type { CategoryRow } from './mappers';

export interface ProjectCategories {
  categoriasObra: string[];
  categoriasObraExtra: string[];
  categoriasMaterial: string[];
  categoriasMaterialExtra: string[];
}

export async function getCategories(
  projectId: string
): Promise<ProjectCategories> {
  const { data: projectCats, error } = await supabase
    .from('categories')
    .select('*')
    .or(`project_id.eq.${projectId},project_id.is.null`)
    .order('name', { ascending: true });

  if (error) throw error;

  const rows = (projectCats || []) as CategoryRow[];

  const categoriasObra: string[] = [];
  const categoriasObraExtra: string[] = [];
  const categoriasMaterial: string[] = [];
  const categoriasMaterialExtra: string[] = [];

  for (const c of rows) {
    if (c.type === 'obra') {
      if (c.is_global || c.project_id === null) {
        categoriasObra.push(c.name);
      } else {
        categoriasObraExtra.push(c.name);
      }
    } else if (c.type === 'material') {
      if (c.is_global || c.project_id === null) {
        categoriasMaterial.push(c.name);
      } else {
        categoriasMaterialExtra.push(c.name);
      }
    }
  }

  return {
    categoriasObra,
    categoriasObraExtra,
    categoriasMaterial,
    categoriasMaterialExtra,
  };
}

export async function createCategory(
  projectId: string,
  type: 'obra' | 'material',
  name: string
): Promise<CategoryRow> {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      project_id: projectId,
      type,
      name: name.trim(),
      is_global: false,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as CategoryRow;
}

export async function deleteCategory(
  categoryId: string
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) throw error;
}

export async function deleteCategoryByName(
  projectId: string,
  type: 'obra' | 'material',
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('project_id', projectId)
    .eq('type', type)
    .eq('name', name);

  if (error) throw error;
}
