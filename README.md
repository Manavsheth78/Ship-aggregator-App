# Smart Shipment Monitoring System

Full-stack shipment tracking system with DEMO (simulated) and REAL (carrier API) modes.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL, JWT, Nodemailer, node-cron
- **Frontend:** React, Axios, React Router
- **Design:** Dark green (#1B5E20) and white palette

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### 1. Database

Create a database:

```sql
CREATE DATABASE shipment_monitoring;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, and SMTP settings
npm install
npm run db:init
npm run db:seed
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Access

- Frontend: http://localhost:3000
- Backend: http://localhost:3002

## Features

- **DEMO Mode:** Creates shipment with origin/destination ZIP, computes region path via BFS, generates route through hub cities. Background worker (every 2 min) progresses status: Label Created → Picked Up → In Transit → Out For Delivery → Delivered. Email on each status change.

> **Note:** the routing logic depends on a fixed mapping of US states to regions seeded into the database. If you ever reseed the DB or add new states/territories, make sure to run `npm run db:seed` (which now truncates and resets identity) so that adjacent region IDs stay consistent. Failing to do so can result in missing routes (e.g. AL→TX) until you reseed.

---

### Real carrier / tracking integration

The application ships in two modes:

- **DEMO** – simulated route/status (no external calls).
- **REAL** – you provide a carrier name (UPS, FedEx, USPS) and tracking
  number; the server will attempt to fetch live data from the carrier's
  API.

To enable real behaviour you must register for developer credentials at
each carrier and export the appropriate environment variables:

| Carrier                                                       | Env vars (example)                            | Notes                                         |
| ------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| UPS                                                           | `UPS_API_KEY`, `UPS_USERNAME`, `UPS_PASSWORD` | You can use the                               |
| sandbox URL (`onlinetools.ups.com`) while testing.            |
| FedEx                                                         | `FEDEX_CLIENT_ID`, `FEDEX_CLIENT_SECRET`      | The sample code                               |
| obtains an OAuth token and calls `/track/v1/trackingnumbers`. |
| USPS                                                          | `USPS_USER_ID`                                | The USPS API is XML‑based; the service helper |
| uses TrackV2.                                                 |

The implementation lives in `backend/src/services/*Service.js`.
Each module exports two helpers:

```js
// validate whether a number *could* exist; used when creating a REAL
// shipment or when tracking a number that isn’t in our database.
validate(trackingId) -> Promise<boolean>

// fetches and normalises live tracking data
fetchStatus(trackingId) -> Promise<{status,location,events,…}>
```

The top‑level `carrierService` dispatches based on carrier name and
returns helpful error messages if the carrier is unsupported or the
number is invalid. Track requests will now respond with 400/"Invalid
tracking number" when validation fails.

In your front end you can continue to call the `/track` endpoint; the
existing `TrackShipment.jsx` form already accepts a carrier name and
will display any error message returned by the API.

---

With these pieces in place, entering a real UPS/FedEx/USPS tracking
number will hit the carrier's servers and send back the current status.
You can further enhance each service module to handle retries, caching,
webhooks, etc.

- **REAL Mode:** Uses carrier and tracking ID; fetches from carrier API (currently simulated).
- **Auth:** JWT-based register/login.
- **Timeline:** Shipment events displayed in chronological order.

## API

| Method | Endpoint                    | Description                |
| ------ | --------------------------- | -------------------------- |
| POST   | /auth/register              | Register user              |
| POST   | /auth/login                 | Login                      |
| POST   | /shipments                  | Create shipment (auth)     |
| GET    | /shipments                  | List user shipments (auth) |
| GET    | /shipments/:id              | Get shipment detail (auth) |
| GET    | /track/:carrier/:trackingId | Track shipment (auth)      |
