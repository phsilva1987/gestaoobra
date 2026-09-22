import type { ProjectData } from '../types';

const BACKUP_VERSION = 1;
export const BACKUP_APP = 'gestaoobra';

export interface BackupEnvelope {
  version: number;
  exportedAt: string;
  app: string;
  data: {
    projects: ProjectData[];
    selectedProjectId: string;
  };
}

interface LegacyEnvelope {
  app?: string;
  formato?: string;
  exportadoEm?: string;
  dados?: unknown;
}

interface LegacyDB {
  projects?: unknown[];
  selectedProjectId?: string;
  obra?: unknown[];
  config?: Record<string, unknown>;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function ensureProjectShape(raw: unknown): ProjectData | null {
  if (!isObject(raw)) return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.id !== 'string' && typeof p.id !== 'number') return null;
  return {
    id: String(p.id),
    nome: typeof p.nome === 'string' ? p.nome : (isObject(p.config) && typeof p.config.projeto === 'string' ? p.config.projeto : 'Nova Obra'),
    tipo: typeof p.tipo === 'string' ? p.tipo : 'Outro',
    status: typeof p.status === 'string' ? p.status : 'Planejamento',
    coverImage: typeof p.coverImage === 'string' ? p.coverImage : '',
    config: isObject(p.config) ? p.config as unknown as ProjectData['config'] : { empresa: '', projeto: '', documento: '', responsavel: '', telefone: '', email: '', endereco: '', cidade: '', respObra: '', orcamento: 0, inicio: '', fim: '' },
    obra: asArray(p.obra) as ProjectData['obra'],
    profissionais: asArray(p.profissionais) as ProjectData['profissionais'],
    jobs: asArray(p.trabalhos ?? p.jobs) as ProjectData['jobs'],
    materiais: asArray(p.materiais) as ProjectData['materiais'],
    equipamentos: asArray(p.equipamentos) as ProjectData['equipamentos'],
    fornecedores: asArray(p.fornecedores) as ProjectData['fornecedores'],
    categoriasObra: asArray(p.categoriasObra) as string[],
    categoriasObraExtra: asArray(p.categoriasObraExtra) as string[],
    categoriasMaterial: asArray(p.categoriasMaterial) as string[],
    categoriasMaterialExtra: asArray(p.categoriasMaterialExtra) as string[],
    imprevistos: asArray(p.imprevistos) as ProjectData['imprevistos'],
    pagamentos: asArray(p.pagamentos) as ProjectData['pagamentos'],
    admin: asArray(p.admin) as ProjectData['admin'],
    checklist: asArray(p.checklist) as ProjectData['checklist'],
  };
}

export function buildBackup(projects: ProjectData[], selectedProjectId: string): BackupEnvelope {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: BACKUP_APP,
    data: { projects, selectedProjectId },
  };
}

