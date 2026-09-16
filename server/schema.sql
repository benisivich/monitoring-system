-- Coastal Geofencing Monitoring System
-- SQLite schema. The API (server/index.js) loads this file on first run.
-- Buoy / alert / history tables stay empty until the LoRa gateway posts packets.

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
