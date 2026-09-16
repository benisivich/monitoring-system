# Coastal Geofencing Monitoring System

Mobile console plus a SQLite database API. Buoy counts stay at zero until the LoRa gateway posts packets.

## Run both processes

```bash
npm install
npm run api
npx expo start
```

Keep `npm run api` running. The database file is created at `server/data/coastal.sqlite`.

First launch: tap **Create account**, then **Sign in** after that.

## How data flows

1. Personnel accounts are stored in SQLite (`users`, `sessions`, `security_settings`).
2. The phone reads `/api/snapshot` for dashboard, monitor, alerts, history, and reports.
3. After you assemble the model, the ESP32 gateway should POST JSON to `/api/packets`:

```json
{
  "deviceId": "BUOY-01",
  "name": "Buoy 01",
  "latitude": 8.228,
  "longitude": 124.245,
  "battery": 87
}
```

Optional heartbeat: `POST /api/gateway/heartbeat`

The packet route does not require login so the microcontroller can send data. The app routes do require a signed-in session.
