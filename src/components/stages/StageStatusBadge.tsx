import type { StageSituation } from '../../lib/calculations';

interface StageStatusBadgeProps {
  situation: StageSituation;
}

export function StageStatusBadge({ situation }: StageStatusBadgeProps) {
  const cls =
    situation.label === 'Atrasado'
      ? 'status-Atrasado'
      : situation.label === 'Atenção'
        ? 'status-Atenção'
        : situation.label === 'Concluído'
          ? 'status-Concluído'
          : 'status-Dentro-do-prazo';
  return (
    <td className={situation.cls}>
      <span className={`badge ${cls}`}>{situation.label}</span>
    </td>
  );
}
