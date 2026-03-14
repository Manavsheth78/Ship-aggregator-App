import cron from 'node-cron';
import { pool } from '../db/pool.js';
import { getNextStatus } from '../services/regionService.js';
import { sendStatusChangeEmail } from '../services/emailService.js';

function formatLocation(city, state) {
  if (!city && !state) return null;
  return [city, state].filter(Boolean).join(', ');
}

export function startBackgroundWorker() {
  cron.schedule('*/2 * * * *', async () => {
    try {
      const result = await pool.query(
        `SELECT s.*, u.email FROM shipments s
         JOIN users u ON u.id = s.user_id
         WHERE s.mode = 'DEMO' AND s.status != 'Delivered'`
      );
      for (const row of result.rows) {
        const routeResult = await pool.query(
          'SELECT hub_city FROM shipment_route WHERE shipment_id = $1 ORDER BY sequence_order',
          [row.id]
        );
        const route = routeResult.rows.map((r) => r.hub_city);
        const originLocation = formatLocation(row.sender_city, row.sender_state) || 'Origin';
        const destLocation = formatLocation(row.receiver_city, row.receiver_state) || 'Destination';

        let nextStatus = null;
        let location = null;
        let description = null;

        if (row.status === 'Label Created') {
          nextStatus = 'Picked Up';
          location = originLocation;
          description = `Package picked up at ${originLocation}`;
        } else if (row.status === 'Picked Up') {
          if (route.length > 0) {
            nextStatus = 'In Transit';
            location = route[0];
            description = `Package in transit at ${route[0]}`;
          } else {
            nextStatus = 'Out For Delivery';
            location = destLocation;
            description = 'Out for delivery';
          }
        } else if (row.status === 'In Transit') {
          const inTransitEvents = await pool.query(
            "SELECT id FROM shipment_events WHERE shipment_id = $1 AND status = 'In Transit'",
            [row.id]
          );
          const inTransitCount = inTransitEvents.rows.length;
          if (inTransitCount < route.length - 1) {
            nextStatus = 'In Transit';
            location = route[inTransitCount];
            description = `Package in transit at ${route[inTransitCount]}`;
          } else {
            nextStatus = 'Out For Delivery';
            location = route.length > 0 ? route[route.length - 1] : destLocation;
            description = 'Out for delivery';
          }
        } else if (row.status === 'Out For Delivery') {
          nextStatus = 'Delivered';
          location = destLocation;
          description = 'Delivered';
        }

        if (!nextStatus) continue;

        await pool.query(
          'UPDATE shipments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [nextStatus, row.id]
        );
        await pool.query(
          'INSERT INTO shipment_events (shipment_id, status, description, location) VALUES ($1, $2, $3, $4)',
          [row.id, nextStatus, description, location]
        );

        await sendStatusChangeEmail(row.email, row.tracking_number, nextStatus, description);
      }
    } catch (e) {
      console.error('Background worker error:', e);
    }
  });
  console.log('Background worker started (every 2 minutes)');
}
