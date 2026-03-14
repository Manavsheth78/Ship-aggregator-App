import axios from "axios";

// These env vars should be set in your environment or .env file
const UPS_API_KEY = process.env.UPS_API_KEY;
const UPS_USERNAME = process.env.UPS_USERNAME;
const UPS_PASSWORD = process.env.UPS_PASSWORD;

// The base URL for the UPS tracking API (use test/sandbox urls during development)
const UPS_TRACK_URL = "https://onlinetools.ups.com/track/v1/details";

// Simple regex – real carriers use more complex patterns.
const UPS_REGEX = /^[1Z][0-9A-Z]{16}$/i;

export async function validate(trackingId) {
  if (!trackingId) return false;
  // if no credentials are configured we can't hit UPS, so just use format check
  if (!UPS_API_KEY) {
    return UPS_REGEX.test(trackingId);
  }

  if (!UPS_REGEX.test(trackingId)) {
    // try calling the API anyway in case the number is valid but format is unusual
    try {
      await fetchStatus(trackingId);
      return true;
    } catch (_) {
      return false;
    }
  }
  // format looks correct; optionally ping API for existence
  try {
    await fetchStatus(trackingId);
    return true;
  } catch (e) {
    // treat 404 or specific error codes as invalid number
    if (e.response && e.response.status === 404) return false;
    throw e;
  }
}

export async function fetchStatus(trackingId) {
  if (!UPS_API_KEY) {
    throw new Error("UPS credentials not configured (UPS_API_KEY)");
  }

  // example request body (see UPS docs for details)
  const body = {
    TrackingNumber: [trackingId],
  };

  const headers = {
    "Content-Type": "application/json",
    AccessLicenseNumber: UPS_API_KEY,
    // legacy non-OAuth credentials if needed
    Username: UPS_USERNAME || "",
    Password: UPS_PASSWORD || "",
  };

  const resp = await axios.post(UPS_TRACK_URL, body, { headers });
  // parse the UPS response and return a normalized object
  const trackData = resp.data;
  // TO DO: transform according to the actual structure
  return {
    carrier: "UPS",
    trackingId,
    status:
      trackData?.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.[0]
        ?.status?.description || "Unknown",
    location:
      trackData?.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.[0]
        ?.location?.address?.city || undefined,
    description:
      trackData?.trackResponse?.shipment?.[0]?.package?.[0]?.activity?.[0]
        ?.status?.description,
    events: (
      trackData?.trackResponse?.shipment?.[0]?.package?.[0]?.activity || []
    ).map((a) => ({
      status: a.status?.description,
      timestamp: a.date && a.time ? `${a.date}T${a.time}` : undefined,
      location: a.location?.address
        ? [a.location.address.city, a.location.address.stateProvinceCode]
            .filter(Boolean)
            .join(", ")
        : undefined,
    })),
  };
}
