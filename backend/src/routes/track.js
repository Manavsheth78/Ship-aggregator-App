import { Router } from "express";
import { pool } from "../db/pool.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  fetchCarrierStatus,
  validateTrackingNumber,
} from "../services/carrierService.js";

export const trackRouter = Router();

trackRouter.get("/:carrier/:trackingId", authMiddleware, async (req, res) => {
  console.log("TRACK ROUTE HIT:", req.params);
  try {
    const carrier = req.params.carrier.toUpperCase();
    const { trackingId } = req.params;
    const userId = req.userId;

    const dbShip = await pool.query(
      "SELECT * FROM shipments WHERE tracking_number = $1 AND user_id = $2",
      [trackingId, userId],
    );

    // if we didn't find a local record make sure the number looks valid

    console.log("Carrier received:", carrier);
    console.log("Tracking ID received:", trackingId);

    console.log("Running validation...");

    const valid = await validateTrackingNumber(carrier, trackingId);
    console.log("Validation result:", valid);
    if (!valid) {
      return res
        .status(400)
        .json({ error: "Invalid tracking number or unsupported carrier" });
    }

    const apiResult = await fetchCarrierStatus(carrier, trackingId);
    if (!apiResult || !apiResult.events?.length) {
      return res.status(400).json({
        error: "Invalid or unsupported tracking number",
      });
    }
    let shipment = await pool.query(
      "SELECT * FROM shipments WHERE tracking_number = $1 AND user_id = $2",
      [trackingId, userId],
    );

    //   if (shipment.rows.length === 0) {
    //     //? INSERT
    //     shipment = await pool.query(
    //       `INSERT INTO shipments
    //  (
    //    tracking_number, carrier, status, user_id, mode,
    //    sender_name, sender_address, sender_city, sender_state,
    //    receiver_name, receiver_address, receiver_city, receiver_state,
    //    package_weight, package_length, package_width, package_height, package_type
    //  )
    //  VALUES (
    //    $1, $2, $3, $4, 'REAL',
    //    'Unknown', 'Unknown', 'Unknown', 'NA',
    //    'Unknown', 'Unknown', 'Unknown', 'NA',
    //    0, 0, 0, 0, 'API'
    //  )
    //  RETURNING *`,
    //       [trackingId, carrier, apiResult.status, userId],
    //     );
    //   } else {
    //? UPDATE
    //     await pool.query(
    //       `UPDATE shipments
    //    SET status = $1
    //    WHERE tracking_number = $2 AND user_id = $3`,
    //       [apiResult.status, trackingId, userId],
    //     );
    //   }
    //   const shipmentId = shipment.rows[0].id;

    //   //? clear old events
    //   await pool.query("DELETE FROM shipment_events WHERE shipment_id = $1", [
    //     shipmentId,
    //   ]);

    //   //? insert new events
    //   for (const event of apiResult.events) {
    //     await pool.query(
    //       `INSERT INTO shipment_events (shipment_id, status, description, location)
    //  VALUES ($1, $2, $3, $4)`,
    //       [
    //         shipmentId,
    //         event.status,
    //         event.timestamp, // store timestamp inside description
    //         event.location,
    //       ],
    //     );
    //   }
    res.json({
      trackingNumber: trackingId,
      carrier,
      mode: "REAL",
      status: apiResult.status,
      location: apiResult.location,
      events: apiResult.events || [],
    });
  } catch (e) {
    console.error("TRACK ROUTE ERROR:", e);
    res.status(500).json({ error: e.message });
  }
});
