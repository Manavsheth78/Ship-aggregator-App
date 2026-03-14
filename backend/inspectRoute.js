import {
  getRegionByState,
  getAdjacencyList,
  bfsShortestPath,
} from "./src/services/regionService.js";

async function inspect(from, to) {
  const o = await getRegionByState(from);
  const d = await getRegionByState(to);
  console.log(`${from} -> ${to}`);
  console.log("origin", o);
  console.log("dest  ", d);
  if (!o || !d) return;
  const adj = await getAdjacencyList();
  console.log("adjacency list:", adj);
  console.log("path:", bfsShortestPath(adj, o.id, d.id));
}

async function run() {
  await inspect("AL", "TX");
  await inspect("AL", "GA");
  await inspect("GA", "TX");
}

run().catch(console.error);
