const CARRIER_STYLES = {
  FEDEX:  'bg-purple-100 text-purple-700 border border-purple-200',
  FEDEX2: 'bg-purple-100 text-purple-700 border border-purple-200',
  UPS:    'bg-amber-100 text-amber-700 border border-amber-200',
  USPS:   'bg-blue-100 text-blue-700 border border-blue-200',
  DEMO:   'bg-gray-100 text-gray-600 border border-gray-200',
};

export default function CarrierBadge({ carrier }) {
  if (!carrier) return null;
  const key = carrier.toUpperCase().replace(/\s/g, '');
  const style = CARRIER_STYLES[key] || 'bg-gray-100 text-gray-600 border border-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>
      {carrier}
    </span>
  );
}
