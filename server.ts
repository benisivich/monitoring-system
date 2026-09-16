import express from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DATA_DIR, "coastal.sqlite");
const STALE_MS = 2 * 60 * 1000;

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  employee_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS security_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  session_lock INTEGER NOT NULL DEFAULT 0,
  confirm_alerts INTEGER NOT NULL DEFAULT 0,
  audit_trail INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gateways (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  last_heard_at TEXT,
  connected INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS buoys (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  battery INTEGER NOT NULL DEFAULT 0,
  latitude REAL,
  longitude REAL,
  last_ping TEXT
);

CREATE TABLE IF NOT EXISTS packets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buoy_id TEXT NOT NULL REFERENCES buoys(id) ON DELETE CASCADE,
  latitude REAL,
  longitude REAL,
  battery INTEGER NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  buoy_id TEXT,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS history_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  buoy_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS restricted_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  geojson TEXT
);

INSERT INTO gateways (id, name, last_heard_at, connected)
SELECT 1, 'LoRa gateway', NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM gateways LIMIT 1);
`;

async function startServer() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const SQL = await initSqlJs();
  let db: any;
  if (fs.existsSync(DB_FILE)) {
    try {
      db = new SQL.Database(fs.readFileSync(DB_FILE));
    } catch {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  db.run(SCHEMA_SQL);
  saveDb();

  function saveDb() {
    try {
      const data = db.export();
      fs.writeFileSync(DB_FILE, Buffer.from(data));
    } catch (e) {
      console.error("Failed to save database:", e);
    }
  }

  function all(sql: string, params: any[] = []): any[] {
    const stmt = db.prepare(sql);
    try {
      stmt.bind(params);
      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      return rows;
    } finally {
      stmt.free();
    }
  }

  function get(sql: string, params: any[] = []): any | null {
    const rows = all(sql, params);
    return rows[0] || null;
  }

  function run(sql: string, params: any[] = []): { lastInsertRowid: number; changes: number } {
    db.run(sql, params);
    const last = get("SELECT last_insert_rowid() AS id");
    const changes = get("SELECT changes() AS ch");
    saveDb();
    return {
      lastInsertRowid: Number(last?.id ?? 0),
      changes: Number(changes?.ch ?? 0),
    };
  }

  function hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString("hex");
  }

  function verifyPassword(password: string, salt: string, hash: string): boolean {
    const candidate = hashPassword(password, salt);
    try {
      return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
    } catch {
      return false;
    }
  }

  const app = express();

  app.use(cors());
  app.use(express.json());

  // Auth Middleware
  function requireAuth(req: any, res: any, next: any) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }
    const token = header.slice(7).trim();
    const session = get("SELECT user_id FROM sessions WHERE token = ?", [token]);
    if (!session) {
      return res.status(401).json({ error: "Invalid session" });
    }
    const user = get(
      `SELECT id, username, display_name AS displayName, email, phone, employee_id AS employeeId, notes
       FROM users WHERE id = ?`,
      [session.user_id]
    );
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    req.token = token;
    next();
  }

  // --- API Routes ---

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, now: new Date().toISOString() });
  });

  app.post("/api/auth/register", (req, res) => {
    const { username, password, displayName } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const cleanUser = String(username).trim();
    if (get("SELECT id FROM users WHERE username = ?", [cleanUser])) {
      return res.status(409).json({ error: "Username already taken" });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashPassword(password, salt);
    const now = new Date().toISOString();
    const result = run(
      `INSERT INTO users (username, password_salt, password_hash, display_name, email, phone, employee_id, notes, created_at)
       VALUES (?, ?, ?, ?, '', '', '', '', ?)`,
      [cleanUser, salt, hash, (displayName && String(displayName).trim()) || cleanUser, now]
    );
    const userId = result.lastInsertRowid;
    run("INSERT INTO security_settings (user_id) VALUES (?)", [userId]);
    const token = crypto.randomBytes(24).toString("hex");
    run("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", [token, userId, now]);
    const user = get(
      `SELECT id, username, display_name AS displayName, email, phone, employee_id AS employeeId, notes
       FROM users WHERE id = ?`,
      [userId]
    );
    res.status(201).json({ token, user });
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const userRow = get("SELECT * FROM users WHERE username = ?", [String(username).trim()]);
    if (!userRow || !verifyPassword(password, userRow.password_salt, userRow.password_hash)) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const token = crypto.randomBytes(24).toString("hex");
    const now = new Date().toISOString();
    run("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", [token, userRow.id, now]);
    res.json({
      token,
      user: {
        id: userRow.id,
        username: userRow.username,
        displayName: userRow.display_name,
        email: userRow.email || "",
        phone: userRow.phone || "",
        employeeId: userRow.employee_id || "",
        notes: userRow.notes || "",
      },
    });
  });

  app.post("/api/auth/logout", requireAuth, (req: any, res) => {
    run("DELETE FROM sessions WHERE token = ?", [req.token]);
    res.json({ ok: true });
  });

  app.get("/api/me", requireAuth, (req: any, res) => {
    res.json({ user: req.user });
  });

  app.patch("/api/me", requireAuth, (req: any, res) => {
    const { displayName, email, phone, employeeId, notes } = req.body || {};
    run(
      `UPDATE users
       SET display_name = COALESCE(?, display_name),
           email = COALESCE(?, email),
           phone = COALESCE(?, phone),
           employee_id = COALESCE(?, employee_id),
           notes = COALESCE(?, notes)
       WHERE id = ?`,
      [
        displayName !== undefined ? String(displayName) : null,
        email !== undefined ? String(email) : null,
        phone !== undefined ? String(phone) : null,
        employeeId !== undefined ? String(employeeId) : null,
        notes !== undefined ? String(notes) : null,
        req.user.id,
      ]
    );
    const updated = get(
      `SELECT id, username, display_name AS displayName, email, phone, employee_id AS employeeId, notes
       FROM users WHERE id = ?`,
      [req.user.id]
    );
    res.json({ user: updated });
  });

  app.patch("/api/me/password", requireAuth, (req: any, res) => {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password required" });
    }
    const userRow = get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!userRow || !verifyPassword(currentPassword, userRow.password_salt, userRow.password_hash)) {
      return res.status(400).json({ error: "Current password incorrect" });
    }
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = hashPassword(newPassword, salt);
    run("UPDATE users SET password_salt = ?, password_hash = ? WHERE id = ?", [salt, hash, req.user.id]);
    res.json({ ok: true });
  });

  app.get("/api/me/security", requireAuth, (req: any, res) => {
    const sec = get(
      `SELECT session_lock AS sessionLock, confirm_alerts AS confirmAlerts, audit_trail AS auditTrail
       FROM security_settings WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({
      security: sec || { sessionLock: 0, confirmAlerts: 0, auditTrail: 0 },
    });
  });

  app.patch("/api/me/security", requireAuth, (req: any, res) => {
    const { sessionLock, confirmAlerts, auditTrail } = req.body || {};
    run(
      `UPDATE security_settings
       SET session_lock = COALESCE(?, session_lock),
           confirm_alerts = COALESCE(?, confirm_alerts),
           audit_trail = COALESCE(?, audit_trail)
       WHERE user_id = ?`,
      [
        sessionLock !== undefined ? (sessionLock ? 1 : 0) : null,
        confirmAlerts !== undefined ? (confirmAlerts ? 1 : 0) : null,
        auditTrail !== undefined ? (auditTrail ? 1 : 0) : null,
        req.user.id,
      ]
    );
    const sec = get(
      `SELECT session_lock AS sessionLock, confirm_alerts AS confirmAlerts, audit_trail AS auditTrail
       FROM security_settings WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({ security: sec });
  });

  app.get("/api/snapshot", requireAuth, (_req, res) => {
    const gw = get("SELECT * FROM gateways WHERE id = 1");
    let connected = Boolean(gw?.connected);
    if (gw?.last_heard_at) {
      const diff = Date.now() - new Date(gw.last_heard_at).getTime();
      if (diff > STALE_MS) {
        connected = false;
        run("UPDATE gateways SET connected = 0 WHERE id = 1");
      }
    } else {
      connected = false;
    }

    const buoysRaw = all(
      `SELECT id, name, status, battery, latitude, longitude, last_ping AS lastPing
       FROM buoys ORDER BY id ASC`
    );

    const buoys = buoysRaw.map((b) => {
      let status = b.status;
      if (b.lastPing) {
        const diff = Date.now() - new Date(b.lastPing).getTime();
        if (diff > 5 * 60 * 1000) {
          status = "offline";
        }
      }
      return { ...b, status };
    });

    const alerts = all(
      `SELECT id, buoy_id AS buoy, title, detail, severity, status, created_at AS time
       FROM alerts ORDER BY id DESC LIMIT 50`
    );

    const history = all(
      `SELECT id, type, title, detail, created_at AS time
       FROM history_events ORDER BY id DESC LIMIT 100`
    );

    res.json({
      connected,
      lastHeardAt: gw?.last_heard_at || null,
      buoys,
      alerts,
      history,
    });
  });

  app.patch("/api/alerts/:id", requireAuth, (req, res) => {
    const { status } = req.body || {};
    if (!["active", "acknowledged", "resolved"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const result = run("UPDATE alerts SET status = ? WHERE id = ?", [status, req.params.id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }
    res.json({ ok: true, id: req.params.id, status });
  });

  app.post("/api/gateway/heartbeat", (_req, res) => {
    const now = new Date().toISOString();
    run("UPDATE gateways SET last_heard_at = ?, connected = 1 WHERE id = 1", [now]);
    run(
      "INSERT INTO history_events (type, title, detail, created_at) VALUES (?, ?, ?, ?)",
      ["gateway", "Gateway heartbeat", "LoRa gateway refreshed online state.", now]
    );
    res.json({ ok: true, now });
  });

  app.post("/api/packets", (req, res) => {
    const { deviceId, name, latitude, longitude, battery } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId required" });
    }
    const now = new Date().toISOString();
    const latNum = latitude !== undefined && latitude !== null ? Number(latitude) : null;
    const lngNum = longitude !== undefined && longitude !== null ? Number(longitude) : null;
    const batNum = battery !== undefined && battery !== null ? Math.round(Number(battery)) : 100;
    const displayName = (name && String(name).trim()) || String(deviceId).trim();

    run("UPDATE gateways SET last_heard_at = ?, connected = 1 WHERE id = 1", [now]);

    const existing = get("SELECT * FROM buoys WHERE id = ?", [deviceId]);
    let status: "online" | "warning" | "offline" = "online";
    if (batNum < 20) {
      status = "warning";
    }

    if (!existing) {
      run(
        `INSERT INTO buoys (id, name, status, battery, latitude, longitude, last_ping)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [deviceId, displayName, status, batNum, latNum, lngNum, now]
      );
      run(
        "INSERT INTO history_events (type, title, detail, buoy_id, created_at) VALUES (?, ?, ?, ?, ?)",
        [
          "status",
          "Buoy registered",
          `${displayName} received initial packet with ${batNum}% battery.`,
          deviceId,
          now,
        ]
      );
    } else {
      run(
        `UPDATE buoys
         SET name = ?, status = ?, battery = ?, latitude = ?, longitude = ?, last_ping = ?
         WHERE id = ?`,
        [displayName, status, batNum, latNum, lngNum, now, deviceId]
      );
    }

    run(
      `INSERT INTO packets (buoy_id, latitude, longitude, battery, received_at)
       VALUES (?, ?, ?, ?, ?)`,
      [deviceId, latNum, lngNum, batNum, now]
    );

    // Alert if battery is critically low
    if (batNum < 20) {
      run(
        `INSERT INTO alerts (buoy_id, title, detail, severity, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          deviceId,
          "Low battery warning",
          `${displayName} reported battery at ${batNum}%. Service or recharge recommended.`,
          "warning",
          "active",
          now,
        ]
      );
    }

    res.json({ ok: true, deviceId, now });
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Coastal Geofence Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
