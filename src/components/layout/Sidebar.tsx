import { navGroups, svgIcon } from '../../lib/navigation';
import type { PageKey } from '../../types/navigation';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  coverImage?: string;
  projectName?: string;
  isAdmin?: boolean;
}

export function Sidebar({ current, onNavigate, coverImage, projectName, isAdmin = false }: SidebarProps) {
  const groups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((item) => item.key !== 'usuarios' || isAdmin) }))
    .filter((g) => g.items.length > 0);
  return (
    <aside className="side">
      <div className="brand">
        <img
          src={coverImage || '/apartamento-porto.webp'}
          alt={coverImage ? `Imagem do projeto ${projectName || ''}` : 'Imagem institucional Gestão da Obra'}
          className={`project-photo${coverImage ? '' : ' project-photo-fallback'}`}
        />
      </div>
      <nav className="nav">
        {groups.map((group) => (
          <div key={group.label} className="nav-section">
            <div className="nav-section-label">{group.label}</div>
            {group.items.map((item) => (
              <button
                key={item.key}
                className={`nav-btn${current === item.key ? ' active' : ''}`}
                onClick={() => onNavigate(item.key)}
              >
                <span className="mi" dangerouslySetInnerHTML={{ __html: svgIcon(item.icon) }} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="footer-brand">
        Disciplina
        <br />
        <b>Transforma Espaços</b>
      </div>
    </aside>
  );
}
