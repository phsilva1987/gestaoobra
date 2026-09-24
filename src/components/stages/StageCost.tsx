import type { Stage, Job, Material, Equipment, Payment } from '../../types';
import { stageContratado, stagePago, stageEquipmentPago } from '../../lib/calculations';
import { money } from '../../lib/format';

interface StageCostProps {
  stage: Stage;
  jobs: Job[];
  materials: Material[];
  equipments: Equipment[];
  payments: Payment[];
}

export function StageCost({ stage, jobs, materials, equipments, payments }: StageCostProps) {
  const contratado = stageContratado(stage, jobs, materials, equipments);
  const pago = stagePago(stage, jobs, materials, payments) + stageEquipmentPago(stage, equipments, payments);
  return (
    <td>
      <b>{money(contratado)}</b>
      <div className="hint">Pago: {money(pago)}</div>
    </td>
  );
}
