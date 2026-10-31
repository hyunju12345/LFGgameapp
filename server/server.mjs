import http from "node:http";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const folder =
  process.env.DATA_DIR ||
  path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
mkdirSync(folder, { recursive: true });
const db = new DatabaseSync(path.join(folder, "partyup.sqlite"));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,salt TEXT NOT NULL,game TEXT NOT NULL DEFAULT 'lol',style TEXT NOT NULL DEFAULT 'Chill',rank TEXT NOT NULL DEFAULT 'Casual',seen INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS parties(id TEXT PRIMARY KEY,owner TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,game TEXT NOT NULL,mode TEXT NOT NULL,tags TEXT NOT NULL,capacity INTEGER NOT NULL,is_open INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS members(party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,user_id TEXT REFERENCES users(id),PRIMARY KEY(party_id,user_id));
CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,party_id TEXT REFERENCES parties(id) ON DELETE CASCADE,user_id TEXT REFERENCES users(id),body TEXT NOT NULL,created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS friends(sender TEXT REFERENCES users(id),recipient TEXT REFERENCES users(id),status TEXT NOT NULL,PRIMARY KEY(sender,recipient));`);
const games = new Set([
  "lol",
  "valorant",
  "overwatch",
  "minecraft",
  "stardew",
  "roblox",
]);
const one = (sql, ...args) => db.prepare(sql).get(...args);
const all = (sql, ...args) => db.prepare(sql).all(...args);
const run = (sql, ...args) => db.prepare(sql).run(...args);
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const text = (value, min, max, label) => {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail(400, `${label}: ${min}–${max} characters required.`);
  return value.trim();
};
const profile = (u) => ({
  id: u.id,
  name: u.name,
  game: u.game,
  style: u.style,
  rank: u.rank,
  online: u.seen > Date.now() - 60000,
});
const member = (party, user) =>
  one("SELECT 1 FROM members WHERE party_id=? AND user_id=?", party, user);
const partyView = (p) => ({
  ...p,
  tags: JSON.parse(p.tags),
  is_open: !!p.is_open,
  members: all(
    "SELECT u.* FROM users u JOIN members m ON m.user_id=u.id WHERE m.party_id=?",
    p.id,
  ).map(profile),
});
const limits = new Map();
function throttle(key, max = 30) {
  const now = Date.now();
  const entry = limits.get(key);
  if (!entry || entry.reset < now) {
    limits.set(key, { n: 1, reset: now + 60000 });
    return;
  }
  if (++entry.n > max) fail(429, "Too many requests. Try again in a minute.");
}
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of limits) if (value.reset < now) limits.delete(key);
}, 60000).unref();
async function body(req) {
  let data = "";
  for await (const chunk of req) {
    data += chunk;
    if (data.length > 16384) fail(413, "Request too large.");
  }
  try {
    return data ? JSON.parse(data) : {};
  } catch {
    fail(400, "Invalid JSON.");
  }
}
function transaction(fn) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
function dispatch(req, b, url) {
  const route = url.pathname;
  const method = req.method;
  if (route === "/health") return { ok: true };
  if (route === "/auth/register" || route === "/auth/login") {
    if (method !== "POST") fail(405, "Use POST.");
    throttle(req.socket.remoteAddress + route, 12);
    const email = text(b.email, 3, 254, "Email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      fail(400, "Enter a valid email.");
    if (
      typeof b.password !== "string" ||
      b.password.length < 8 ||
      b.password.length > 128
    )
      fail(400, "Password must be 8–128 characters.");
    let u = one("SELECT * FROM users WHERE email=?", email);
    if (route === "/auth/register") {
      if (u) fail(409, "An account with this email already exists.");
      const name = text(b.name, 2, 30, "Name");
      const salt = randomBytes(16).toString("hex");
      const id = randomUUID();
      run(
        "INSERT INTO users(id,email,name,password,salt,seen) VALUES(?,?,?,?,?,?)",
        id,
        email,
        name,
        scryptSync(b.password, salt, 64).toString("hex"),
        salt,
        Date.now(),
      );
      u = one("SELECT * FROM users WHERE id=?", id);
    } else {
      const hash = scryptSync(b.password, u?.salt || "dummy-salt", 64);
      if (!u || !timingSafeEqual(hash, Buffer.from(u.password, "hex")))
        fail(401, "Email or password is incorrect.");
    }
    const token = randomBytes(32).toString("hex");
    run(
      "INSERT INTO sessions VALUES(?,?,?)",
      token,
      u.id,
      Date.now() + 30 * 86400000,
    );
    return { token, user: profile(u) };
  }
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  const u = one(
    "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
    token,
    Date.now(),
  );
  if (!u) fail(401, "Please sign in again.");
  throttle(u.id, 180);
  run("UPDATE users SET seen=? WHERE id=?", Date.now(), u.id);
  if (route === "/auth/logout" && method === "POST") {
    run("DELETE FROM sessions WHERE token=?", token);
    return { ok: true };
  }
  if (route === "/profile" && method === "PATCH") {
    const name = text(b.name, 2, 30, "Name");
    if (!games.has(b.game)) fail(400, "Choose a game.");
    const style = text(b.style, 2, 30, "Playstyle");
    const rank = text(b.rank, 2, 30, "Rank");
    run(
      "UPDATE users SET name=?,game=?,style=?,rank=? WHERE id=?",
      name,
      b.game,
      style,
      rank,
      u.id,
    );
    return profile(one("SELECT * FROM users WHERE id=?", u.id));
  }
  if (route === "/bootstrap" && method === "GET") {
    const relationships = all(
      "SELECT * FROM friends WHERE sender=? OR recipient=?",
      u.id,
      u.id,
    );
    const users = all(
      "SELECT * FROM users WHERE id<>? ORDER BY name LIMIT 200",
      u.id,
    ).map((v) => {
      const rel = relationships.find(
        (r) => r.sender === v.id || r.recipient === v.id,
      );
      return {
        ...profile(v),
        friendStatus: rel?.status || null,
        incoming: rel?.recipient === u.id,
        match: Math.round(
          100 *
            ((v.game === u.game ? 0.5 : 0) +
              (v.style === u.style ? 0.3 : 0) +
              (v.rank === u.rank ? 0.2 : 0)),
        ),
        reason:
          [
            v.game === u.game ? "Same game" : null,
            v.style === u.style ? "Same playstyle" : null,
            v.rank === u.rank ? "Similar rank" : null,
          ]
            .filter(Boolean)
            .join(" • ") || "Discover a new teammate",
      };
    });
    const parties = all(
      "SELECT p.* FROM parties p WHERE p.is_open=1 OR p.owner=? OR EXISTS(SELECT 1 FROM members m WHERE m.party_id=p.id AND m.user_id=?)",
      u.id,
      u.id,
    ).map(partyView);
    return { user: profile({ ...u, seen: Date.now() }), users, parties };
  }
  if (route === "/friends" && method === "POST") {
    const target = one("SELECT * FROM users WHERE id=?", b.userId);
    if (!target || target.id === u.id) fail(400, "Choose another player.");
    const incoming = one(
      "SELECT * FROM friends WHERE sender=? AND recipient=?",
      target.id,
      u.id,
    );
    if (incoming)
      run(
        "UPDATE friends SET status='accepted' WHERE sender=? AND recipient=?",
        target.id,
        u.id,
      );
    else
      run(
        "INSERT OR IGNORE INTO friends VALUES(?,?,'pending')",
        u.id,
        target.id,
      );
    return { ok: true };
  }
  if (route === "/parties" && method === "POST") {
    const name = text(b.name, 2, 50, "Party name");
    if (!games.has(b.game)) fail(400, "Choose a game.");
    const mode = text(b.mode, 2, 50, "Game mode");
    if (!Number.isInteger(b.capacity) || b.capacity < 2 || b.capacity > 10)
      fail(400, "Party size must be 2–10.");
    if (
      !Array.isArray(b.tags) ||
      b.tags.length > 5 ||
      b.tags.some((t) => typeof t !== "string" || t.length > 30)
    )
      fail(400, "Choose up to 5 playstyles.");
    const id = randomUUID();
    transaction(() => {
      run(
        "INSERT INTO parties VALUES(?,?,?,?,?,?,?,?)",
        id,
        u.id,
        name,
        b.game,
        mode,
        JSON.stringify(b.tags),
        b.capacity,
        b.is_open ? 1 : 0,
      );
      run("INSERT INTO members VALUES(?,?)", id, u.id);
    });
    return partyView(one("SELECT * FROM parties WHERE id=?", id));
  }
  const m = route.match(/^\/parties\/([^/]+)(?:\/(join|leave|messages))?$/);
  if (m) {
    const p = one("SELECT * FROM parties WHERE id=?", m[1]);
    if (!p) fail(404, "Party no longer exists.");
    if (m[2] === "join" && method === "POST") {
      transaction(() => {
        if (member(p.id, u.id)) return;
        if (!p.is_open) fail(403, "This party is private.");
        if (
          one("SELECT count(*) AS n FROM members WHERE party_id=?", p.id).n >=
          p.capacity
        )
          fail(409, "This party is full.");
        run("INSERT INTO members VALUES(?,?)", p.id, u.id);
      });
      return partyView(p);
    }
    if (!member(p.id, u.id)) fail(403, "Join this party first.");
    if (m[2] === "leave" && method === "POST") {
      transaction(() => {
        run("DELETE FROM members WHERE party_id=? AND user_id=?", p.id, u.id);
        const next = one("SELECT user_id FROM members WHERE party_id=?", p.id);
        if (!next) run("DELETE FROM parties WHERE id=?", p.id);
        else if (p.owner === u.id)
          run("UPDATE parties SET owner=? WHERE id=?", next.user_id, p.id);
      });
      return { ok: true };
    }
    if (m[2] === "messages") {
      if (method === "POST") {
        throttle(u.id + ":messages", 40);
        const message = text(b.body, 1, 2000, "Message");
        run(
          "INSERT INTO messages VALUES(?,?,?,?,?)",
          randomUUID(),
          p.id,
          u.id,
          message,
          Date.now(),
        );
      } else if (method !== "GET") fail(405, "Unsupported method.");
      return all(
        "SELECT m.*,u.name FROM messages m JOIN users u ON u.id=m.user_id WHERE m.party_id=? ORDER BY m.created DESC LIMIT 200",
        p.id,
      ).reverse();
    }
  }
  fail(404, "Not found.");
}
export const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader(
    "Access-Control-Allow-Origin",
    process.env.WEB_ORIGIN || "http://localhost:8081",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  try {
    const url = new URL(req.url, "http://localhost");
    const b = await body(req);
    const result = dispatch(req, b, url);
    res.writeHead(200);
    res.end(JSON.stringify(result));
  } catch (e) {
    res.writeHead(e.status || 500);
    res.end(JSON.stringify({ error: e.status ? e.message : "Server error." }));
    if (!e.status) console.error(e);
  }
});
if (process.env.NODE_ENV !== "test")
  server.listen(Number(process.env.PORT || 8787), "0.0.0.0", () =>
    console.log("PartyUp API listening on :" + (process.env.PORT || 8787)),
  );
