export interface ProjectConfig {
  empresa: string;
  projeto: string;
  documento: string;
  responsavel: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  respObra: string;
  orcamento: number;
  inicio: string;
  fim: string;
}

export interface Stage {
  id: string;
  nome: string;
  categoria: string;
  prioridade: string;
  dependencia: string;
  status: string;
  progresso: number;
  previsto: number;
  inicio: string;
  fim: string;
  profissionalId: string | null;
  observacao: string;
  fimReal: string;
  checkServico: boolean;
  checkConferido: boolean;
  checkLimpo: boolean;
  checkPagamento: boolean;
  checkPendencias: boolean;
}

export interface Professional {
  id: string;
  nome: string;
  servico: string;
  telefone: string;
  email: string;
  status: string;
}

export interface Job {
  id: string;
  etapa_id: string;
  profissional_id: string;
  valor: number;
  pago: number;
  forma: string;
  parcelas: string;
  chavePix: string;
  valorParcela: number | null;
  status: string;
}

export interface Material {
  id: string;
  etapa_id: string;
  nome: string;
  categoria: string;
  fornecedorId: string;
  quantidade: number;
  unidade: string;
  unitario: number;
  pago: number;
  data: string;
  status: string;
}

export interface Equipment {
  id: string;
  etapa_id: string;
  nome: string;
  quantidade: number;
  valor: number;
  fornecedorId: string;
  forma: string;
  chavePix: string;
  parcelas: string;
  valorParcela: number | null;
  compra: string;
  entrega: string;
  status: string;
}

export interface Payment {
  id: string;
  referencia: string;
  tipo: string;
  valor: number;
  vencimento: string;
  forma: string;
  status: string;
}

export interface Unforeseen {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  impactoDias: number;
  status: string;
}

export interface ChecklistItem {
  id: string;
  nome: string;
  feito: boolean;
  auto: boolean;
  sourceObraId: string | null;
}

export type AdminRecurrenceType = 'ONE_TIME' | 'MONTHLY' | 'ANNUAL' | null;
export type AdminStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminItem {
  id: string;
  nome: string;
  valor: number;
  pago: number;
  status: string;
  category: string | null;
  recurrenceType: AdminRecurrenceType;
  adminStatus: AdminStatus;
  notes: string | null;
}

export interface ProjectData {
  id: string;
  nome: string;
  tipo: string;
  status: string;
  coverImage: string;
  legacyKey?: string | null;
  config: ProjectConfig;
  obra: Stage[];
  profissionais: Professional[];
  jobs: Job[];
  materiais: Material[];
  equipamentos: Equipment[];
  fornecedores: Supplier[];
  categoriasObra: string[];
  categoriasObraExtra: string[];
  categoriasMaterial: string[];
  categoriasMaterialExtra: string[];
  imprevistos: Unforeseen[];
  pagamentos: Payment[];
  admin: AdminItem[];
  checklist: ChecklistItem[];
}

export interface Supplier {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  site: string;
}

export interface Category {
  id: string;
  nome: string;
  escopo: 'global' | 'projeto';
  projeto_id: string | null;
}
