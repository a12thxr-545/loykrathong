/**
 * Loy Krathong Server with Supabase Cloud + Built-in SQLite Database
 * Runs on Node.js without requiring external npm packages!
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// 1. Load .env configuration
try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

// Fallback manual .env parser if not loaded
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  try {
    const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch (e) {}
}

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gulhecqxxmxhhtioxgxo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'wishes.sqlite');
const JSON_DB_FILE = path.join(DATA_DIR, 'wishes.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 2. Initialize SQLite database (Local durable storage)
let sqliteDb = null;
try {
  const { DatabaseSync } = require('node:sqlite');
  sqliteDb = new DatabaseSync(DB_FILE);
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS wishes (
      id TEXT PRIMARY KEY,
      name1 TEXT,
      name2 TEXT,
      tagText TEXT,
      wish TEXT,
      letter TEXT,
      baseType TEXT,
      flowerType TEXT,
      candleColor TEXT,
      coinType TEXT,
      isCoupleMode INTEGER,
      createdAt TEXT,
      formattedDate TEXT,
      formattedTime TEXT
    )
  `);
  console.log('Database initialized: SQLite (' + DB_FILE + ')');
} catch (e) {
  console.warn('SQLite init note (using JSON storage fallback):', e.message);
  if (!fs.existsSync(JSON_DB_FILE)) {
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify([], null, 2));
  }
}

// Supabase cloud helpers
async function supabaseInsert(wish) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(wish)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function supabaseFetchAll() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes?select=*&order=createdAt.desc`, {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {}
  return null;
}

async function supabaseDelete(id) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/wishes?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Local Database helper functions
function dbGetAllWishes() {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('SELECT * FROM wishes ORDER BY createdAt DESC');
      const rows = stmt.all();
      return rows.map(r => ({
        ...r,
        isCoupleMode: Boolean(r.isCoupleMode)
      }));
    } catch (e) {
      console.warn('SQLite read error:', e);
    }
  }
  // JSON fallback
  try {
    if (fs.existsSync(JSON_DB_FILE)) {
      return JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf-8'));
    }
  } catch (e) {}
  return [];
}

function dbInsertWish(wish) {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare(`
        INSERT OR REPLACE INTO wishes (
          id, name1, name2, tagText, wish, letter, baseType,
          flowerType, candleColor, coinType, isCoupleMode,
          createdAt, formattedDate, formattedTime
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        wish.id,
        wish.name1 || '',
        wish.name2 || '',
        wish.tagText || '',
        wish.wish || '',
        wish.letter || '',
        wish.baseType || 'banana-leaf',
        wish.flowerType || 'lotus-bud',
        wish.candleColor || 'gold',
        wish.coinType || 'gold',
        wish.isCoupleMode ? 1 : 0,
        wish.createdAt || new Date().toISOString(),
        wish.formattedDate || '',
        wish.formattedTime || ''
      );
      return wish;
    } catch (e) {
      console.warn('SQLite insert error:', e);
    }
  }
  // JSON fallback
  try {
    const list = dbGetAllWishes();
    const existingIdx = list.findIndex(w => w.id === wish.id);
    if (existingIdx >= 0) {
      list[existingIdx] = wish;
    } else {
      list.unshift(wish);
    }
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(list, null, 2));
    return wish;
  } catch (e) {
    return wish;
  }
}

function dbDeleteWish(id) {
  if (sqliteDb) {
    try {
      const stmt = sqliteDb.prepare('DELETE FROM wishes WHERE id = ?');
      stmt.run(id);
      return true;
    } catch (e) {}
  }
  try {
    let list = dbGetAllWishes();
    list = list.filter(w => w.id !== id);
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(list, null, 2));
    return true;
  } catch (e) {
    return false;
  }
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg'
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Route: Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      sqlite: !!sqliteDb,
      supabase: !!SUPABASE_URL,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // API Route: Client config (safe publishable keys only)
  if (pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      supabaseUrl: SUPABASE_URL,
      supabasePublishableKey: SUPABASE_PUBLISHABLE_KEY
    }));
    return;
  }

  // API Route: GET /api/wishes
  if (pathname === '/api/wishes' && req.method === 'GET') {
    // 1. Try Supabase first
    const supabaseWishes = await supabaseFetchAll();
    if (supabaseWishes && supabaseWishes.length > 0) {
      // Sync into local SQLite
      supabaseWishes.forEach(w => dbInsertWish(w));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(supabaseWishes));
      return;
    }

    // 2. Fallback to local SQLite / JSON
    const wishes = dbGetAllWishes();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(wishes));
    return;
  }

  // API Route: POST /api/wishes
  if (pathname === '/api/wishes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const wish = JSON.parse(body);
        if (!wish.id) {
          wish.id = 'wish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        }
        // Save to SQLite
        const saved = dbInsertWish(wish);
        // Also save to Supabase Cloud in background
        supabaseInsert(saved).catch(() => {});

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, wish: saved }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // API Route: DELETE /api/wishes/:id
  if (pathname.startsWith('/api/wishes/') && req.method === 'DELETE') {
    const id = decodeURIComponent(pathname.replace('/api/wishes/', ''));
    dbDeleteWish(id);
    supabaseDelete(id).catch(() => {});
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, id }));
    return;
  }

  // Static File Serving
  let relativePath = pathname === '/' ? '/index.html' : pathname;
  let safePath = path.normalize(path.join(__dirname, relativePath));

  if (!safePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(safePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Loy Krathong Server running at http://localhost:${PORT}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
});
