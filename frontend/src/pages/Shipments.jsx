import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { shipments as shipmentsApi } from "../api";
import StatusBadge from "../components/StatusBadge";
import CarrierBadge from "../components/CarrierBadge";
import { Card } from "../components/ui/card";
import { ArrowRight, Package, MapPin } from "lucide-react";

function ShipmentDetailPanel({ shipment }) {
  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Package size={48} className="mb-4 opacity-30" />
        <p className="text-sm">Select a shipment to view details</p>
      </div>
    );
  }

  const events = shipment.events || [];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-6 ">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {shipment.tracking_number}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {shipment.mode} •{" "}
            {new Date(shipment.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge status={shipment.status} />
          <CarrierBadge carrier={shipment.carrier || shipment.mode} />
        </div>
      </div>

      {/* Addresses */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Addresses
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-gray-700 mb-1">From</p>
            <p className="text-gray-600">{shipment.sender_name}</p>
            <p className="text-gray-600">{shipment.sender_address}</p>
            <p className="text-gray-600">
              {shipment.sender_city}, {shipment.sender_state}
            </p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 mb-1">To</p>
            <p className="text-gray-600">{shipment.receiver_name}</p>
            <p className="text-gray-600">{shipment.receiver_address}</p>
            <p className="text-gray-600">
              {shipment.receiver_city}, {shipment.receiver_state}
            </p>
          </div>
        </div>
        {shipment.package_type && (
          <p className="text-xs text-gray-400 mt-3">
            Package: {shipment.package_type} • {shipment.package_weight} lb •{" "}
            {shipment.package_length}" × {shipment.package_width}" ×{" "}
            {shipment.package_height}"
          </p>
        )}
      </div>

      {/* Route */}
      {shipment.route && shipment.route.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Route
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {shipment.route.map((r, i) => (
              <span key={r.id} className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#1B5E20] text-white rounded-md text-xs font-medium">
                  {r.hub_city}
                </span>
                {i < shipment.route.length - 1 && (
                  <ArrowRight size={14} className="text-gray-400" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Timeline
        </h3>
        <div className="relative pl-6 border-l-2 border-gray-200">
          {events.map((e, i) => (
            <div key={e.id} className="mb-5 relative">
              <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-[#1B5E20] ring-4 ring-green-50" />
              <div className="ml-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-gray-900">
                    {e.status}
                  </span>
                  {e.location && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={11} /> {e.location}
                    </span>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {e.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(e.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Shipments() {
  const [list, setList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    shipmentsApi
      .list()
      .then(({ data }) => {
        setList(data);
        // if URL has an id, select that shipment
        if (id) {
          const found = data.find((s) => String(s.id) === String(id));
          if (found) fetchAndSelect(found.id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchAndSelect = (shipmentId) => {
    shipmentsApi.get(shipmentId).then(({ data }) => {
      setSelected(data);
      navigate(`/shipments/${shipmentId}`, { replace: true });
    });
  };

  const tabs = [
    { label: "All", value: "all" },
    { label: "In Transit", value: "In Transit" },
    { label: "Delivered", value: "Delivered" },
    { label: "Label Created", value: "Label Created" },
  ];

  const filtered = list.filter(
    (s) => activeTab === "all" || s.status === activeTab,
  );

  return (
    <div
      className=" flex  md:flex-row gap-4  w-full flex-wrap"
      style={{ height: "calc(100vh - 120px)" }}
    >
      {/* Left panel — shipment list */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Shipments</h2>
          <p className="text-xs text-gray-500 mt-0.5">{list.length} total</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-2 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-2 text-xs font-medium transition-colors rounded-t-md ${
                activeTab === tab.value
                  ? "border-b-2 border-[#1B5E20] text-[#1B5E20]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">
              No shipments found
            </div>
          ) : (
            filtered.map((s) => (
              <div
                key={s.id}
                onClick={() => fetchAndSelect(s.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  selected?.id === s.id
                    ? "border-[#1B5E20] bg-green-50 shadow-sm"
                    : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-semibold text-xs text-gray-900 truncate">
                    {s.tracking_number}
                  </p>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <span className="truncate">
                    {s.sender_city}, {s.sender_state}
                  </span>
                  <ArrowRight size={11} className="shrink-0" />
                  <span className="truncate">
                    {s.receiver_city}, {s.receiver_state}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CarrierBadge carrier={s.carrier || s.mode} />
                  <span className="text-xs text-gray-400">{s.mode}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel — detail */}
      <div
        className="flex-1 min-h-96 max-md:w-full
       bg-white rounded-xl border border-gray-200 "
      >
        <ShipmentDetailPanel shipment={selected} />
      </div>
    </div>
  );
}
