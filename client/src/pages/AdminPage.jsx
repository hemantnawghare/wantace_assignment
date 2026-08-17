import { useState } from 'react';
import OwnerPanel from '../components/owner/OwnerPanel';

export default function AdminPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('roofing2026!');
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      if (data.token) {
        localStorage.setItem('northline_token', data.token);
      }
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  const pathname = window.location.pathname;
  if (pathname === '/admin/login') {
    return (
      <div className="page-shell">
        <div className="container" style={{ maxWidth: 480 }}>
          <div className="card panel">
            <h2>Owner panel login</h2>
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button className="primary-btn" type="submit">Log in</button>
              {error && <p style={{ color: '#b91c1c', marginTop: 14 }}>{error}</p>}
            </form>
          </div>
        </div>
      </div>
    );
  }

  return <OwnerPanel />;
}
