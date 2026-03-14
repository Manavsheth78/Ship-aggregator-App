import axios from "axios";

// USPS typically uses XML API, but there are REST wrappers.
const USPS_USER_ID = process.env.USPS_USER_ID; // obtained from usps.com
const USPS_TRACK_URL = "https://secure.shippingapis.com/ShippingAPI.dll";

const USPS_REGEX = /^\d{20,22}$/; // generic numeric length check

export async function validate(trackingId) {
  if (!trackingId) return false;
  // if we don't have a USERID configured just do regex check
  if (!USPS_USER_ID) {
    return USPS_REGEX.test(trackingId);
  }

  if (!USPS_REGEX.test(trackingId)) {
    try {
      await fetchStatus(trackingId);
      return true;
    } catch (_) {
      return false;
    }
  }
  try {
    await fetchStatus(trackingId);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 404) return false;
    throw e;
  }
}

export async function fetchStatus(trackingId) {
  if (!USPS_USER_ID) {
    throw new Error("USPS_USER_ID not configured");
  }
  // Build XML request for TrackV2
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <TrackRequest USERID="${USPS_USER_ID}">
      <TrackID ID="${trackingId}"></TrackID>
    </TrackRequest>`;

  const resp = await axios.get(USPS_TRACK_URL, {
    params: { API: "TrackV2", XML: xml },
  });
  // parse XML response (use xml2js or similar in real code)
  // For simplicity we will just return raw body
  return {
    carrier: "USPS",
    trackingId,
    raw: resp.data,
    status: "See raw response",
    events: [],
  };
}
