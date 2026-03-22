import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { shipments as shipmentsApi } from '../api';
import KPICards from '../components/KPICards';
import StatusBadge from '../components/StatusBadge';
import CarrierBadge from '../components/CarrierBadge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';

const TABS = [
  { label: 'All', value: 'all' },
  { label: 'In Transit', value: 'In Transit' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Label Created', value: 'Label Created' },
];

const PAGE_SIZE = 5;

export default function Dashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    shipmentsApi.list()
      .then(({ data }) => setList(data))
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 1 when tab changes
  const handleTab = (val) => {
    setActiveTab(val);
    setPage(1);
  };

  const filtered = list.filter((s) => activeTab === 'all' || s.status === activeTab);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Active = In Transit or Picked Up (for the "active packages" section)
  const activeShipments = list
    .filter((s) => s.status === 'In Transit' || s.status === 'Picked Up' || s.status === 'Out For Delivery')
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your shipments</p>
        </div>
        <Link to="/create">
          <Button className="flex items-center gap-2">
            <Plus size={18} />
            Create Shipment
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <KPICards shipments={list} />

      {/* Active Packages (optional section - only shows if there are active ones) */}
      {activeShipments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Active Packages
              <span className="ml-2 text-xs font-normal text-gray-400">({activeShipments.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeShipments.map((s) => (
              <Link key={s.id} to={`/shipments/${s.id}`}>
                <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-400">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-semibold text-xs text-gray-900 truncate">{s.tracking_number}</p>
                    <CarrierBadge carrier={s.carrier || s.mode} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span className="truncate">{s.sender_city}, {s.sender_state}</span>
                    <ArrowRight size={11} className="shrink-0" />
                    <span className="truncate">{s.receiver_city}, {s.receiver_state}</span>
                  </div>
                  <div className="mt-2">
                    <StatusBadge status={s.status} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Shipments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Shipments</h2>
          <Link to="/shipments" className="text-sm text-[#1B5E20] font-medium hover:underline">
            View all →
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? 'border-b-2 border-[#1B5E20] text-[#1B5E20]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-gray-400">
                ({list.filter(s => tab.value === 'all' ? true : s.status === tab.value).length})
              </span>
            </button>
          ))}
        </div>

        {paginated.length === 0 ? (
          <Card className="p-12 text-center text-gray-400">
            {activeTab === 'all' ? (
              <>No shipments yet. <Link to="/create" className="text-[#1B5E20] font-medium hover:underline">Create your first</Link></>
            ) : (
              `No shipments with status "${activeTab}"`
            )}
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((s) => (
                <Link key={s.id} to={`/shipments/${s.id}`} className="block">
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-gray-900">{s.tracking_number}</p>
                          <CarrierBadge carrier={s.carrier || s.mode} />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span className="truncate">{s.sender_city}, {s.sender_state}</span>
                          <ArrowRight size={13} className="shrink-0" />
                          <span className="truncate">{s.receiver_city}, {s.receiver_state}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border ${
                        page === p
                          ? 'bg-[#1B5E20] text-white border-[#1B5E20]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
