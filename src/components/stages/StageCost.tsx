import type { Stage, Job, Material, Equipment } from '../../types';
import { stageContratado, stagePago } from '../../lib/calculations';
import { money } from '../../lib/format';

interface StageCostProps {
  stage: Stage;
  jobs: Job[];
  materials: Material[];
  equipments: Equipment[];
}

export function StageCost({ stage, jobs, materials, equipments }: StageCostProps) {
  const contratado = stageContratado(stage, jobs, materials, equipments);
  const pago = stagePago(stage, jobs, materials);
  return (
    <td>
      <b>{money(contratado)}</b>
      <div className="hint">Pago: {money(pago)}</div>
    </td>
  );
}