export function downloadBackup(projects: ProjectData[], selectedProjectId: string): void {
  const env = buildBackup(projects, selectedProjectId);
  const json = JSON.stringify(env, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `gestaoobra-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function convertLegacy(db: LegacyDB): { projects: ProjectData[]; selectedProjectId: string } {
  if (Array.isArray(db.projects) && db.projects.length) {
    const projects = db.projects.map(ensureProjectShape).filter(Boolean) as ProjectData[];
    const selectedProjectId = typeof db.selectedProjectId === 'string' ? db.selectedProjectId : (projects[0]?.id ?? '');
    return { projects, selectedProjectId };
  }
  // Single-project legacy (V11): wrap into a project
  const proj = ensureProjectShape({
    id: 'proj_legacy',
    nome: isObject(db.config) && typeof db.config.projeto === 'string' ? db.config.projeto : 'Reforma (legado)',
    tipo: 'Outro',
    status: 'Em andamento',
    config: db.config ?? {},
    obra: db.obra ?? [],
    profissionais: [],
    trabalhos: [],
    materiais: [],
    equipamentos: [],
    fornecedores: [],
    imprevistos: [],
    pagamentos: [],
    admin: [],
    checklist: [],
  });
  return { projects: proj ? [proj] : [], selectedProjectId: proj ? proj.id : '' };
}

export interface RestoreSummary {
  projects: ProjectData[];
  selectedProjectId: string;
  projectCount: number;
  stageCount: number;
  jobCount: number;
  materialCount: number;
  equipmentCount: number;
  supplierCount: number;
}

export interface RestoreResult {
  ok: boolean;
  error?: string;
  summary?: RestoreSummary;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
  summary?: RestoreSummary;
}

function validateIntegrity(projects: ProjectData[], selectedProjectId: string): string | null {
  if (!Array.isArray(projects)) return 'projects não é um array válido.';
  if (projects.length === 0) return 'O backup não contém nenhum projeto.';

  for (const p of projects) {
    const stageIds = new Set(p.obra.map((s) => String(s.id)));
    const profIds = new Set(p.profissionais.map((pr) => String(pr.id)));
    const supplierIds = new Set(p.fornecedores.map((f) => String(f.id)));

    for (const j of p.jobs) {
      if (!stageIds.has(String(j.etapa_id)))
        return `Projeto "${p.nome}": trabalho ${j.id} referencia etapa inexistente (${j.etapa_id}).`;
      if (!profIds.has(String(j.profissional_id)))
        return `Projeto "${p.nome}": trabalho ${j.id} referencia profissional inexistente (${j.profissional_id}).`;
    }
    for (const m of p.materiais) {
      if (!stageIds.has(String(m.etapa_id)))
        return `Projeto "${p.nome}": material "${m.nome}" referencia etapa inexistente (${m.etapa_id}).`;
      if (m.fornecedorId && !supplierIds.has(String(m.fornecedorId)))
        return `Projeto "${p.nome}": material "${m.nome}" referencia fornecedor inexistente (${m.fornecedorId}).`;
    }
    for (const e of p.equipamentos) {
      if (!stageIds.has(String(e.etapa_id)))
        return `Projeto "${p.nome}": equipamento "${e.nome}" referencia etapa inexistente (${e.etapa_id}).`;
      if (e.fornecedorId && !supplierIds.has(String(e.fornecedorId)))
        return `Projeto "${p.nome}": equipamento "${e.nome}" referencia fornecedor inexistente (${e.fornecedorId}).`;
    }
  }

  if (!projects.some((p) => p.id === selectedProjectId))
    return 'O projeto selecionado no backup não existe entre os projetos.';

  return null;
}

function makeSummary(projects: ProjectData[], selectedProjectId: string): RestoreSummary {
  return {
    projects,
    selectedProjectId,
    projectCount: projects.length,
    stageCount: projects.reduce((a, p) => a + p.obra.length, 0),
    jobCount: projects.reduce((a, p) => a + p.jobs.length, 0),
    materialCount: projects.reduce((a, p) => a + p.materiais.length, 0),
    equipmentCount: projects.reduce((a, p) => a + p.equipamentos.length, 0),
    supplierCount: projects.reduce((a, p) => a + p.fornecedores.length, 0),
  };
}

export function parseBackup(text: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Arquivo inválido: não é um JSON válido.' };
  }

  if (!isObject(parsed))
    return { ok: false, error: 'Arquivo inválido: conteúdo não é um objeto.' };

  // New versioned format
  if (typeof (parsed as Record<string, unknown>).version === 'number' && isObject((parsed as Record<string, unknown>).data)) {
    const env = parsed as unknown as BackupEnvelope;
    if (env.app !== BACKUP_APP && env.app !== 'norematiReforma')
      return { ok: false, error: 'Este arquivo não foi gerado por este sistema.' };
    const data = env.data;
    if (!Array.isArray(data.projects))
      return { ok: false, error: 'Backup inválido: campo "projects" ausente ou inválido.' };
    const projects = data.projects.map(ensureProjectShape).filter(Boolean) as ProjectData[];
    if (!projects.length)
      return { ok: false, error: 'Backup inválido: nenhum projeto válido encontrado.' };
    const err = validateIntegrity(projects, data.selectedProjectId || projects[0].id);
    if (err) return { ok: false, error: err };
    return { ok: true, summary: makeSummary(projects, data.selectedProjectId || projects[0].id) };
  }

  // Legacy format: { dados: db } or raw db
  let dbRaw: unknown = parsed;
  if (isObject((parsed as LegacyEnvelope).dados))
    dbRaw = (parsed as LegacyEnvelope).dados;

  const db = dbRaw as LegacyDB;
  if (!isObject(db) || (!Array.isArray(db.projects) && !Array.isArray(db.obra)))
    return { ok: false, error: 'Este arquivo não parece ser um backup válido deste sistema.' };

  const { projects, selectedProjectId } = convertLegacy(db);
  if (!projects.length)
    return { ok: false, error: 'Backup legado inválido: nenhum projeto pôde ser extraído.' };

  const err = validateIntegrity(projects, selectedProjectId);
  if (err) return { ok: false, error: err };
  return { ok: true, summary: makeSummary(projects, selectedProjectId) };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsText(file);
  });
}
