import { computeRoute } from "./src/services/regionService.js";

async function test() {
  console.log("AL->TX", await computeRoute("AL", "TX"));
  console.log("AL->GA", await computeRoute("AL", "GA"));
  console.log("GA->TX", await computeRoute("GA", "TX"));
}

test().catch(console.error);
