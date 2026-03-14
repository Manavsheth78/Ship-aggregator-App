import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          background: '#1B5E20',
          color: 'white',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link to="/" style={{ color: 'white', fontWeight: 600, fontSize: '1.2rem' }}>
          Smart Shipment Monitoring
        </Link>
        <nav style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', opacity: 0.9 }}>Dashboard</Link>
          <Link to="/create" style={{ color: 'white', opacity: 0.9 }}>Create Shipment</Link>
          <Link to="/track" style={{ color: 'white', opacity: 0.9 }}>Track</Link>
          <span style={{ opacity: 0.8 }}>{user.name || user.email}</span>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.5)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </nav>
      </header>
      <main style={{ flex: 1, padding: 24, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  );
}
