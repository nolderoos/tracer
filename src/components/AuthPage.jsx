import { useState } from 'react';
import { useAuth } from './AuthProvider';

export default function AuthPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email);
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">Tracer</div>
        <p className="auth-subtitle">
          {sent ? 'Check your email' : 'Sign in to your account'}
        </p>

        {sent ? (
          <div className="auth-sent">
            <p className="auth-sent-text">
              We sent a magic link to <strong>{email}</strong>. Click the link in
              the email to sign in.
            </p>
            <button
              className="auth-btn auth-btn-secondary"
              onClick={() => { setSent(false); setEmail(''); }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              disabled={submitting}
            />
            {error && <p className="auth-error">{error}</p>}
            <button
              type="submit"
              className="auth-btn"
              disabled={submitting || !email}
            >
              {submitting ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
