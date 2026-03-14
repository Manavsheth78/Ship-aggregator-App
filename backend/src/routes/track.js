import { Router } from "express";
import { pool } from "../db/pool.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  fetchCarrierStatus,
  validateTrackingNumber,
} from "../services/carrierService.js";

export const trackRouter = Router();

trackRouter.get("/:carrier/:trackingId", authMiddleware, async (req, res) => {
  try {
    // console.log("AUTH HEADER:", req.headers.authorization);
    const { carrier, trackingId } = req.params;
    const userId = req.userId;

    const dbShip = await pool.query(
      "SELECT * FROM shipments WHERE tracking_number = $1 AND user_id = $2",
      [trackingId, userId],
    );

    if (dbShip.rows.length > 0) {
      const s = dbShip.rows[0];
      const events = await pool.query(
        "SELECT * FROM shipment_events WHERE shipment_id = $1 ORDER BY created_at",
        [s.id],
      );
      const route = await pool.query(
        "SELECT * FROM shipment_route WHERE shipment_id = $1 ORDER BY sequence_order",
        [s.id],
      );
      return res.json({
        id: s.id,
        trackingNumber: s.tracking_number,
        carrier: s.carrier || "DEMO",
        mode: s.mode,
        status: s.status,
        senderCity: s.sender_city,
        senderState: s.sender_state,
        receiverCity: s.receiver_city,
        receiverState: s.receiver_state,
        events: events.rows,
        route: route.rows,
      });
    }

    // if we didn't find a local record make sure the number looks valid
    const valid = await validateTrackingNumber(carrier, trackingId);
    if (!valid) {
      return res
        .status(400)
        .json({ error: "Invalid tracking number or unsupported carrier" });
    }

    const apiResult = await fetchCarrierStatus(carrier, trackingId);
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
