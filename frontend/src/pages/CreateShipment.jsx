import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shipments } from '../api';

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
const PACKAGE_TYPES = ['Box', 'Envelope', 'Tube', 'Pallet', 'Other'];

export default function CreateShipment() {
  const [mode, setMode] = useState('DEMO');
  const [carrier, setCarrier] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderState, setSenderState] = useState('NY');
  const [receiverName, setReceiverName] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [receiverState, setReceiverState] = useState('CA');
  const [packageWeight, setPackageWeight] = useState('');
  const [packageLength, setPackageLength] = useState('');
  const [packageWidth, setPackageWidth] = useState('');
  const [packageHeight, setPackageHeight] = useState('');
  const [packageType, setPackageType] = useState('Box');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        mode,
        senderName,
        senderAddress,
        senderCity,
        senderState,
        receiverName,
        receiverAddress,
        receiverCity,
        receiverState,
        packageWeight,
        packageLength,
        packageWidth,
        packageHeight,
        packageType,
        carrier: carrier || undefined,
      };
      if (mode === 'REAL') {
        if (!carrier || !trackingId) {
          setError('Carrier and tracking ID required for REAL mode');
          setLoading(false);
          return;
        }
        payload.carrier = carrier;
        payload.trackingId = trackingId;
      }
      const { data } = await shipments.create(payload);
      navigate(`/shipments/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Create Shipment</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ color: '#c62828', fontSize: 14 }}>{error}</div>}
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{ padding: 10, width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }}
          >
            <option value="DEMO">DEMO (simulated route)</option>
            <option value="REAL">REAL (carrier API)</option>
          </select>
        </div>
        <fieldset style={{ border: '1px solid #e0e0e0', padding: 16, borderRadius: 4 }}>
          <legend style={{ fontWeight: 600 }}>Sender</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input required placeholder="Name" value={senderName} onChange={(e) => setSenderName(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }} />
            <input required placeholder="Address" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <input required placeholder="City" value={senderCity} onChange={(e) => setSenderCity(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }} />
              <select value={senderState} onChange={(e) => setSenderState(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }}>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset style={{ border: '1px solid #e0e0e0', padding: 16, borderRadius: 4 }}>
          <legend style={{ fontWeight: 600 }}>Receiver</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input required placeholder="Name" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }} />
            <input required placeholder="Address" value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <input required placeholder="City" value={receiverCity} onChange={(e) => setReceiverCity(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }} />
              <select value={receiverState} onChange={(e) => setReceiverState(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }}>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </fieldset>
        <fieldset style={{ border: '1px solid #e0e0e0', padding: 16, borderRadius: 4 }}>
          <legend style={{ fontWeight: 600 }}>Package</legend>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select value={packageType} onChange={(e) => setPackageType(e.target.value)} style={{ padding: 10, border: '1px solid #e0e0e0', borderRadius: 4 }}>
              {PACKAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>Weight (lb)</label>
                <input required type="number" step="0.1" min="0.1" placeholder="0" value={packageWeight} onChange={(e) => setPackageWeight(e.target.value)} style={{ padding: 10, width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>L (in)</label>
                <input required type="number" step="0.1" min="0.1" placeholder="0" value={packageLength} onChange={(e) => setPackageLength(e.target.value)} style={{ padding: 10, width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>W (in)</label>
                <input required type="number" step="0.1" min="0.1" placeholder="0" value={packageWidth} onChange={(e) => setPackageWidth(e.target.value)} style={{ padding: 10, width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#666' }}>H (in)</label>
                <input required type="number" step="0.1" min="0.1" placeholder="0" value={packageHeight} onChange={(e) => setPackageHeight(e.target.value)} style={{ padding: 10, width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }} />
              </div>
            </div>
          </div>
        </fieldset>
        {mode === 'REAL' && (
          <>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Carrier</label>
              <input type="text" value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. UPS, FedEx" style={{ padding: 10, width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Tracking ID</label>
              <input type="text" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="Carrier tracking number" style={{ padding: 10, width: '100%', border: '1px solid #e0e0e0', borderRadius: 4 }} />
            </div>
          </>
        )}
        <button type="submit" disabled={loading} style={{ padding: 12, background: '#1B5E20', color: 'white', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Creating...' : 'Create Shipment'}
        </button>
      </form>
    </div>
  );
}
