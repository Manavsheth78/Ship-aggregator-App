import * as ups from "./upsService.js";
import * as fedex from "./fedex.js";
import * as usps from "./usps.js";

export async function validateTracking(carrier, trackingId) {
  switch (carrier?.toUpperCase()) {
    case "UPS":
      return ups.validate(trackingId);
    case "FEDEX":
      return fedex.validate(trackingId);
    case "USPS":
      return usps.validate(trackingId);
    default:
      throw new Error("Unsupported carrier");
  }
}

export async function fetchTrackingStatus(carrier, trackingId) {
  switch (carrier?.toUpperCase()) {
    case "UPS":
      return ups.fetchStatus(trackingId);
    case "FEDEX":
      return fedex.fetchStatus(trackingId);
    case "USPS":
      return usps.fetchStatus(trackingId);
    default:
      throw new Error("Unsupported carrier");
  }
}
