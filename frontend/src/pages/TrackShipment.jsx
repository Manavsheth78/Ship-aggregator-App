import { useState } from "react";
import { Link } from "react-router-dom";
import { track } from "../api";
import StatusBadge from "../components/StatusBadge";

export default function TrackShipment() {
  const [carrier, setCarrier] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // basic client-side regexes just to give quick feedback; the server
  // will still perform proper validation against the carrier APIs.
  function validateLocal(car, id) {
    const text = String(id || "").trim();
    if (!text) return "";
    const up = String(car || "").toUpperCase();
    if (up === "UPS") {
      return /^[1Z][0-9A-Z]{16}$/i.test(text)
        ? ""
        : "UPS numbers usually start with 1Z followed by 16 chars.";
    }
    if (up === "FEDEX" || up === "FED EX") {
      return /^(\d{12}|\d{15})$/.test(text)
        ? ""
        : "FedEx numbers are 12 or 15 digits.";
    }
    if (up === "USPS") {
      return /^(\d{20}|\d{22})$/.test(text)
        ? ""
        : "USPS numbers are 20–22 digits.";
    }
    return ""; // unknown carrier
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const vmsg = validateLocal(carrier, trackingId);
    if (vmsg) {
      setValidationError(vmsg);
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const { data } = await track.get(carrier || "DEMO", trackingId);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch tracking info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Track Shipment</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
            Carrier
          </label>
          <input
            type="text"
            value={carrier}
            onChange={(e) => {
              setCarrier(e.target.value);
              setValidationError(validateLocal(e.target.value, trackingId));
            }}
            placeholder="e.g. UPS, FedEx (optional for DEMO)"
            style={{
              padding: 10,
              width: "100%",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: 4, fontWeight: 500 }}>
            Tracking Number
          </label>
          <input
            type="text"
            value={trackingId}
            onChange={(e) => {
              setTrackingId(e.target.value);
              setValidationError(validateLocal(carrier, e.target.value));
            }}
            placeholder="Enter tracking number"
            required
            style={{
              padding: 10,
              width: "100%",
              border: "1px solid #e0e0e0",
              borderRadius: 4,
            }}
          />
        </div>
        {validationError && (
          <div style={{ color: "#c62828", fontSize: 14 }}>
            {validationError}
          </div>
        )}
        {error && <div style={{ color: "#c62828", fontSize: 14 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            background: "#1B5E20",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Tracking..." : "Track"}
        </button>
      </form>
      {result && (
        <div
          style={{
            padding: 24,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            background: "#fafafa",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <strong>{result.trackingNumber}</strong>
              <span style={{ marginLeft: 12, color: "#666" }}>
                {result.carrier} • {result.mode}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <StatusBadge status={result.status} />
              {result.id && (
                <Link
                  to={`/shipments/${result.id}`}
                  style={{ color: "#1B5E20", fontSize: 14 }}
                >
                  View details →
                </Link>
              )}
            </div>
          </div>
          {result.events && result.events.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#666" }}>
                Timeline
              </h4>
              <div
                style={{
                  paddingLeft: 24,
                  borderLeft: "2px solid #e0e0e0",
                  marginLeft: 8,
                }}
              >
                {result.events.map((e) => (
                  <div key={e.id || e.timestamp} style={{ marginBottom: 12 }}>
                    <strong>{e.status}</strong>
                    {e.location && (
                      <span style={{ color: "#666", marginLeft: 8 }}>
                        {e.location}
                      </span>
                    )}
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {e.timestamp
                        ? new Date(e.timestamp).toLocaleString()
                        : e.created_at &&
                          new Date(e.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
