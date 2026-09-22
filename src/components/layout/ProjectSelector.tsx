import type { ProjectOption } from '../../types/navigation';

interface ProjectSelectorProps {
  projects: ProjectOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ProjectSelector({ projects, selectedId, onSelect }: ProjectSelectorProps) {
  return (
    <div className="project-filter-wrap">
      <div>
        <small>Projeto atual</small>
        <select value={selectedId} onChange={(e) => onSelect(e.target.value)}>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
