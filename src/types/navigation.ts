export type PageKey =
  | 'dashboard'
  | 'projetos'
  | 'obra'
  | 'profissionais'
  | 'materiais'
  | 'equipamentos'
  | 'cronograma'
  | 'financeiro'
  | 'usuarios'
  | 'config';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface ProjectOption {
  id: string;
  nome: string;
  tipo: string;
}
