import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 40, borderRadius: 12, width: 360, boxShadow: '0 2px 12px rgba(0,0,0,.1)' }}>
        <h1 style={{ margin: '0 0 8px', color: '#1a73e8' }}>OpenSTR Admin</h1>
        <p style={{ margin: '0 0 32px', color: '#666', fontSize: 14 }}>Sign in to manage your properties</p>

        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

        <label style={labelStyle}>Password</label>
        <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />

        {error && <p style={{ color: '#d32f2f', marginBottom: 12, fontSize: 14 }}>{error}</p>}

        <button type="submit" style={btnStyle} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14, color: '#333' };
const inputStyle: React.CSSProperties = { display: 'block', width: '100%', padding: '10px 12px', marginBottom: 18, border: '1px solid #ddd', borderRadius: 8, fontSize: 15, boxSizing: 'border-box' };
const btnStyle: React.CSSProperties = { width: '100%', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer' };
