import axios from "axios";

const FEDEX_CLIENT_ID = process.env.FEDEX_CLIENT_ID;
const FEDEX_CLIENT_SECRET = process.env.FEDEX_CLIENT_SECRET;

/*
  MODE CONTROL
  ----------------------------------
  Set in .env:

  FEDEX_MODE=production
  or
  FEDEX_MODE=sandbox
*/
const FEDEX_MODE = (process.env.FEDEX_MODE || "sandbox").toLowerCase();

const FEDEX_OAUTH_URL =
  FEDEX_MODE === "production"
    ? "https://apis.fedex.com/oauth/token"
    : "https://apis-sandbox.fedex.com/oauth/token";

const FEDEX_TRACK_URL =
  FEDEX_MODE === "production"
    ? "https://apis.fedex.com/track/v1/trackingnumbers"
    : "https://apis-sandbox.fedex.com/track/v1/trackingnumbers";

let cachedToken = null;
let tokenExpiry = 0;

/*
  TOKEN FETCHER
*/
async function obtainAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  if (!FEDEX_CLIENT_ID || !FEDEX_CLIENT_SECRET) {
    throw new Error("FedEx API credentials not configured.");
  }

  console.log("FedEx mode:", FEDEX_MODE);
  console.log("FedEx OAuth URL:", FEDEX_OAUTH_URL);

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", FEDEX_CLIENT_ID);
  params.append("client_secret", FEDEX_CLIENT_SECRET);

  const resp = await axios.post(FEDEX_OAUTH_URL, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  cachedToken = resp.data.access_token;
  tokenExpiry = Date.now() + resp.data.expires_in * 1000 - 60000;

  return cachedToken;
}

/*
  VALIDATION (lightweight)
*/
export async function validate(trackingId) {
  if (!trackingId) return false;

  // simple FedEx format check
  const FEDEX_REGEX = /^\d{12,20}$/;

  return FEDEX_REGEX.test(trackingId);
}

/*
  FETCH STATUS
*/
export async function fetchStatus(trackingId) {
  const token = await obtainAccessToken();

  try {
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
        includeDetailedScans: true,
        trackRequestControlParameters: {
          includeDetailedScans: true,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("FedEx RAW response:", JSON.stringify(resp.data, null, 2));

    const data = resp.data;

    if (!data?.output?.completeTrackResults) {
      return {
        carrier: "FedEx",
        trackingId,
        status: "Tracking not available",
        events: [],
      };
    }

    const trackResult =
      data.output.completeTrackResults[0]?.trackResults?.[0] || {};

    const scanEvents = trackResult.scanEvents || [];

    const events = scanEvents.map((e) => ({
      status: e.derivedStatus || e.eventDescription,
      timestamp: e.date,
      location: `${e.scanLocation?.city || ""}, ${e.scanLocation?.stateOrProvinceCode || ""}`,
    }));

    return {
      carrier: "FedEx",
      trackingId,
      status:
        trackResult.latestStatusDetail?.statusByLocale ||
        events[0]?.status ||
        "Unknown",
      location: events[0]?.location || "",
      events,
    };
  } catch (e) {
    console.log("FEDEX FULL ERROR:", JSON.stringify(e.response?.data, null, 2));

    console.error(
      "FedEx fetchStatus error:",
      e?.response?.status || e.status,
      e.message,
    );

    const status = e?.response?.status || 500;

    const err = new Error("FedEx API error");
    err.status = status;
    throw err;
  }
}
