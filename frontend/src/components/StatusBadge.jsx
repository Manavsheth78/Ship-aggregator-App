const STATUS_COLORS = {
  'Label Created': '#1B5E20',
  'Picked Up': '#2E7D32',
  'In Transit': '#388E3C',
  'Out For Delivery': '#43A047',
  'Delivered': '#66BB6A',
};

export default function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || '#1B5E20';
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 4,
        background: color,
        color: 'white',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
}
