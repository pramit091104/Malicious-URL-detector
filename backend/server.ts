import express from "express";
import Database from "better-sqlite3";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { extractFeatures } from "./src/lib/featureExtraction.js";
import { getModelPrediction } from "./src/lib/mlModel.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, "detector.db"));

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

      // Use our new Hugging Face ONNX Model wrapper
      const modelResult = await getModelPrediction(url);

      // We still save the scan history in the database for auditing
      db.prepare("INSERT INTO training_data (url, features, label) VALUES (?, ?, ?)").run(
        url,
        JSON.stringify(features),
        modelResult.score > 0.5 ? 1 : 0
      );

      res.json({ prediction: modelResult.score, label: modelResult.label, rawScore: modelResult.rawScore, features });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to scan URL" });
    }
  });

  // Legacy Retraining & Weight API endpoints removed since inference is now handled by an ONNX HuggingFace Model.

  // Note: Static files are now served separately by the frontend container.

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
