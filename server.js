const fs = require("fs");
const path = require("path");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "openagent.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const insertNewsStmt = db.prepare(`
  INSERT INTO news (title, content)
  VALUES (@title, @content)
`);

const listNewsStmt = db.prepare(`
  SELECT id, title, content, created_at
  FROM news
  ORDER BY id DESC
  LIMIT ?
`);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get("/api/news", (req, res) => {
  const limitRaw = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;
  const rows = listNewsStmt.all(limit);
  res.json({ items: rows });
});

app.post("/api/news", (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

  if (!title || !content) {
    return res.status(400).json({ error: "title and content are required" });
  }

  if (title.length > 140) {
    return res.status(400).json({ error: "title must be 140 characters or less" });
  }

  if (content.length > 5000) {
    return res.status(400).json({ error: "content must be 5000 characters or less" });
  }

  const result = insertNewsStmt.run({ title, content });
  const created = db
    .prepare("SELECT id, title, content, created_at FROM news WHERE id = ?")
    .get(result.lastInsertRowid);

  return res.status(201).json({ item: created });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`OpenAgent Hub server is running on http://localhost:${PORT}`);
});
