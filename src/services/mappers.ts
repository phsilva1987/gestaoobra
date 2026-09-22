import type { ProjectData, ProjectConfig, Supplier } from '../types';

export interface ProjectRow {
  id: string;
  name: string;
  type: string;
  status: string;
  empresa: string;
  documento: string;
  responsavel: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  resp_obra: string;
  orcamento: number;
  data_inicio: string | null;
  data_fim: string | null;
  cover_image_path: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierRow {
  id: string;
  project_id: string;
  nome: string;
  telefone: string;
  email: string;
  site: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  project_id: string | null;
  type: string;
  name: string;
  is_global: boolean;
  created_at: string;
}

export function mapProjectFromDb(row: ProjectRow): ProjectData {
  const config: ProjectConfig = {
    empresa: row.empresa || '',
    projeto: row.name,
    documento: row.documento || '',
    responsavel: row.responsavel || '',
    telefone: row.telefone || '',
    email: row.email || '',
    endereco: row.endereco || '',
    cidade: row.cidade || '',
    respObra: row.resp_obra || '',
    orcamento: Number(row.orcamento) || 0,
    inicio: row.data_inicio || '',
    fim: row.data_fim || '',
  };
  return {
    id: row.id,
    nome: row.name,
    tipo: row.type || '',
    status: row.status || 'Planejamento',
    coverImage: row.cover_image_path || '',
    config,
    obra: [],
    profissionais: [],
    jobs: [],
    materiais: [],
    equipamentos: [],
    fornecedores: [],
    categoriasObra: [],
    categoriasObraExtra: [],
    categoriasMaterial: [],
    categoriasMaterialExtra: [],
    imprevistos: [],
    pagamentos: [],
    admin: [],
    checklist: [],
  };
}

export function mapProjectToDb(data: {
  nome: string;
  tipo: string;
  status: string;
  coverImage?: string;
  config: ProjectConfig;
}) {
  return {
    name: data.nome,
    type: data.tipo,
    status: data.status,
    empresa: data.config.empresa,
    documento: data.config.documento,
    responsavel: data.config.responsavel,
    telefone: data.config.telefone,
    email: data.config.email,
    endereco: data.config.endereco,
    cidade: data.config.cidade,
    resp_obra: data.config.respObra,
    orcamento: data.config.orcamento,
    data_inicio: data.config.inicio || null,
    data_fim: data.config.fim || null,
    cover_image_path: data.coverImage || '',
  };
}

export function mapSupplierFromDb(row: SupplierRow): Supplier {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone || '',
    email: row.email || '',
    site: row.site || '',
  };
}

export function mapSupplierToDb(data: {
  nome: string;
  telefone: string;
  email: string;
  site: string;
}) {
  return {
    nome: data.nome,
    telefone: data.telefone || '',
    email: data.email || '',
    site: data.site || '',
  };
}
