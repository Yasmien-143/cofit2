import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

let dbPool = null;

async function initDb() {
  const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    DB_SSL = 'true',
  } = process.env;

  if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
    return;
  }

  dbPool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    connectionLimit: 5,
  });
}

// Serve the built Vite app
app.use(express.static(path.join(__dirname, 'dist')));

// Simple health endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// DB health endpoint for Aiven / Render / Workbench checks
app.get('/api/db-status', async (_req, res) => {
  if (!dbPool) {
    return res.status(503).json({ connected: false, reason: 'DB env vars not configured' });
  }

  try {
    const [rows] = await dbPool.query('SELECT 1 AS ok');
    return res.json({ connected: true, result: rows });
  } catch (error) {
    return res.status(500).json({ connected: false, error: error.message });
  }
});

// SPA fallback so client-side routes work
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize server:', error);
    process.exit(1);
  });