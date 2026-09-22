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
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">GR</div>
          <h1>Gestão da Reforma</h1>
          <p>Planejamento &nbsp;•&nbsp; Controle &nbsp;•&nbsp; Resultado</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoFocus
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <label>Senha</label>
            <input
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
    </div>
  );
}
