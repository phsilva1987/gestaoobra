import { navGroups, svgIcon } from '../../lib/navigation';
import type { PageKey } from '../../types/navigation';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  coverImage?: string;
  projectName?: string;
}

export function Sidebar({ current, onNavigate, coverImage, projectName }: SidebarProps) {
  return (
    <aside className="side">
      <div className="brand">
        {coverImage ? (
          <img
            src={coverImage}
            alt={`Imagem do projeto ${projectName || ''}`}
            className="brand project-photo"
          />
        ) : (
          <span className="brand-tag">GESTÃO DA REFORMA</span>
        )}
      </div>
      <nav className="nav">
        {navGroups.map((group) => (
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
