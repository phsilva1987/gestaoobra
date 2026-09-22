import { useState, useEffect } from 'react';
import type { Stage } from '../../types';
import { fmt } from '../../lib/format';

const CHECKLIST_ITEMS: { key: keyof Stage; label: string }[] = [
  { key: 'checkServico', label: 'Serviço executado' },
  { key: 'checkConferido', label: 'Serviço conferido' },
  { key: 'checkLimpo', label: 'Ambiente limpo / resíduos retirados' },
  { key: 'checkPagamento', label: 'Pagamento conferido' },
  { key: 'checkPendencias', label: 'Sem pendências abertas' },
];

interface StageChecklistProps {
  stage: Stage;
  onToggle: (key: keyof Stage, checked: boolean) => void;
  onFinish: () => void;
  onCancel: () => void;
}

export function StageChecklist({ stage, onToggle, onFinish, onCancel }: StageChecklistProps) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const obj: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach(({ key }) => { obj[key] = !!stage[key]; });
    setChecks(obj);
  }, [stage]);

  function toggle(key: string, checked: boolean) {
    setChecks((c) => ({ ...c, [key]: checked }));
    onToggle(key as keyof Stage, checked);
  }

  const allDone = CHECKLIST_ITEMS.every(({ key }) => checks[key]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <h2>Checklist — {stage.nome}</h2>
        <div className="stage-checklist">
          {CHECKLIST_ITEMS.map(({ key, label }) => (
            <label key={key} className="checkitem">
              <input
                type="checkbox"
                checked={!!checks[key]}
                onChange={(e) => toggle(key, e.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
          {stage.observacao && (
            <div className="mini-note" style={{ marginTop: 12 }}>
              <b>Observação:</b> {stage.observacao}
            </div>
          )}
          {stage.fimReal && (
            <div className="mini-note">
              <b>Concluído em:</b> {fmt(stage.fimReal)}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn secondary" onClick={onCancel}>Fechar</button>
          <button
            type="button"
            className="btn"
            onClick={onFinish}
            disabled={!allDone}
            title={allDone ? 'Finalizar etapa' : 'Marque todos os itens para finalizar'}
          >
            Finalizar etapa
          </button>
        </div>
      </div>
    </div>
  );
}
