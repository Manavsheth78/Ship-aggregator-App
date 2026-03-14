import axios from "axios";

const FEDEX_CLIENT_ID = process.env.FEDEX_CLIENT_ID;
const FEDEX_CLIENT_SECRET = process.env.FEDEX_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

const FEDEX_OAUTH_URL = "https://apis-sandbox.fedex.com/oauth/token";
const FEDEX_TRACK_URL =
  "https://apis-sandbox.fedex.com/track/v1/trackingnumbers";

const FEDEX_REGEX = /^\d{12,14}$/;

async function obtainAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!FEDEX_CLIENT_ID || !FEDEX_CLIENT_SECRET) {
    throw new Error("FedEx credentials not configured");
  }

  const resp = await axios.post(
    FEDEX_OAUTH_URL,
    "grant_type=client_credentials",
    {
      auth: {
        username: FEDEX_CLIENT_ID,
        password: FEDEX_CLIENT_SECRET,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  cachedToken = resp.data.access_token;
  tokenExpiry = Date.now() + resp.data.expires_in * 1000 - 60000;

  return cachedToken;
}

export async function validate(trackingId) {
  if (!trackingId) return false;

  if (!FEDEX_CLIENT_ID || !FEDEX_CLIENT_SECRET) {
    return FEDEX_REGEX.test(trackingId);
  }

  try {
    await fetchStatus(trackingId);
    return true;
  } catch (e) {
    if (e.response && e.response.status === 404) return false;
    // If credentials are invalid (400) or API is unreachable, fall back to regex validation
    if (
      e.response &&
      (e.response.status === 400 || e.response.status === 401)
    ) {
      console.warn(
        "FedEx API credentials invalid, falling back to regex validation",
      );
      return FEDEX_REGEX.test(trackingId);
    }
    // For other errors, also fall back to regex
    console.warn(
      "FedEx API error:",
      e.message,
      "- falling back to regex validation",
    );
    return FEDEX_REGEX.test(trackingId);
  }
}

export async function fetchStatus(trackingId) {
  const token = await obtainAccessToken();

  const resp = await axios.post(
    FEDEX_TRACK_URL,
    {
      trackingInfo: [
        {
          trackingNumberInfo: {
            trackingNumber: trackingId,
          },
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = resp.data;

  const events = [];

  if (data?.output?.completeTrackResults) {
    const details =
      data.output.completeTrackResults[0]?.trackResults[0]?.scanEvents || [];

    for (const e of details) {
      events.push({
        status: e.eventDescription,
        timestamp: e.date,
        location: `${e.scanLocation?.city || ""}, ${e.scanLocation?.stateOrProvinceCode || ""}`,
      });
    }
  }

  return {
    carrier: "FedEx",
    trackingId,
    status: events[0]?.status || "Unknown",
    events,
  };
}
