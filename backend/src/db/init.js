import { pool } from './pool.js';

const initSQL = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Region_Graph (adjacency list: region_id -> array of adjacent region_ids)
CREATE TABLE IF NOT EXISTS region_graph (
  id SERIAL PRIMARY KEY,
  region_code VARCHAR(20) UNIQUE NOT NULL,
  region_name VARCHAR(100) NOT NULL,
  hub_city VARCHAR(100) NOT NULL,
  zip_prefix VARCHAR(5),
  adjacent_regions INTEGER[] DEFAULT '{}'
);

-- State to region mapping (US states -> region_code)
CREATE TABLE IF NOT EXISTS state_region (
  id SERIAL PRIMARY KEY,
  state_code VARCHAR(2) UNIQUE NOT NULL,
  region_code VARCHAR(20) NOT NULL
);

-- Shipments (production-style with full sender, receiver, package details)
CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tracking_number VARCHAR(50) UNIQUE NOT NULL,
  carrier VARCHAR(50),
  mode VARCHAR(10) NOT NULL CHECK (mode IN ('REAL', 'DEMO')),
  status VARCHAR(30) NOT NULL DEFAULT 'Label Created',
  sender_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_city TEXT NOT NULL,
  sender_state TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  receiver_city TEXT NOT NULL,
  receiver_state TEXT NOT NULL,
  package_weight NUMERIC NOT NULL,
  package_length NUMERIC NOT NULL,
  package_width NUMERIC NOT NULL,
  package_height NUMERIC NOT NULL,
  package_type TEXT NOT NULL,
  origin_region_id INTEGER REFERENCES region_graph(id),
  destination_region_id INTEGER REFERENCES region_graph(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipment_Route (ordered waypoints for DEMO mode)
CREATE TABLE IF NOT EXISTS shipment_route (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  hub_city VARCHAR(100) NOT NULL,
  region_id INTEGER REFERENCES region_graph(id),
  arrived_at TIMESTAMP,
  UNIQUE(shipment_id, sequence_order)
);

-- Shipment_Events (timeline)
CREATE TABLE IF NOT EXISTS shipment_events (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON shipment_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_state_region_state ON state_region(state_code);
`;

const migrationSQL = `
-- Migration v2: drop old shipments schema and recreate with new structure
DROP TABLE IF EXISTS shipment_route CASCADE;
DROP TABLE IF EXISTS shipment_events CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;

CREATE TABLE shipments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  tracking_number VARCHAR(50) UNIQUE NOT NULL,
  carrier VARCHAR(50),
  mode VARCHAR(10) NOT NULL CHECK (mode IN ('REAL', 'DEMO')),
  status VARCHAR(30) NOT NULL DEFAULT 'Label Created',
  sender_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_city TEXT NOT NULL,
  sender_state TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_address TEXT NOT NULL,
  receiver_city TEXT NOT NULL,
  receiver_state TEXT NOT NULL,
  package_weight NUMERIC NOT NULL,
  package_length NUMERIC NOT NULL,
  package_width NUMERIC NOT NULL,
  package_height NUMERIC NOT NULL,
  package_type TEXT NOT NULL,
  origin_region_id INTEGER REFERENCES region_graph(id),
  destination_region_id INTEGER REFERENCES region_graph(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipment_route (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  sequence_order INTEGER NOT NULL,
  hub_city VARCHAR(100) NOT NULL,
  region_id INTEGER REFERENCES region_graph(id),
  arrived_at TIMESTAMP,
  UNIQUE(shipment_id, sequence_order)
);

CREATE TABLE shipment_events (
  id SERIAL PRIMARY KEY,
  shipment_id INTEGER REFERENCES shipments(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  description TEXT,
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shipments_user ON shipments(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON shipment_events(shipment_id);
`;

async function init() {
  const client = await pool.connect();
  try {
    await client.query(initSQL);
    const checkTable = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'origin_zip'"
    );
    if (checkTable.rows.length > 0) {
      console.log('Migrating shipments table to v2 schema...');
      await client.query(migrationSQL);
      console.log('Migration complete.');
    }
    const checkStateRegion = await client.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = 'state_region'"
    );
    if (checkStateRegion.rows.length === 0) {
      await client.query(`
        CREATE TABLE state_region (
          id SERIAL PRIMARY KEY,
          state_code VARCHAR(2) UNIQUE NOT NULL,
          region_code VARCHAR(20) NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_state_region_state ON state_region(state_code);
      `);
    }
    console.log('Database initialized successfully.');
  } catch (e) {
    console.error('Init error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

init().catch(console.error);
