import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// =============================
// MIDDLEWARE (IMPORTANT FIX)
// =============================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// =============================
// DB POOL
// =============================
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
    console.log("⚠️ DB not configured, running in offline mode");
    return;
  }

  dbPool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  console.log("✅ Database pool initialized");
}

// =============================
// STATIC FRONTEND
// =============================
app.use(express.static(path.join(__dirname, 'dist')));

// =============================
// HEALTH CHECK
// =============================
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime()
  });
});

// =============================
// DB STATUS CHECK
// =============================
app.get('/api/db-status', async (_req, res) => {
  if (!dbPool) {
    return res.status(503).json({
      connected: false,
      reason: 'DB not configured'
    });
  }

  try {
    const [rows] = await dbPool.query('SELECT 1 AS ok');
    res.json({ connected: true, result: rows });
  } catch (error) {
    res.status(500).json({
      connected: false,
      error: error.message
    });
  }
});

// =============================
// SPA FALLBACK (FIXED FOR EXPRESS 5)
// =============================
app.use((_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// =============================
// START SERVER
// =============================
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`
🚀 Server running
Port: ${PORT}
Mode: ${process.env.NODE_ENV || 'development'}
      `);
    });
  })
  .catch((error) => {
    console.error("Server failed:", error);
    process.exit(1);
  });
