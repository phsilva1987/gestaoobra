import { useState } from 'react';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { signIn, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Informe email e senha.');
      return;
    }

    await signIn(email.trim(), password);
  }

  const displayError = localError || error;

  return (
    <div className="login-page">
      <section className="login-visual" aria-label="Gestão da Obra">
        <img src="/gestao-obra-login.webp" alt="Identidade visual Gestão da Obra" />
        <div className="login-visual-overlay" />
        <div className="login-visual-copy">
          <strong>Gestão da Obra</strong>
          <h1>Sua obra organizada<br />do planejamento à entrega.</h1>
          <p>Planejamento &nbsp;•&nbsp; Controle &nbsp;•&nbsp; Resultado</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 21v-6h6v6" />
                <path d="M9 11h.01M15 11h.01" />
              </svg>
            </div>
            <h1>Gestão da Obra</h1>
            <p>Planejamento &nbsp;•&nbsp; Controle &nbsp;•&nbsp; Resultado</p>
          </div>

          <div className="login-intro">
            <h2>Bem-vindo</h2>
            <p>Acesse sua conta para continuar.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="login-email">E-mail</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password">Senha</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {displayError && <div className="login-error">{displayError}</div>}

            <button type="submit" className="btn login-btn" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
