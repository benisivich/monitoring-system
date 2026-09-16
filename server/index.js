const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const cors = require("cors");
const express = require("express");
const initSqlJs = require("sql.js");

const PORT = Number(process.env.PORT) || 3001;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "coastal.sqlite");
const SCHEMA_FILE = path.join(__dirname, "schema.sql");
const STALE_MS = 2 * 60 * 1000;

let db;

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(db.export()));
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

function nowIso() {
  return new Date().toISOString();
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

function createPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return { salt, hash: hashPassword(password, salt) };
}

function checkPassword(password, salt, hash) {
  const next = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(next, "hex"), Buffer.from(hash, "hex"));
}

function formatTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function buoyStatus(battery, lastPing) {
  if (!lastPing) return "offline";
  const age = Date.now() - new Date(lastPing).getTime();
  if (age > STALE_MS) return "offline";
  if (battery < 25) return "warning";
  return "online";
}

function gatewayConnected(row) {
  if (!row?.last_heard_at) return false;
  return Date.now() - new Date(row.last_heard_at).getTime() <= STALE_MS;
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Sign in required." });
    return;
  }
  const session = get("SELECT * FROM sessions WHERE token = ?", [token]);
  if (!session) {
    res.status(401).json({ error: "Session expired. Sign in again." });
    return;
  }
  req.user = get("SELECT * FROM users WHERE id = ?", [session.user_id]);
  if (!req.user) {
    res.status(401).json({ error: "Account not found." });
    return;
  }
  next();
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email ?? "",
    phone: user.phone ?? "",
    employeeId: user.employee_id ?? "",
    notes: user.notes ?? "",
  };
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  run("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", [token, userId, nowIso()]);
  return token;
}

function touchGateway() {
  const gateway = get("SELECT * FROM gateways ORDER BY id LIMIT 1");
  const wasConnected = gatewayConnected(gateway);
  run(
    "UPDATE gateways SET last_heard_at = ?, connected = 1 WHERE id = (SELECT id FROM gateways ORDER BY id LIMIT 1)",
    [nowIso()]
  );
  if (!wasConnected) {
    addHistory("gateway", "Gateway online", "LoRa gateway started sending data");
  }
}

function addHistory(type, title, detail, buoyId = null) {
  run(
    "INSERT INTO history_events (type, title, detail, buoy_id, created_at) VALUES (?, ?, ?, ?, ?)",
    [type, title, detail, buoyId, nowIso()]
  );
}

