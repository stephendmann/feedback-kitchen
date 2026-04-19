/* ============================================================
   Feedback Kitchen — Stage 2 AI Garnish Proxy
   Vercel serverless function (Node 18+ runtime)

   Env vars required (set in Vercel dashboard):
     ANTHROPIC_API_KEY   — your Anthropic key (server-side only)
     FK_PROXY_USER       — shared username for colleague access
     FK_PROXY_PASSWORD   — shared password
     FK_ALLOWED_ORIGINS  — comma-separated list of allowed CORS origins
                           e.g. "https://feedback-kitchen.vercel.app,http://localhost:3000"
                           (optional — defaults to "*" which is fine for a shared-auth endpoint)
   ============================================================ */

// ── Simple in-memory rate limiter (per-IP) ─────────────────────
// Note: resets on every cold start. Good enough for small-scale colleague testing.
const RATE_WINDOW_MS = 60 * 1000;     // 1 minute
const RATE_MAX_CALLS = 20;            // 20 calls per IP per minute
const rateMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const bucket = rateMap.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > bucket.reset) {
    bucket.count = 0;
    bucket.reset = now + RATE_WINDOW_MS;
  }
  bucket.count += 1;
  rateMap.set(ip, bucket);
  return {
    ok: bucket.count <= RATE_MAX_CALLS,
    retryAfterSec: Math.max(1, Math.ceil((bucket.reset - now) / 1000))
  };
}

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allowList = (process.env.FK_ALLOWED_ORIGINS || '*')
    .split(',').map(s => s.trim()).filter(Boolean);
  const allow = allowList.includes('*')
    ? '*'
    : (allowList.includes(origin) ? origin : allowList[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

// ── Main handler ───────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  // Parse body (Vercel parses JSON automatically when Content-Type is application/json,
  // but guard against the raw case anyway)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const { user, password, prompt, model, maxTokens, mode } = body;

  // ── Auth gate ──
  const expectedUser = process.env.FK_PROXY_USER;
  const expectedPass = process.env.FK_PROXY_PASSWORD;
  if (!expectedUser || !expectedPass) {
    res.status(500).json({ error: 'Server not configured. Missing FK_PROXY_USER / FK_PROXY_PASSWORD.' });
    return;
  }
  if (user !== expectedUser || password !== expectedPass) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  // ── Rate limit ──
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    res.status(429).json({ error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` });
    return;
  }

  // ── Validate prompt ──
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'Missing prompt.' });
    return;
  }
  if (prompt.length > 20000) {
    res.status(400).json({ error: 'Prompt too long (max 20,000 chars).' });
    return;
  }

  // ── Anthropic key ──
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server not configured. Missing ANTHROPIC_API_KEY.' });
    return;
  }

  // ── Forward to Anthropic ──
  const requestedModel = (typeof model === 'string' && model.length)
    ? model
    : 'claude-haiku-4-5-20251001';
  const requestedMaxTokens = Number.isFinite(maxTokens) && maxTokens > 0 && maxTokens <= 4000
    ? Math.floor(maxTokens)
    : 1500;

  try {
    const anthRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: requestedModel,
        max_tokens: requestedMaxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await anthRes.json().catch(() => ({}));

    if (!anthRes.ok) {
      const msg = (data && data.error && data.error.message) || `Anthropic API error (${anthRes.status})`;
      res.status(anthRes.status >= 500 ? 502 : 400).json({ error: msg });
      return;
    }

    const text = Array.isArray(data.content)
      ? data.content.filter(c => c.type === 'text').map(c => c.text).join('\n').trim()
      : '';

    if (!text) {
      res.status(502).json({ error: 'Empty response from Anthropic.' });
      return;
    }

    console.log('[garnish] ok', { mode: mode || 'legacy', ip });

    res.status(200).json({
      body: text,
      model: data.model || requestedModel,
      usage: data.usage || null
    });
  } catch (err) {
    res.status(502).json({ error: 'Upstream fetch failed: ' + (err && err.message ? err.message : 'unknown') });
  }
};
