import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("detector.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS model_state (
    id INTEGER PRIMARY KEY,
    weights TEXT,
    bias REAL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS training_data (
    id INTEGER PRIMARY KEY,
    url TEXT,
    features TEXT,
    label INTEGER, -- 0 for safe, 1 for malicious
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/model", (req, res) => {
    const row = db.prepare("SELECT * FROM model_state ORDER BY updated_at DESC LIMIT 1").get() as any;
    if (row) {
      res.json({ weights: JSON.parse(row.weights), bias: row.bias });
    } else {
      res.json(null);
    }
  });

  app.post("/api/model", (req, res) => {
    const { weights, bias } = req.body;
    db.prepare("INSERT INTO model_state (weights, bias) VALUES (?, ?)").run(
      JSON.stringify(weights),
      bias
    );
    res.json({ success: true });
  });

  app.post("/api/train", (req, res) => {
    const { url, features, label } = req.body;
    db.prepare("INSERT INTO training_data (url, features, label) VALUES (?, ?, ?)").run(
      url,
      JSON.stringify(features),
      label
    );
    res.json({ success: true });
  });

  app.get("/api/training-data", (req, res) => {
    const rows = db.prepare("SELECT * FROM training_data").all() as any[];
    res.json(rows.map(r => ({
      url: r.url,
      features: JSON.parse(r.features),
      label: r.label
    })));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
