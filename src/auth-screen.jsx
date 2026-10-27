import React, { useState } from 'react';
import './auth.css';
import './auth-mode.css';
import './auth-role.css';

export default function AuthScreen({ config, onSignedIn, initialError }) {
  const [mode, setMode] = useState(config.bootstrapAvailable ? 'bootstrap' : 'login');
  const [email, setEmail] = useState(''); const [name, setName] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [role, setRole] = useState('employee'); const [pin, setPin] = useState(''); const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState(initialError || ''); const [busy, setBusy] = useState(false);
  const registering = mode === 'bootstrap';
  async function submit(event) {
    event.preventDefault(); setError('');
    if (registering && password !== confirm) { setError('The passwords do not match.'); return; }
    if ((registering || mode === 'pin-setup') && pin !== pinConfirm) { setError('The Admin PINs do not match.'); return; }
    setBusy(true);
    try {
      const endpoint = registering ? '/api/auth/register' : mode === 'pin-setup' ? '/api/auth/admin-pin/setup' : '/api/auth/login';
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, name, role, pin }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { if (response.status === 409 && result.error === 'Admin PIN setup is required.') { setRole('admin'); setMode('pin-setup'); return; } throw new Error(result.error || 'Sign-in failed.'); }
      onSignedIn(result.user);
    } catch (err) { setError(err.message || 'Could not reach the local server. Start LedgerLens with npm start.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><section className="auth-card" aria-labelledby="auth-title">
    <a className="auth-brand" href="#"><span className="auth-mark">L</span><span>ledger<span>lens</span></span></a>
    <div className="auth-eyebrow"><i/> PRIVATE LOCAL WORKSPACE</div>
    <h1 id="auth-title">{registering ? 'Set up your workspace' : mode === 'pin-setup' ? 'Set your Admin PIN' : 'Welcome back'}</h1>
    <p className="auth-intro">{registering ? 'Create the first Admin account and set its PIN.' : mode === 'pin-setup' ? 'Your existing Admin account needs a PIN before you can continue.' : 'Choose your account type, then sign in to your workspace.'}</p>
    {error && <div className="auth-error" role="alert">{error}</div>}
    {config.googleLoginAvailable && !registering && mode === 'login' && role === 'employee' ? <a className="auth-google" href="/api/auth/google"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.3 17.7 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.4-4.5 7.1l7.3 5.7c4.3-4 6.9-9.9 6.9-17.3Z"/><path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1Z"/><path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-6.2l-7.3-5.7c-2 1.4-4.7 2.3-8.7 2.3-6.3 0-11.6-3.8-13.5-9.2l-7.9 6.1C6.5 43.5 14.6 48 24 48Z"/></svg>Continue with Google</a> : !config.googleLoginAvailable ? <div className="auth-google-disabled"><span className="auth-google-icon">G</span><span><b>Google sign-in</b><small>Set up Google OAuth credentials to enable this option.</small></span></div> : null}
    <div className="auth-divider"><span>{registering ? 'CREATE ADMIN ACCOUNT' : mode === 'pin-setup' ? 'ADMIN SECURITY' : 'SIGN IN WITH EMAIL'}</span></div>
    <form className="auth-form" onSubmit={submit}>
      {registering && <label>Your name<input autoComplete="name" required value={name} onChange={event => setName(event.target.value)} placeholder="Admin name" maxLength={100}/></label>}
      <label>Email address<input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="you@gmail.com" maxLength={254}/></label>
      <label>Password<input type="password" autoComplete={registering ? 'new-password' : 'current-password'} required value={password} onChange={event => setPassword(event.target.value)} placeholder={registering ? 'At least 12 characters' : 'Enter your password'} minLength={registering ? 12 : 1} maxLength={128}/></label>
      {registering && <label>Confirm password<input type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} placeholder="Enter your password again" minLength={12} maxLength={128}/></label>}
      {!registering && mode === 'login' && <label>Account type<select value={role} onChange={event => { setRole(event.target.value); setPin(''); setError(''); }}><option value="employee">Employee</option><option value="admin">Admin</option></select></label>}
      {!registering && mode === 'login' && role === 'admin' && config.adminPinConfigured && <label>Admin PIN<input type="password" inputMode="numeric" autoComplete="one-time-code" required value={pin} onChange={event => setPin(event.target.value)} placeholder="Enter your 6–12 digit PIN" minLength={6} maxLength={12}/></label>}
      {(registering || mode === 'pin-setup') && <><label>{registering ? 'Admin PIN' : 'New Admin PIN'}<input type="password" inputMode="numeric" autoComplete="new-password" required value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} placeholder="6–12 digits" minLength={6} maxLength={12}/></label><label>Confirm Admin PIN<input type="password" inputMode="numeric" autoComplete="new-password" required value={pinConfirm} onChange={event => setPinConfirm(event.target.value.replace(/\D/g, ''))} placeholder="Enter the PIN again" minLength={6} maxLength={12}/></label></>}
      <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : registering ? 'Create Admin account' : mode === 'pin-setup' ? 'Save Admin PIN & sign in' : 'Sign in'}</button>
    </form>
    <div className="auth-privacy"><span>▣</span><p>{registering ? 'The first account becomes Admin. Add Employees from the Admin workspace. The Admin PIN is stored as a one-way hash.' : 'Employees see only their own documents. Admins can review all workspace documents and must enter the Admin PIN. Passwords and PINs are stored as one-way hashes.'}</p></div>
  </section><footer className="auth-footer">LedgerLens · Local document intelligence</footer></main>;
}
