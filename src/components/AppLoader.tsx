const BUILDING_ICON = '<path d="M4 21h16M6 21V4h9v17M15 9h3v12M9 7h2M9 11h2M9 15h2"/>';

export function AppLoader() {
  return (
    <div className="app-loader" role="status" aria-live="polite">
      <div className="app-loader-content">
        <span
          className="app-loader-icon"
          dangerouslySetInnerHTML={{
            __html: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${BUILDING_ICON}"/></svg>`,
          }}
        />
        <span className="app-loader-spinner" aria-hidden="true" />
        <span className="app-loader-text">Carregando...</span>
      </div>
    </div>
  );
}
