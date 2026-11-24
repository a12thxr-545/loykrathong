/**
 * Loy Krathong Server with Built-in SQLite Database
 * Runs on Node.js without requiring external npm packages!
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'wishes.sqlite');
const JSON_DB_FILE = path.join(DATA_DIR, 'wishes.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database (with JSON fallback)
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

// Database helper functions
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
    let list = [];
    if (fs.existsSync(JSON_DB_FILE)) {
      list = JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf-8'));
    }
    const idx = list.findIndex(item => item.id === wish.id);
    if (idx >= 0) list[idx] = wish;
    else list.unshift(wish);
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(list, null, 2));
    return wish;
  } catch (e) {
    console.warn('JSON save error:', e);
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
    if (fs.existsSync(JSON_DB_FILE)) {
      let list = JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf-8'));
      list = list.filter(item => item.id !== id);
      fs.writeFileSync(JSON_DB_FILE, JSON.stringify(list, null, 2));
      return true;
    }
  } catch (e) {}
  return false;
}

// MIME Types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP Server
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API Endpoints ---

  // Health check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', db: sqliteDb ? 'sqlite' : 'json' }));
    return;
  }

  // Get all wishes
  if (pathname === '/api/wishes' && req.method === 'GET') {
    const list = dbGetAllWishes();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
    return;
  }

  // Save wish
  if (pathname === '/api/wishes' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const wishData = JSON.parse(body);
        const saved = dbInsertWish(wishData);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(saved));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // Delete wish
  if (pathname.startsWith('/api/wishes/') && req.method === 'DELETE') {
    const id = decodeURIComponent(pathname.substring('/api/wishes/'.length));
    dbDeleteWish(id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, id }));
    return;
  }

  // --- Static File Serving ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Security check: stay within workspace
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Loy Krathong Server running at http://localhost:${PORT}`);
  });
}

module.exports = server;
