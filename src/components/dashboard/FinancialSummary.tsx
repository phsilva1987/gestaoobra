import type { ProjectData } from '../../types';
import { financeMetrics, projectTotals } from '../../lib/calculations';
import { money } from '../../lib/format';

interface FinancialSummaryProps {
  project: ProjectData;
}

export function FinancialSummary({ project }: FinancialSummaryProps) {
  const m = financeMetrics(project);
  const t = projectTotals(project);

  return (
    <div className="card section dashboard-finance-card">
      <h3>Resumo financeiro</h3>
      <table>
        <tbody>
          <tr><td>A pagar</td><td><b>{money(m.apagar)}</b></td></tr>
          <tr><td>Materiais da obra</td><td>{money(t.materiais)}</td></tr>
          <tr><td>Mão de obra</td><td>{money(t.maoDeObra)}</td></tr>
          <tr><td>Extras / imprevistos registrados</td><td>{money(m.imprevistos)}</td></tr>
          <tr><td>Equipamentos já comprados</td><td>{money(t.eq)}</td></tr>
          <tr><td>Saldo financeiro</td><td><b>{money(m.saldoFinanceiro)}</b></td></tr>
        </tbody>
      </table>
      <p className="hint">
        Equipamentos e administrativo permanecem separados do orçamento da obra.
        Mão de obra é a soma de todos os vínculos de trabalho (Jobs) — cada
        profissional pode ter vários trabalhos em etapas diferentes, e cada
        vínculo é contado exatamente uma vez.
      </p>
    </div>
  );
}
