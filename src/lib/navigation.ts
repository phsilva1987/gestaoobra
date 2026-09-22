import type { NavGroup } from '../types/navigation';

export const iconPaths: Record<string, string> = {
  dashboard:
    '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  projetos:
    '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  obra: '<path d="M14.7 6.3a4 4 0 0 0-5-5l2.2 2.2-3.4 3.4-2.2-2.2a4 4 0 0 0 5 5L3 18l3 3 8.3-8.3a4 4 0 0 0 5-5l-2.2 2.2-3.4-3.4z"/>',
  financeiro: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  profissionais:
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 2.5-7 6-7s6 3 6 7M14 14c3.5 0 6 2.3 6 6"/>',
  materiais:
    '<path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  equipamentos:
    '<path d="M6 8v8M18 8v8M3 10v4M21 10v4M6 12h12"/>',
  cronograma:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  config:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/>',
};

export function svgIcon(name: string): string {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.dashboard}</svg>`;
}

export const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
      { key: 'projetos', label: 'Projetos', icon: 'projetos' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { key: 'obra', label: 'Obra', icon: 'obra' },
      { key: 'profissionais', label: 'Profissionais', icon: 'profissionais' },
      { key: 'materiais', label: 'Materiais', icon: 'materiais' },
      { key: 'equipamentos', label: 'Equipamentos', icon: 'equipamentos' },
    ],
  },
  {
    label: 'Acompanhamento',
    items: [
      { key: 'cronograma', label: 'Cronograma', icon: 'cronograma' },
      { key: 'financeiro', label: 'Financeiro', icon: 'financeiro' },
    ],
  },
  {
    label: 'Sistema',
    items: [{ key: 'config', label: 'Configurações', icon: 'config' }],
  },
];
