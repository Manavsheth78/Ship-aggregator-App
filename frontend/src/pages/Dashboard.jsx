import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shipments } from '../api';
import StatusBadge from '../components/StatusBadge';

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shipments.list().then(({ data }) => setList(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>My Shipments</h1>
        <Link
          to="/create"
          style={{
            padding: '10px 20px',
            background: '#1B5E20',
            color: 'white',
            borderRadius: 4,
            textDecoration: 'none',
          }}
        >
          + Create Shipment
        </Link>
      </div>
      {list.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#666', background: '#f5f5f5', borderRadius: 8 }}>
          No shipments yet. <Link to="/create">Create your first shipment</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((s) => (
            <Link
              key={s.id}
              to={`/shipments/${s.id}`}
              style={{
                display: 'block',
                padding: 16,
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>{s.tracking_number}</strong>
                  <span style={{ marginLeft: 12, color: '#666', fontSize: 14 }}>
                    {s.sender_city}, {s.sender_state} → {s.receiver_city}, {s.receiver_state}
                  </span>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                {s.mode} • {s.carrier || 'N/A'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
