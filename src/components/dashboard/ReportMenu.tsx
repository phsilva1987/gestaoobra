import { useState, useRef, useEffect } from 'react';
import type { ProjectData } from '../../types';
import { exportFinanceiroCSV, exportFinanceiroExcel, printReport } from '../../lib/reports';

interface ReportMenuProps {
  project: ProjectData;
}

export function ReportMenu({ project }: ReportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="report-actions" ref={ref} style={{ position: 'relative' }}>
      <button
        className="report-btn"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span>Gerar Relatório</span>
        <span style={{ marginLeft: 4, fontSize: 10 }}>▾</span>
      </button>
      {open && (
        <div
          className="report-menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 100,
            minWidth: 280,
            overflow: 'hidden',
          }}
        >
          <ReportMenuItem
            icon="▣"
            title="Resumo Executivo — PDF"
            desc="1 a poucas páginas com os principais indicadores."
            onClick={() => { printReport(project, false); setOpen(false); }}
          />
          <ReportMenuItem
            icon="▤"
            title="Relatório Financeiro — PDF"
            desc="Pagamentos, materiais, imprevistos e administrativo."
            onClick={() => { printReport(project, true); setOpen(false); }}
          />
          <ReportMenuItem
            icon="▦"
            title="Exportar Excel"
            desc="Arquivo .xls para o financeiro trabalhar."
            onClick={() => { exportFinanceiroExcel(project); setOpen(false); }}
          />
          <ReportMenuItem
            icon="≡"
            title="Exportar CSV"
            desc="Dados separados por ponto e vírgula."
            onClick={() => { exportFinanceiroCSV(project); setOpen(false); }}
          />
          <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--line)' }}>
            PDF abre a impressão do navegador; escolha "Salvar como PDF".
          </div>
        </div>
      )}
    </div>
  );
}

function ReportMenuItem({ icon, title, desc, onClick }: { icon: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        width: '100%',
        padding: '10px 14px',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontSize: 13,
        color: 'inherit',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#faf5ea')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <span>
        <b>{title}</b>
        <br />
        <small style={{ color: 'var(--muted)' }}>{desc}</small>
      </span>
    </button>
  );
}
