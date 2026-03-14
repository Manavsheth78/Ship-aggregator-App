import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await auth.register({ name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <div style={{ background: '#1B5E20', color: 'white', padding: 16, borderRadius: 8, marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Smart Shipment Monitoring</h1>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h2 style={{ margin: 0 }}>Register</h2>
        {error && <div style={{ color: '#c62828', fontSize: 14 }}>{error}</div>}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{ padding: 12, border: '1px solid #e0e0e0', borderRadius: 4 }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 12, border: '1px solid #e0e0e0', borderRadius: 4 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: 12, border: '1px solid #e0e0e0', borderRadius: 4 }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            background: '#1B5E20',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
        <p style={{ margin: 0, fontSize: 14, color: '#666' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
