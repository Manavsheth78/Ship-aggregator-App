const STATUS_STYLES = {
  'Label Created':     'bg-gray-100 text-gray-700 border border-gray-300',
  'Picked Up':         'bg-blue-100 text-blue-700 border border-blue-200',
  'In Transit':        'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'Out For Delivery':  'bg-orange-100 text-orange-700 border border-orange-200',
  'Delivered':         'bg-green-100 text-green-800 border border-green-200',
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || 'bg-[#1B5E20] text-white';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}
