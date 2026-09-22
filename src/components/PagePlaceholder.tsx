interface PagePlaceholderProps {
  title: string;
  subtitle: string;
}

export function PagePlaceholder({ title, subtitle }: PagePlaceholderProps) {
  return (
    <>
      <div className="page-top">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="card">
        <div className="page-placeholder">
          Conteúdo desta página será implementado nas próximas fases.
        </div>
      </div>
    </>
  );
}
