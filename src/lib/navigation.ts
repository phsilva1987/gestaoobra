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
  coins:
    '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
  wallet:
    '<path d="M3 6h15v14H3z"/><path d="M3 8l3-4h12v4M14 12h7v5h-7z"/>',
  receipt:
    '<path d="M5 3h14v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L5 21z"/><path d="M8 8h8M8 12h8"/>',
  pie: '<path d="M12 2v10h10A10 10 0 1 1 12 2z"/><path d="M15 2.5A10 10 0 0 1 21.5 9H15z"/>',
  chart: '<path d="M5 20V10M12 20V4M19 20v-7"/>',
  calendar:
    '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  building:
    '<path d="M4 21h16M6 21V4h9v17M15 9h3v12M9 7h2M9 11h2M9 15h2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  phone:
    '<path d="M5 4h4l2 5-3 2c1.5 3 3 4.5 6 6l2-3 5 2v4c0 1-1 2-2 2C10 22 2 14 2 5c0-1 1-2 3-1z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/>',
  map: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2"/>',
  hardhat:
    '<path d="M4 14a8 8 0 0 1 16 0M2 14h20M9 14V8M15 14V8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  diario:
    '<path d="M6 3h10l3 3v15H6z"/><path d="M16 3v4h4M9 12h6M9 16h6"/>',
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
