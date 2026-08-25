require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 5173;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'gehtqksm',
  api_key: process.env.CLOUDINARY_API_KEY || '789519598658226',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'or7nJ7Z4CdIzHvbg8fWpJ52Gq_I',
  secure: true
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Database connection state
let pool = null;
let isDbConnected = false;
let lastDbError = null;
let schemaInitialized = false;

function createPool(config = {}) {
  const host = config.host || process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com';
  const port = parseInt(config.port || process.env.DB_PORT || 5432, 10);
  const database = config.database || process.env.DB_NAME || 'postgres';
  const user = config.user || process.env.DB_USER || 'postgres.rsaxtgzmyzinvyuimthi';
  const password = config.password !== undefined ? config.password : (process.env.DB_PASSWORD || '0QT8YTYv3DbDlbRl');

  return new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10
  });
}

// Initialize database schema
async function initDatabase(dbPool) {
  const client = await dbPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_collections (
        collection_name VARCHAR(64) NOT NULL,
        doc_id VARCHAR(128) NOT NULL,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (collection_name, doc_id)
      );

      CREATE INDEX IF NOT EXISTS idx_collection_name ON app_collections(collection_name);

      CREATE TABLE IF NOT EXISTS app_kv (
        key VARCHAR(128) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    schemaInitialized = true;
    isDbConnected = true;
    lastDbError = null;
    return true;
  } catch (err) {
    lastDbError = err.message;
    console.error('[Supabase Schema Init Error]:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// Lazy Pool and Client connection for Serverless & Local
async function getClient() {
  if (!pool) {
    pool = createPool();
  }
  
  const client = await pool.connect();
  if (!schemaInitialized) {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS app_collections (
          collection_name VARCHAR(64) NOT NULL,
          doc_id VARCHAR(128) NOT NULL,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (collection_name, doc_id)
        );
        CREATE INDEX IF NOT EXISTS idx_collection_name ON app_collections(collection_name);
        CREATE TABLE IF NOT EXISTS app_kv (
          key VARCHAR(128) PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      schemaInitialized = true;
      isDbConnected = true;
      lastDbError = null;
    } catch (e) {
      console.warn('Schema check warning:', e.message);
    }
  }
  return client;
}

// Initialize connection on startup
(async () => {
  try {
    pool = createPool();
    await initDatabase(pool);
    console.log('[Supabase Postgres] Successfully connected to Supabase PostgreSQL at ' + (process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com'));
  } catch (err) {
    isDbConnected = false;
    lastDbError = err.message;
    console.warn('[Supabase Postgres] Startup connection notice:', err.message);
  }
})();

// ==================== REST API ENDPOINTS ====================

// 1. Status Check
app.get('/api/status', async (req, res) => {
  let connected = isDbConnected;
  let testError = lastDbError;
  try {
    const client = await getClient();
    client.release();
    connected = true;
    testError = null;
  } catch (e) {
    connected = false;
    testError = e.message;
  }

  res.json({
    connected,
    host: process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_NAME || 'postgres',
    user: process.env.DB_USER || 'postgres.rsaxtgzmyzinvyuimthi',
    hasPassword: Boolean(process.env.DB_PASSWORD),
    supabaseUrl: process.env.SUPABASE_URL || 'https://rsaxtgzmyzinvyuimthi.supabase.co',
    cloudinaryCloud: process.env.CLOUDINARY_CLOUD_NAME || 'gehtqksm',
    error: testError
  });
});

// 2. Save & Test Database Configuration
app.post('/api/config', async (req, res) => {
  const { host, port, database, user, password, supabaseUrl } = req.body;

  if (host) process.env.DB_HOST = host;
  if (port) process.env.DB_PORT = String(port);
  if (database) process.env.DB_NAME = database;
  if (user) process.env.DB_USER = user;
  if (password !== undefined) process.env.DB_PASSWORD = password;
  if (supabaseUrl) process.env.SUPABASE_URL = supabaseUrl;

  try {
    if (pool) await pool.end().catch(() => { });
    pool = createPool({ host, port, database, user, password });
    schemaInitialized = false;
    await initDatabase(pool);
    res.json({ success: true, message: 'Successfully connected to Supabase PostgreSQL!' });
  } catch (err) {
    isDbConnected = false;
    lastDbError = err.message;
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Test Connection
app.get('/api/test', async (req, res) => {
  try {
    const client = await getClient();
    try {
      const result = await client.query('SELECT NOW() as now, version() as version;');
      isDbConnected = true;
      lastDbError = null;
      res.json({ success: true, timestamp: result.rows[0].now, version: result.rows[0].version });
    } finally {
      client.release();
    }
  } catch (err) {
    isDbConnected = false;
    lastDbError = err.message;
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Push / Sync Single Document
app.post('/api/sync/doc', async (req, res) => {
  const { collectionName, docId, data } = req.body;
  if (!collectionName || !docId) {
    return res.status(400).json({ success: false, error: 'Missing collectionName or docId' });
  }

  try {
    const client = await getClient();
    try {
      await client.query(
        `INSERT INTO app_collections (collection_name, doc_id, data, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (collection_name, doc_id)
         DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
        [collectionName, String(docId), JSON.stringify(data)]
      );
      res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error in /api/sync/doc (${collectionName}/${docId}):`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Delete Document
app.post('/api/sync/delete', async (req, res) => {
  const { collectionName, docId } = req.body;
  if (!collectionName || !docId) {
    return res.status(400).json({ success: false, error: 'Missing collectionName or docId' });
  }

  try {
    const client = await getClient();
    try {
      await client.query(
        `DELETE FROM app_collections WHERE collection_name = $1 AND doc_id = $2;`,
        [collectionName, String(docId)]
      );
      res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error in /api/sync/delete (${collectionName}/${docId}):`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Bulk Sync Collection (rooms, tenants, etc.)
app.post('/api/sync/collection', async (req, res) => {
  const { collectionName, items } = req.body;
  if (!collectionName || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: 'Invalid payload' });
  }

  try {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      for (const item of items) {
        if (item.id) {
          await client.query(
            `INSERT INTO app_collections (collection_name, doc_id, data, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (collection_name, doc_id)
             DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
            [collectionName, String(item.id), JSON.stringify(item)]
          );
        }
      }
      await client.query('COMMIT');
      res.json({ success: true, count: items.length });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error in /api/sync/collection (${collectionName}):`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Bulk Sync All App Data
app.post('/api/sync/all', async (req, res) => {
  const { rooms, tenants, meter_readings, invoices, expenses, settings, users } = req.body;

  try {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const collections = [
        { name: 'rooms', items: rooms || [] },
        { name: 'tenants', items: tenants || [] },
        { name: 'meter_readings', items: meter_readings || [] },
        { name: 'invoices', items: invoices || [] },
        { name: 'expenses', items: expenses || [] },
        { name: 'users', items: users || [] }
      ];

      for (const col of collections) {
        if (Array.isArray(col.items)) {
          for (const item of col.items) {
            if (item && item.id) {
              await client.query(
                `INSERT INTO app_collections (collection_name, doc_id, data, updated_at)
                 VALUES ($1, $2, $3, NOW())
                 ON CONFLICT (collection_name, doc_id)
                 DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
                [col.name, String(item.id), JSON.stringify(item)]
              );
            }
          }
        }
      }

      if (settings) {
        await client.query(
          `INSERT INTO app_collections (collection_name, doc_id, data, updated_at)
           VALUES ('settings', 'global_settings', $1, NOW())
           ON CONFLICT (collection_name, doc_id)
           DO UPDATE SET data = EXCLUDED.data, updated_at = NOW();`,
          [JSON.stringify(settings)]
        );
        await client.query(
          `INSERT INTO app_kv (key, value, updated_at)
           VALUES ('rental_settings', $1, NOW())
           ON CONFLICT (key)
           DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();`,
          [JSON.stringify(settings)]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, message: 'All data synced to Supabase PostgreSQL successfully!' });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error in /api/sync/all:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Pull / Fetch All Live Data from Supabase Postgres
app.get('/api/pull/all', async (req, res) => {
  try {
    const client = await getClient();
    try {
      const colResult = await client.query('SELECT collection_name, doc_id, data FROM app_collections;');
      const kvResult = await client.query('SELECT key, value FROM app_kv;');

      const result = {
        rooms: [],
        tenants: [],
        meter_readings: [],
        invoices: [],
        expenses: [],
        users: [],
        settings: null
      };

      colResult.rows.forEach(row => {
        const item = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        if (!item.id) item.id = row.doc_id;
        
        if (row.collection_name === 'settings' && row.doc_id === 'global_settings') {
          result.settings = item;
        } else if (result[row.collection_name]) {
          result[row.collection_name].push(item);
        }
      });

      kvResult.rows.forEach(row => {
        if (row.key === 'rental_settings' && !result.settings) {
          result.settings = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        }
      });

      res.json({ success: true, data: result });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error in /api/pull/all:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== CLOUDINARY UPLOAD API ====================

app.post('/api/upload', async (req, res) => {
  try {
    const { image, folder = 'general', public_id } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    // Upload to Cloudinary with automatic WebP conversion and quality optimization
    const uploadOptions = {
      folder: `rental_management/${folder}`,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    if (public_id) {
      uploadOptions.public_id = public_id;
      uploadOptions.overwrite = true;
    }

    const uploadResult = await cloudinary.uploader.upload(image, uploadOptions);

    res.json({
      success: true,
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to upload image to Cloudinary' });
  }
});

// ==================== STATIC FILES ====================

// Serve static frontend files
app.use(express.static(__dirname));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start listening if run directly (Local development)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`  Rental Room Management System (Cloud-First)`);
    console.log(`  Local URL: http://localhost:${PORT}`);
    console.log(`  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || 'gehtqksm'}`);
    console.log(`  Supabase Host: ${process.env.DB_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com'}`);
    console.log(`===================================================`);
  });
}

module.exports = app;
