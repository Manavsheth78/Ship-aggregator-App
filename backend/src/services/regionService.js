import { pool } from "../db/pool.js";

const STATUS_SEQUENCE = [
  "Label Created",
  "Picked Up",
  "In Transit",
  "Out For Delivery",
  "Delivered",
];

export function getNextStatus(current) {
  const idx = STATUS_SEQUENCE.indexOf(current);
  if (idx < 0 || idx >= STATUS_SEQUENCE.length - 1) return null;
  return STATUS_SEQUENCE[idx + 1];
}

export function getStatusSequence() {
  return [...STATUS_SEQUENCE];
}

import { STATE_TO_REGION } from "../data/stateMapping.js";

export async function getRegionByState(stateCode) {
  const code = String(stateCode || "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  if (!code) return null;

  // use static map as authoritative source
  const regionCode = STATE_TO_REGION[code];
  if (regionCode) {
    const result = await pool.query(
      "SELECT id, region_code, region_name, hub_city FROM region_graph WHERE region_code = $1",
      [regionCode],
    );
    if (result.rows[0]) return result.rows[0];
  }

  // fallback if the code is invalid or the mapping is missing
  const fallback = await pool.query(
    "SELECT id, region_code, region_name, hub_city FROM region_graph ORDER BY id LIMIT 1",
  );
  return fallback.rows[0] || null;
}

export async function getRegionById(id) {
  const result = await pool.query(
    "SELECT id, region_code, region_name, hub_city FROM region_graph WHERE id = $1",
    [id],
  );
  return result.rows[0] || null;
}

export async function getAdjacencyList() {
  const result = await pool.query(
    "SELECT id, adjacent_regions FROM region_graph ORDER BY id",
  );
  const adj = {};
  for (const row of result.rows) {
    adj[row.id] = row.adjacent_regions || [];
  }
  return adj;
}

export function bfsShortestPath(adj, startId, endId) {
  if (startId === endId) return [startId];
  const queue = [[startId]];
  const visited = new Set([startId]);
  while (queue.length > 0) {
    const path = queue.shift();
    const node = path[path.length - 1];
    const neighbors = adj[node] || [];
    for (const n of neighbors) {
      if (n === endId) return [...path, n];
      if (!visited.has(n)) {
        visited.add(n);
        queue.push([...path, n]);
      }
    }
  }
  return [];
}

export async function computeRoute(originState, destinationState) {
  const originRegion = await getRegionByState(originState);
  const destRegion = await getRegionByState(destinationState);
  if (!originRegion || !destRegion) return [];
  const adj = await getAdjacencyList();
  const path = bfsShortestPath(adj, originRegion.id, destRegion.id);
  const route = [];
  for (const regionId of path) {
    const r = await getRegionById(regionId);
    if (r) route.push({ regionId: r.id, hubCity: r.hub_city });
  }
  return route;
}
