import { Router } from "express";
import fs from "fs";
import { pool } from "../db/pool.js";
import { authMiddleware } from "../middleware/auth.js";
import { computeRoute } from "../services/regionService.js";
import { sendStatusChangeEmail } from "../services/emailService.js";
import { generateShippingLabel } from "../services/pdfService.js";

export const shipmentRouter = Router();
shipmentRouter.use(authMiddleware);

const REQUIRED_FIELDS = [
  "senderName",
  "senderAddress",
  "senderCity",
  "senderState",
  "receiverName",
  "receiverAddress",
  "receiverCity",
  "receiverState",
  "packageWeight",
  "packageLength",
  "packageWidth",
  "packageHeight",
  "packageType",
];

function generateTrackingNumber() {
  return (
    "SS" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

function validateShipmentPayload(body) {
  const missing = REQUIRED_FIELDS.filter(
    (f) => !body[f] || String(body[f]).trim() === "",
  );
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(", ")}`,
    };
  }
  const weight = parseFloat(body.packageWeight);
  const length = parseFloat(body.packageLength);
  const width = parseFloat(body.packageWidth);
  const height = parseFloat(body.packageHeight);
  if (
    isNaN(weight) ||
    weight <= 0 ||
    isNaN(length) ||
    length <= 0 ||
    isNaN(width) ||
    width <= 0 ||
    isNaN(height) ||
    height <= 0
  ) {
    return {
      valid: false,
      error: "Package dimensions and weight must be positive numbers",
    };
  }
  return { valid: true };
}

shipmentRouter.post("/from-tracking", async (req, res) => {
  try {
    const userId = req.userId;
    const { trackingNumber, carrier, events, status } = req.body;

    if (!trackingNumber || !carrier) {
      return res.status(400).json({ error: "Missing tracking data" });
    }

    let shipment = await pool.query(
      "SELECT * FROM shipments WHERE tracking_number = $1 AND user_id = $2",
      [trackingNumber, userId],
    );

    if (shipment.rows.length === 0) {
      // ✅ INSERT (same as your old logic)
      shipment = await pool.query(
        `INSERT INTO shipments
         (
           tracking_number, carrier, status, user_id, mode,
           sender_name, sender_address, sender_city, sender_state,
           receiver_name, receiver_address, receiver_city, receiver_state,
           package_weight, package_length, package_width, package_height, package_type
         )
         VALUES (
           $1, $2, $3, $4, 'REAL',
           'Unknown', 'Unknown', 'Unknown', 'NA',
           'Unknown', 'Unknown', 'Unknown', 'NA',
           0, 0, 0, 0, 'API'
         )
         RETURNING *`,
        [trackingNumber, carrier, status, userId],
      );
    } else {
      // ✅ UPDATE (THIS WAS MISSING BEFORE)
      await pool.query(
        `UPDATE shipments
         SET status = $1
         WHERE tracking_number = $2 AND user_id = $3`,
        [status, trackingNumber, userId],
      );
    }

    const shipmentId = shipment.rows[0].id;

    // ✅ SAME AS YOUR OLD CODE (KEEP THIS)
    await pool.query("DELETE FROM shipment_events WHERE shipment_id = $1", [
      shipmentId,
    ]);

    for (const e of events || []) {
      await pool.query(
        `INSERT INTO shipment_events (shipment_id, status, description, location)
         VALUES ($1, $2, $3, $4)`,
        [shipmentId, e.status, e.timestamp, e.location],
      );
    }

    res.json({ success: true, shipmentId });
  } catch (e) {
    console.error("from-tracking error:", e);
    res.status(500).json({ error: e.message });
  }
});

shipmentRouter.post("/", async (req, res) => {
  try {
    const userId = req.userId;

    const validation = validateShipmentPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const payload = {
      sender_name: String(req.body.senderName).trim(),
      sender_address: String(req.body.senderAddress).trim(),
      sender_city: String(req.body.senderCity).trim(),
      sender_state: String(req.body.senderState).trim(),
      receiver_name: String(req.body.receiverName).trim(),
      receiver_address: String(req.body.receiverAddress).trim(),
      receiver_city: String(req.body.receiverCity).trim(),
      receiver_state: String(req.body.receiverState).trim(),
      package_weight: parseFloat(req.body.packageWeight),
      package_length: parseFloat(req.body.packageLength),
      package_width: parseFloat(req.body.packageWidth),
      package_height: parseFloat(req.body.packageHeight),
      package_type: String(req.body.packageType).trim(),
      carrier: "DEMO",
    };

    let shipment;

    {
      const route = await computeRoute(
        payload.sender_state,
        payload.receiver_state,
      );
      if (route.length === 0) {
        return res
          .status(400)
          .json({ error: "Could not compute route for given states" });
      }
      const trackingNumber = generateTrackingNumber();
      const originRegionId = route[0]?.regionId ?? null;
      const destRegionId = route[route.length - 1]?.regionId ?? null;

      const result = await pool.query(
        `INSERT INTO shipments (user_id, tracking_number, carrier, mode, status, origin_region_id, destination_region_id,
         sender_name, sender_address, sender_city, sender_state,
         receiver_name, receiver_address, receiver_city, receiver_state,
         package_weight, package_length, package_width, package_height, package_type)
         VALUES ($1, $2, $3, 'DEMO', 'Label Created', $4, $5,
         $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         RETURNING *`,
        [
          userId,
          trackingNumber,
          payload.carrier,
          originRegionId,
          destRegionId,
          payload.sender_name,
          payload.sender_address,
          payload.sender_city,
          payload.sender_state,
          payload.receiver_name,
          payload.receiver_address,
          payload.receiver_city,
          payload.receiver_state,
          payload.package_weight,
          payload.package_length,
          payload.package_width,
          payload.package_height,
          payload.package_type,
        ],
      );
      shipment = result.rows[0];

      for (let i = 0; i < route.length; i++) {
        await pool.query(
          "INSERT INTO shipment_route (shipment_id, sequence_order, hub_city, region_id) VALUES ($1, $2, $3, $4)",
          [shipment.id, i + 1, route[i].hubCity, route[i].regionId],
        );
      }
      const originLocation = `${payload.sender_city}, ${payload.sender_state}`;
      await pool.query(
        "INSERT INTO shipment_events (shipment_id, status, description, location) VALUES ($1, $2, $3, $4)",
        [shipment.id, "Label Created", "Label created", originLocation],
      );
    }

    const out = await getShipmentWithDetails(shipment.id);
    res.status(201).json(out);

    setImmediate(async () => {
      try {
        const userResult = await pool.query(
          "SELECT email FROM users WHERE id = $1",
          [userId],
        );
        const userEmail = userResult.rows[0]?.email;
        if (!userEmail) return;
        const labelPath = await generateShippingLabel(shipment);
        await sendStatusChangeEmail(
          userEmail,
          shipment.tracking_number,
          "Label Created",
          "Your shipment has been created. Shipping label attached.",
          labelPath,
        );
        if (fs.existsSync(labelPath)) fs.unlinkSync(labelPath);
      } catch (e) {
        console.error("Label email failed:", e.message);
      }
    });
  } catch (e) {
    console.error("Shipment creation error:", e);
    res.status(500).json({ error: e.message });
  }
});

shipmentRouter.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, 
        (SELECT json_agg(e ORDER BY e.created_at) FROM shipment_events e WHERE e.shipment_id = s.id) as events
       FROM shipments s WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
      [req.userId],
    );
    res.json(result.rows.map(normalizeShipment));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

shipmentRouter.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM shipments WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Shipment not found" });
    const out = await getShipmentWithDetails(result.rows[0].id);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

async function getShipmentWithDetails(id) {
  const ship = await pool.query("SELECT * FROM shipments WHERE id = $1", [id]);
  if (ship.rows.length === 0) return null;
  const s = ship.rows[0];
  const route = await pool.query(
    "SELECT * FROM shipment_route WHERE shipment_id = $1 ORDER BY sequence_order",
    [id],
  );
  const events = await pool.query(
    "SELECT * FROM shipment_events WHERE shipment_id = $1 ORDER BY created_at",
    [id],
  );
  return normalizeShipment({
    ...s,
    route: route.rows,
    events: events.rows,
  });
}

function normalizeShipment(s) {
  return s;
}
