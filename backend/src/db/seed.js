import { pool } from "./pool.js";

// region definitions use region codes for adjacency so we can reseed safely
const regions = [
  {
    code: "NE",
    name: "Northeast",
    hub: "New York, NY",
    zipPrefix: "00",
    adjCodes: ["SE", "MW"],
  },
  {
    code: "SE",
    name: "Southeast",
    hub: "Atlanta, GA",
    zipPrefix: "30",
    adjCodes: ["NE", "MW", "SW"],
  },
  {
    code: "MW",
    name: "Midwest",
    hub: "Chicago, IL",
    zipPrefix: "60",
    adjCodes: ["NE", "SE", "SW", "W"],
  },
  {
    code: "SW",
    name: "Southwest",
    hub: "Dallas, TX",
    zipPrefix: "75",
    adjCodes: ["SE", "MW", "W"],
  },
  {
    code: "W",
    name: "West",
    hub: "Los Angeles, CA",
    zipPrefix: "90",
    adjCodes: ["MW", "SW"],
  },
];

// US state -> region mapping
const stateToRegion = {
  CT: "NE",
  MA: "NE",
  ME: "NE",
  NH: "NE",
  RI: "NE",
  VT: "NE",
  NY: "NE",
  NJ: "NE",
  PA: "NE",
  DE: "NE",
  FL: "SE",
  GA: "SE",
  MD: "SE",
  NC: "SE",
  SC: "SE",
  VA: "SE",
  WV: "SE",
  AL: "SE",
  KY: "SE",
  MS: "SE",
  TN: "SE",
  AR: "SE",
  LA: "SE",
  OK: "SE",
  DC: "SE",
  IL: "MW",
  IN: "MW",
  MI: "MW",
  OH: "MW",
  WI: "MW",
  IA: "MW",
  KS: "MW",
  MN: "MW",
  MO: "MW",
  NE: "MW",
  ND: "MW",
  SD: "MW",
  AZ: "SW",
  NM: "SW",
  TX: "SW",
  CA: "W",
  CO: "W",
  ID: "W",
  MT: "W",
  NV: "W",
  OR: "W",
  UT: "W",
  WA: "W",
  WY: "W",
  HI: "W",
  AK: "W",
};

async function seed() {
  const client = await pool.connect();
  try {
    // wipe existing data and reset serials so our hardcoded adjacency stays valid
    await client.query("TRUNCATE state_region RESTART IDENTITY CASCADE");
    await client.query("TRUNCATE region_graph RESTART IDENTITY CASCADE");

    // first insert nodes without adjacency
    for (const r of regions) {
      await client.query(
        `INSERT INTO region_graph (region_code, region_name, hub_city, zip_prefix)
         VALUES ($1, $2, $3, $4)`,
        [r.code, r.name, r.hub, r.zipPrefix],
      );
    }

    // build a map from code -> id
    const res = await client.query("SELECT id, region_code FROM region_graph");
    const idMap = {};
    for (const row of res.rows) {
      idMap[row.region_code] = row.id;
    }

    // update adjacency arrays using the newly assigned ids
    for (const r of regions) {
      const adjIds = (r.adjCodes || []).map((c) => idMap[c]).filter(Boolean);
      await client.query(
        "UPDATE region_graph SET adjacent_regions = $1 WHERE region_code = $2",
        [adjIds, r.code],
      );
    }

    for (const [stateCode, regionCode] of Object.entries(stateToRegion)) {
      await client.query(
        "INSERT INTO state_region (state_code, region_code) VALUES ($1, $2) ON CONFLICT (state_code) DO UPDATE SET region_code = $2",
        [stateCode, regionCode],
      );
    }

    console.log("Region graph and state mapping seeded successfully.");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
