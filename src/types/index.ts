// Domain types will be populated during migration phases.
// For now, placeholders that compile and establish the pattern.

export interface Project {
  id: string;
  nome: string;
  tipo: string;
  status: string;
}

export interface Stage {
  id: string;
  projeto_id: string;
  nome: string;
  categoria: string;
  status: string;
  progresso: number;
}

export interface Professional {
  id: string;
  projeto_id: string;
  nome: string;
  servico: string;
  telefone: string;
  status: string;
}

export interface Job {
  id: string;
  projeto_id: string;
  etapa_id: string;
  profissional_id: string;
  valor: number;
  pago: number;
  status: string;
}

export interface Material {
  id: string;
  projeto_id: string;
  etapa_id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  unitario: number;
  pago: number;
  status: string;
}

export interface Equipment {
  id: string;
  projeto_id: string;
  etapa_id: string;
  nome: string;
  quantidade: number;
  valor: number;
  status: string;
}

export interface Supplier {
  id: string;
  projeto_id: string;
  nome: string;
  telefone: string;
  email: string;
}

export interface Category {
  id: string;
  nome: string;
  escopo: 'global' | 'projeto';
  projeto_id: string | null;
}
