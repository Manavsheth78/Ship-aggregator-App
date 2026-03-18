import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { shipments } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function ShipmentDetail() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    shipments
      .get(id)
      .then(({ data }) => setShipment(data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!shipment) return <div>Shipment not found</div>;

  const events = shipment.events || [];

  return (
    <div>
      <Link
        to="/"
        style={{ color: "#1B5E20", marginBottom: 16, display: "inline-block" }}
      >
        ← Back to Dashboard
      </Link>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>{shipment.tracking_number}</h1>
          <div style={{ color: "#666", marginTop: 4 }}>
            {shipment.sender_city}, {shipment.sender_state} →{" "}
            {shipment.receiver_city}, {shipment.receiver_state} •{" "}
            {shipment.mode} • {shipment.carrier || "N/A"}
          </div>
        </div>
        <StatusBadge status={shipment.status} />
      </div>
      {(shipment.sender_name || shipment.receiver_name) && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#f9f9f9",
            borderRadius: 8,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#666" }}>
            Addresses
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              fontSize: 14,
            }}
          >
            <div>
              <strong>From</strong>
              <p style={{ margin: "4px 0 0 0" }}>
                {shipment.sender_name}
                <br />
                {shipment.sender_address}
                <br />
                {shipment.sender_city}, {shipment.sender_state}
              </p>
            </div>
            <div>
              <strong>To</strong>
              <p style={{ margin: "4px 0 0 0" }}>
                {shipment.receiver_name}
                <br />
                {shipment.receiver_address}
                <br />
                {shipment.receiver_city}, {shipment.receiver_state}
              </p>
            </div>
          </div>
          {shipment.package_type && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
              Package: {shipment.package_type} • {shipment.package_weight} lb •{" "}
              {shipment.package_length}" × {shipment.package_width}" ×{" "}
              {shipment.package_height}"
            </div>
          )}
        </div>
      )}
      {shipment.route && shipment.route.length > 0 && (
        <div
          style={{
            marginBottom: 24,
            padding: 16,
            background: "#f9f9f9",
            borderRadius: 8,
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#666" }}>
            Route
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            {shipment.route.map((r, i) => (
              <span key={r.id}>
                <span
                  style={{
                    padding: "4px 8px",
                    background: "#1B5E20",
                    color: "white",
                    borderRadius: 4,
                    fontSize: 13,
                  }}
                >
                  {r.hub_city}
                </span>
                {i < shipment.route.length - 1 && (
                  <span style={{ margin: "0 4px", color: "#999" }}>→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      <h3 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#666" }}>
        Timeline
      </h3>
      <div
        style={{
          position: "relative",
          paddingLeft: 24,
          borderLeft: "2px solid #e0e0e0",
          marginLeft: 8,
        }}
      >
        {events.map((e, i) => (
          <div key={e.id} style={{ marginBottom: 20, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: -30,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#1B5E20",
              }}
            />
            <div style={{ marginLeft: 8 }}>
              <strong>{e.status}</strong>
              {e.location && (
                <span style={{ color: "#666", marginLeft: 8 }}>
                  {e.location}
                </span>
              )}
              {e.description && (
                <div style={{ fontSize: 13, color: "#666", marginTop: 2 }}>
                  {e.description}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                {new Date(e.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