async function start() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_FILE)) {
    db = new SQL.Database(fs.readFileSync(DB_FILE));
  } else {
    db = new SQL.Database();
  }
  db.exec(fs.readFileSync(SCHEMA_FILE, "utf8"));
  persist();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, database: "sqlite", file: "server/data/coastal.sqlite" });
  });

  app.post("/api/auth/register", (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");
    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required." });
      return;
    }
    if (get("SELECT id FROM users WHERE username = ?", [username])) {
      res.status(409).json({ error: "That username is already taken." });
      return;
    }
    const { salt, hash } = createPassword(password);
    run(
      "INSERT INTO users (username, password_salt, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)",
      [username, salt, hash, username, nowIso()]
    );
    const user = get("SELECT * FROM users WHERE username = ?", [username]);
    run(
      "INSERT INTO security_settings (user_id, session_lock, confirm_alerts, audit_trail) VALUES (?, 0, 0, 0)",
      [user.id]
    );
    const token = createSession(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  });

  app.post("/api/auth/login", (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");
    const user = get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user || !checkPassword(password, user.password_salt, user.password_hash)) {
      res.status(401).json({ error: "Wrong username or password." });
      return;
    }
    const token = createSession(user.id);
    res.json({ token, user: publicUser(user) });
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const token = req.headers.authorization.slice(7);
    run("DELETE FROM sessions WHERE token = ?", [token]);
    res.json({ ok: true });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    const security = get("SELECT * FROM security_settings WHERE user_id = ?", [req.user.id]) ?? {
      session_lock: 0,
      confirm_alerts: 0,
      audit_trail: 0,
    };
    res.json({
      user: publicUser(req.user),
      security: {
        sessionLock: Boolean(security.session_lock),
        confirmAlerts: Boolean(security.confirm_alerts),
        auditTrail: Boolean(security.audit_trail),
      },
    });
  });

  app.patch("/api/me", requireAuth, (req, res) => {
    const displayName = String(req.body?.displayName ?? req.user.display_name).trim() || req.user.username;
    const email = String(req.body?.email ?? req.user.email ?? "");
    const phone = String(req.body?.phone ?? req.user.phone ?? "");
    const employeeId = String(req.body?.employeeId ?? req.user.employee_id ?? "");
    const notes = String(req.body?.notes ?? req.user.notes ?? "");
    run(
      "UPDATE users SET display_name = ?, email = ?, phone = ?, employee_id = ?, notes = ? WHERE id = ?",
      [displayName, email, phone, employeeId, notes, req.user.id]
    );
    const user = get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    res.json({ user: publicUser(user) });
  });

  app.patch("/api/me/password", requireAuth, (req, res) => {
    const current = String(req.body?.currentPassword ?? "");
    const next = String(req.body?.newPassword ?? "");
    if (!current || !next) {
      res.status(400).json({ error: "Current and new password are required." });
      return;
    }
    if (!checkPassword(current, req.user.password_salt, req.user.password_hash)) {
      res.status(401).json({ error: "Current password is wrong." });
      return;
    }
    const { salt, hash } = createPassword(next);
    run("UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?", [salt, hash, req.user.id]);
    res.json({ ok: true });
  });

  app.patch("/api/me/security", requireAuth, (req, res) => {
    run(
      `INSERT INTO security_settings (user_id, session_lock, confirm_alerts, audit_trail)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         session_lock = excluded.session_lock,
         confirm_alerts = excluded.confirm_alerts,
         audit_trail = excluded.audit_trail`,
      [
        req.user.id,
        req.body?.sessionLock ? 1 : 0,
        req.body?.confirmAlerts ? 1 : 0,
        req.body?.auditTrail ? 1 : 0,
      ]
    );
    res.json({
      security: {
        sessionLock: Boolean(req.body?.sessionLock),
        confirmAlerts: Boolean(req.body?.confirmAlerts),
        auditTrail: Boolean(req.body?.auditTrail),
      },
    });
  });

  app.get("/api/snapshot", requireAuth, (_req, res) => {
    const gateway = get("SELECT * FROM gateways ORDER BY id LIMIT 1");
    const connected = gatewayConnected(gateway);
    const buoys = all("SELECT * FROM buoys ORDER BY name").map((row) => {
      const status = buoyStatus(row.battery, row.last_ping);
      if (status !== row.status) {
        db.run("UPDATE buoys SET status = ? WHERE id = ?", [status, row.id]);
      }
      return {
        id: row.id,
        name: row.name,
        status,
        battery: row.battery,
        lastPing: row.last_ping ? formatTime(row.last_ping) : "Never",
        latitude: row.latitude,
        longitude: row.longitude,
      };
    });
    persist();

    const alerts = all("SELECT * FROM alerts ORDER BY datetime(created_at) DESC LIMIT 50").map((row) => ({
      id: String(row.id),
      title: row.title,
      detail: row.detail,
      time: formatTime(row.created_at),
      buoy: row.buoy_id ?? "",
      severity: row.severity,
      status: row.status,
    }));

    const history = all("SELECT * FROM history_events ORDER BY datetime(created_at) DESC LIMIT 100").map((row) => ({
      id: String(row.id),
      title: row.title,
      detail: row.detail,
      time: formatTime(row.created_at),
      type: row.type,
    }));

    res.json({
      connected,
      lastHeardAt: gateway?.last_heard_at ? formatTime(gateway.last_heard_at) : null,
      buoys,
      alerts,
      history,
    });
  });

  app.patch("/api/alerts/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body?.status ?? "");
    if (!["acknowledged", "resolved", "active"].includes(status)) {
      res.status(400).json({ error: "status must be active, acknowledged, or resolved." });
      return;
    }
    const alert = get("SELECT * FROM alerts WHERE id = ?", [id]);
    if (!alert) {
      res.status(404).json({ error: "Alert not found." });
      return;
    }
    run("UPDATE alerts SET status = ? WHERE id = ?", [status, id]);
    addHistory("status", `Alert ${status}`, alert.title, alert.buoy_id);
    res.json({ ok: true });
  });

  // Used by the assembled LoRa gateway. No login so the ESP32 can POST packets.
  app.post("/api/gateway/heartbeat", (_req, res) => {
    touchGateway();
    res.json({ ok: true });
  });

  app.post("/api/packets", (req, res) => {
    const deviceId = String(req.body?.deviceId ?? "").trim();
    const battery = Number(req.body?.battery);
    const latitude = req.body?.latitude == null ? null : Number(req.body.latitude);
    const longitude = req.body?.longitude == null ? null : Number(req.body.longitude);
    if (!deviceId || Number.isNaN(battery)) {
      res.status(400).json({ error: "deviceId and battery are required." });
      return;
    }
    const name = String(req.body?.name ?? deviceId);
    const receivedAt = String(req.body?.receivedAt ?? nowIso());
    const status = buoyStatus(battery, receivedAt);

    touchGateway();

    const existing = get("SELECT * FROM buoys WHERE id = ?", [deviceId]);
    if (existing) {
      run(
        "UPDATE buoys SET name = ?, status = ?, battery = ?, latitude = ?, longitude = ?, last_ping = ? WHERE id = ?",
        [name, status, battery, latitude, longitude, receivedAt, deviceId]
      );
    } else {
      run(
        "INSERT INTO buoys (id, name, status, battery, latitude, longitude, last_ping) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [deviceId, name, status, battery, latitude, longitude, receivedAt]
      );
      addHistory("status", `${name} joined`, "First packet received", deviceId);
    }

    run(
      "INSERT INTO packets (buoy_id, latitude, longitude, battery, received_at) VALUES (?, ?, ?, ?, ?)",
      [deviceId, latitude, longitude, battery, receivedAt]
    );

    if (battery < 25) {
      const open = get(
        "SELECT id FROM alerts WHERE buoy_id = ? AND title = ? AND status = 'active'",
        [deviceId, "Low battery"]
      );
      if (!open) {
        run(
          "INSERT INTO alerts (buoy_id, title, detail, severity, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
          [deviceId, "Low battery", `${name} reported ${battery}%.`, "warning", "active", nowIso()]
        );
        addHistory("status", "Low battery", name, deviceId);
      }
    }

    res.status(201).json({ ok: true, deviceId, status });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Coastal API + SQLite on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
