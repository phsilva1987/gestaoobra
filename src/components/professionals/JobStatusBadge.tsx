interface JobStatusBadgeProps {
  status: string;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const cls =
    status === 'Concluído'
      ? 'status-Concluído'
      : status === 'Em andamento'
        ? 'status-Atenção'
        : 'status-Cotação';
  return <span className={`badge ${cls}`}>{status}</span>;
}
