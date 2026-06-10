/* ============================================================
   Feedback Kitchen — local dev server
   Run:  node dev-server.js
   Then: http://localhost:3000/
   ============================================================
   • Serves every static file in the repo root.
   • Loads api/garnish.js and mounts it at POST /api/garnish,
     so the AI Assist panel works locally without Vercel.
   • Reads env vars from .env.local if present.
   • No build step, no dependencies beyond Node ≥18.
   ============================================================ */

'use strict';

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const ROOT  = __dirname;
const PORT  = parseInt(process.env.PORT || '3000', 10);

// ── Load .env.local if it exists ───────────────────────────────
(function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) return;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  });
  console.log('[dev] loaded .env.local');
})();

// ── Lazy-load the Vercel handlers ─────────────────────────────
let garnishHandler = null;
try {
  garnishHandler = require('./api/garnish.js');
  console.log('[dev] mounted POST /api/garnish      ->  api/garnish.js');
} catch (e) {
  console.warn('[dev] could not load api/garnish.js — /api/garnish will 500:', e.message);
}

let parseManualHandler = null;
try {
  parseManualHandler = require('./api/parse-manual.js');
  console.log('[dev] mounted POST /api/parse-manual ->  api/parse-manual.js');
} catch (e) {
  console.warn('[dev] could not load api/parse-manual.js — /api/parse-manual will 500:', e.message);
}

// ── MIME map ───────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico':  'image/x-icon',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.map':  'application/json'
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({
    'Cache-Control': 'no-store',
    'X-Dev-Server':  'feedback-kitchen-dev'
  }, headers || {}));
  res.end(body);
}

function sendFile(res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { send(res, 404, 'Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    const ct  = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type':  ct,
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
      'X-Dev-Server':  'feedback-kitchen-dev'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// Reject path traversal
function safeResolve(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]);
  const abs   = path.normalize(path.join(ROOT, clean));
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

// ── Request handler ────────────────────────────────────────────
async function handler(req, res) {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';

  // ── API routes ────────────────────────────────────────────────
  const apiHandlers = {
    '/api/garnish':      garnishHandler,
    '/api/parse-manual': parseManualHandler
  };

  if (pathname in apiHandlers) {
    const apiHandler = apiHandlers[pathname];
    if (!apiHandler) { send(res, 500, JSON.stringify({ error: pathname + ' handler not loaded' }), { 'Content-Type': 'application/json' }); return; }
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', async () => {
      try {
        if ((req.headers['content-type'] || '').includes('application/json') && raw) {
          try { req.body = JSON.parse(raw); } catch { req.body = {}; }
        } else {
          req.body = raw || {};
        }
        res.status = (code) => { res.statusCode = code; return res; };
        res.json   = (obj)  => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };
        await apiHandler(req, res);
      } catch (e) {
        console.error('[dev] ' + pathname + ' error:', e);
        if (!res.headersSent) send(res, 500, JSON.stringify({ error: String(e && e.message || e) }), { 'Content-Type': 'application/json' });
        else try { res.end(); } catch {}
      }
    });
    return;
  }

  // Only GET/HEAD for static
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method not allowed');
    return;
  }

  // Default document
  let target = pathname === '/' ? '/index.html' : pathname;
  const abs = safeResolve(target);
  if (!abs) { send(res, 403, 'Forbidden'); return; }

  fs.stat(abs, (err, stat) => {
    if (!err && stat.isDirectory()) {
      const indexAbs = path.join(abs, 'index.html');
      fs.stat(indexAbs, (e2, s2) => {
        if (!e2 && s2.isFile()) sendFile(res, indexAbs);
        else send(res, 404, 'Not found');
      });
      return;
    }
    if (err) { send(res, 404, 'Not found'); return; }
    sendFile(res, abs);
  });
}

// ── Boot ───────────────────────────────────────────────────────
const server = http.createServer(handler);
server.listen(PORT, () => {
  const lines = [
    '',
    '  Feedback Kitchen dev server',
    '  ──────────────────────────────────────',
    '  http://localhost:' + PORT + '/',
    '  http://localhost:' + PORT + '/scorer.html',
    '  http://localhost:' + PORT + '/builder.html',
    '',
    '  API: POST /api/garnish',
    '  AI creds: set FK_PROXY_USER, FK_PROXY_PASSWORD,',
    '  ANTHROPIC_API_KEY in .env.local (see .env.local.example).',
    '',
    '  Stop: Ctrl+C',
    ''
  ];
  console.log(lines.join('\n'));
});

// Friendly port-in-use message
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('[dev] port ' + PORT + ' is busy. Set PORT=3001 (or similar) and retry.');
    process.exit(1);
  }
  throw err;
});
