import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { extractFeatures, featuresToArray } from "./src/lib/featureExtraction.js";
import { MaliciousUrlModel, DEFAULT_MODEL_DATA } from "./src/lib/mlModel.js";

dotenv.config();
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
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Enable CORS
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/scan", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        res.status(400).json({ error: "Missing url" });
        return;
      }

      const features = extractFeatures(url);
      const featureArr = featuresToArray(features);

      const row = db.prepare("SELECT * FROM model_state ORDER BY updated_at DESC LIMIT 1").get() as any;
      const modelData = row ? { weights: JSON.parse(row.weights), bias: row.bias } : DEFAULT_MODEL_DATA;
      const model = new MaliciousUrlModel(modelData);

      const prediction = model.predict(featureArr);

      db.prepare("INSERT INTO training_data (url, features, label) VALUES (?, ?, ?)").run(
        url,
        JSON.stringify(featureArr),
        prediction > 0.5 ? 1 : 0
      );

      res.json({ prediction, features });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to scan URL" });
    }
  });

  app.post("/api/retrain", (req, res) => {
    try {
      const data = db.prepare("SELECT * FROM training_data").all() as any[];
      if (data.length === 0) {
        res.status(400).json({ error: "No training data available" });
        return;
      }

      const formattedData = data.map((item) => ({
        features: JSON.parse(item.features),
        label: item.label
      }));

      const row = db.prepare("SELECT * FROM model_state ORDER BY updated_at DESC LIMIT 1").get() as any;
      const modelData = row ? { weights: JSON.parse(row.weights), bias: row.bias } : DEFAULT_MODEL_DATA;
      const model = new MaliciousUrlModel(modelData);

      model.train(formattedData);

      const newWeights = model.getModelData();
      db.prepare("INSERT INTO model_state (weights, bias) VALUES (?, ?)").run(
        JSON.stringify(newWeights.weights),
        newWeights.bias
      );
      res.json({ success: true, samplesTrained: data.length });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to retrain model" });
    }
  });

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

  // Note: Static files are now served separately by the frontend container.

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
