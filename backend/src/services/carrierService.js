import * as upsService from "./upsService.js";
import * as fedexService from "./fedexService.js";
import * as uspsService from "./uspsService.js";

/**
 * Fetch tracking information from a real carrier API.
 * Supports UPS, FedEx and USPS. In test/demo mode the existing
 * logic still kicks in (when you pass carrier === 'DEMO').
 */
export async function fetchCarrierStatus(carrier, trackingId) {
  carrier = String(carrier || "").toUpperCase();
  switch (carrier) {
    case "UPS":
      return upsService.fetchStatus(trackingId);
    case "FEDEX":
    case "FED EX":
      return fedexService.fetchStatus(trackingId);
    case "USPS":
      return uspsService.fetchStatus(trackingId);
    case "DEMO":
    case "":
      // fall back to the old simulator
      await new Promise((r) => setTimeout(r, 100));
      return {
        carrier,
        trackingId,
        status: "In Transit",
        location: "Chicago, IL",
        description: "Package in transit",
        events: [
          {
            status: "Label Created",
            timestamp: new Date().toISOString(),
            location: "Origin",
          },
          {
            status: "Picked Up",
            timestamp: new Date().toISOString(),
            location: "Origin",
          },
          {
            status: "In Transit",
            timestamp: new Date().toISOString(),
            location: "Chicago, IL",
          },
        ],
      };
    default:
      throw new Error(`Unsupported carrier: ${carrier}`);
  }
}

/**
 * Basic validation helper.  Returns true if the tracking number is
 * syntactically valid or the carrier API acknowledges it.  A false
 * response should be surfaced back to the client as a "invalid number"
 * warning.
 */
export async function validateTrackingNumber(carrier, trackingId) {
  carrier = String(carrier || "").toUpperCase();
  switch (carrier) {
    case "UPS":
      return upsService.validate(trackingId);
    case "FEDEX":
    case "FED EX":
      return fedexService.validate(trackingId);
    case "USPS":
      return uspsService.validate(trackingId);
    case "DEMO":
    case "":
      return true; // always valid in demo mode
    default:
      return false;
  }
}
