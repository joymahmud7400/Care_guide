import React, { useState } from 'react';
import './auth.css';
import './auth-mode.css';
import './auth-role.css';
import './auth-demo.css';

export default function AuthScreen({ config, onSignedIn, initialError }) {
  const suggestions = config.demoUsers?.length ? config.demoUsers : [{ name: 'Admin', role: 'admin' }, { name: 'Employee', role: 'employee' }];
  const firstAdmin = suggestions.find(user => user.role === 'admin');
  const [role, setRole] = useState(firstAdmin ? 'admin' : 'employee');
  const [username, setUsername] = useState(firstAdmin?.name || suggestions.find(user => user.role === 'employee')?.name || '');
  const [error, setError] = useState(initialError || '');
  const [busy, setBusy] = useState(false);
  const roleUsers = suggestions.filter(user => user.role === role);

  function chooseUser(user) {
    setRole(user.role);
    setUsername(user.name);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ username, role })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not open the workspace.');
      onSignedIn(result.user);
    } catch (err) {
      setError(err.message || 'Could not reach LedgerLens.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell auth-demo-shell">
    <div className="auth-layout">
      <section className="auth-card" aria-labelledby="auth-title">
        <a className="auth-brand" href="#"><span className="auth-mark">L</span><span>ledger<span>lens</span></span></a>
        <div className="auth-eyebrow"><i/> PROJECT DEMO WORKSPACE</div>
        <h1 id="auth-title">Welcome to LedgerLens</h1>
        <p className="auth-intro">Choose a role and enter the suggested user name to explore the invoice workspace.</p>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label>Sign in as
            <select value={role} onChange={event => {
              const nextRole = event.target.value;
              setRole(nextRole);
              setUsername(suggestions.find(user => user.role === nextRole)?.name || '');
              setError('');
            }}>
              <option value="admin">Admin — view the whole workspace</option>
              <option value="employee">Employee — view their own documents</option>
            </select>
          </label>
          <label>User name
            <input autoComplete="username" required value={username} onChange={event => setUsername(event.target.value)} placeholder={role === 'admin' ? 'Admin' : 'Employee'} maxLength={100}/>
          </label>
          <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Opening workspace…' : `Continue as ${role === 'admin' ? 'Admin' : 'Employee'}`}</button>
        </form>
        <div className="auth-demo-note"><span>ⓘ</span><p>Demo access has no password or PIN. Anyone with this link can enter either role. Use sample data only; don’t upload private documents.</p></div>
      </section>
      <aside className="auth-guide" aria-label="Suggested demo users">
        <div className="auth-guide-kicker">QUICK START</div>
        <h2>Choose a demo role</h2>
        <p>Click a suggested user to fill the sign-in form.</p>
        <div className="auth-suggestions">
          {suggestions.map((user, index) => <button type="button" key={`${user.role}-${user.name}-${index}`} className={`auth-suggestion ${role === user.role && username === user.name ? 'selected' : ''}`} onClick={() => chooseUser(user)}>
            <span className={`auth-suggestion-icon ${user.role}`}>{user.role === 'admin' ? 'A' : 'E'}</span>
            <span><b>{user.name}</b><small>{user.role === 'admin' ? 'Admin · all workspace documents' : 'Employee · personal documents'}</small></span>
            <span className="auth-suggestion-arrow">↗</span>
          </button>)}
        </div>
        <div className="auth-guide-foot"><span className="auth-live-dot"/> Demo mode <span>·</span> One shared workspace</div>
      </aside>
    </div>
    <footer className="auth-footer">LedgerLens · Invoice processing demo</footer>
  </main>;
}
