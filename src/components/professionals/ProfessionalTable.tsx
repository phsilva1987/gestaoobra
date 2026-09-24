import type { Professional, Job, ProjectData } from '../../types';
import { money } from '../../lib/format';
import { JobStatusBadge } from './JobStatusBadge';
import { totalPaidForEntity } from '../../services/commitmentService';

interface ProfessionalTableProps {
  project: ProjectData;
  onEdit: (prof: Professional) => void;
  onDelete: (prof: Professional) => void;
}

function jobsDoProfissional(profId: string, jobs: Job[]): Job[] {
  return jobs.filter((j) => String(j.profissional_id) === String(profId));
}

export function ProfessionalTable({ project, onEdit, onDelete }: ProfessionalTableProps) {
  if (!project.profissionais.length) {
    return (
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Serviço</th>
              <th>Contato</th>
              <th>Valor Total</th>
              <th>Valor Pago</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan={7} className="empty">Nenhum profissional cadastrado.</td></tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="card stage-table-card">
      <div className="stage-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Serviço</th>
              <th>Contato</th>
              <th>Valor Total</th>
              <th>Valor Pago</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {project.profissionais.map((p) => {
              const jobs = jobsDoProfissional(p.id, project.jobs);
              const total = jobs.reduce((a, t) => a + (+t.valor || 0), 0);
              const pago = jobs.reduce(
                (a, t) => a + totalPaidForEntity(project.pagamentos, 'PROFESSIONAL', t.id), 0
              );
              return (
                <tr key={p.id}>
                  <td><b>{p.nome}</b></td>
                  <td>{p.servico || '—'}</td>
                  <td>
                    {p.telefone || '—'}
                    {p.email && <div className="hint">{p.email}</div>}
                  </td>
                  <td><b>{money(total)}</b></td>
                  <td>{money(pago)}</td>
                  <td><JobStatusBadge status={p.status} /></td>
                  <td className="rowactions">
                    <button onClick={() => onEdit(p)}>Editar / Trabalhos ({jobs.length})</button>
                    <button onClick={() => onDelete(p)}>Excluir</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
