import { useState } from 'react';
import type { Stage, ProjectData } from '../types';
import { ScheduleSummary } from '../components/schedule/ScheduleSummary';
import { ScheduleTable } from '../components/schedule/ScheduleTable';
import { StageForm, type StageFormData } from '../components/stages/StageForm';
import { StageChecklist } from '../components/stages/StageChecklist';

interface ScheduleProps {
  project: ProjectData;
  onUpdateStage: (id: string, data: StageFormData) => void;
  onToggleCheck: (id: string, key: keyof Stage, checked: boolean) => void;
  onFinishStage: (id: string) => void;
}

type Modal =
  | { type: 'form'; stage: Stage }
  | { type: 'checklist'; stage: Stage }
  | null;

export function Schedule({
  project,
  onUpdateStage,
  onToggleCheck,
  onFinishStage,
}: ScheduleProps) {
  const [modal, setModal] = useState<Modal>(null);

  function handleSave(data: StageFormData) {
    if (modal?.type === 'form') {
      onUpdateStage(modal.stage.id, data);
    }
    setModal(null);
  }

  function handleFinish() {
    if (modal?.type === 'checklist') {
      onFinishStage(modal.stage.id);
      setModal(null);
    }
  }

  return (
    <>
      <div className="page-top">
        <div>
          <h1>Cronograma</h1>
          <p>Prazos, dependências e situação automática das etapas</p>
        </div>
      </div>

      <ScheduleSummary project={project} />

      <ScheduleTable
        project={project}
        onEdit={(stage) => setModal({ type: 'form', stage })}
        onChecklist={(stage) => setModal({ type: 'checklist', stage })}
      />

      {modal?.type === 'form' && (
        <StageForm
          stage={modal.stage}
          project={project}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}

      {modal?.type === 'checklist' && (
        <StageChecklist
          stage={modal.stage}
          onToggle={(key, checked) => onToggleCheck(modal.stage.id, key, checked)}
          onFinish={handleFinish}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}
