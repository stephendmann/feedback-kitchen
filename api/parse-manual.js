/* ============================================================
   Feedback Kitchen — Manual-to-Scorer Parser
   Vercel serverless function (Node 18+ runtime)

   Two modes (passed as body.mode):
     "detect"  — scan PDF, return list of detected assessments with
                 rubric-likelihood and exportable flag
     "extract" — return draft FK JSON for one named assessment

   Auth: same FK_PROXY_USER / FK_PROXY_PASSWORD as garnish.js
   Rate limit: 5 calls / 10 minutes per IP
   Body: JSON { user, password, mode, pdfBase64, fileName, assessmentTitle? }
   Body size configured to 8 MB (handles PDFs up to ~6 MB)

   Env vars required:
     ANTHROPIC_API_KEY
     FK_PROXY_USER
     FK_PROXY_PASSWORD
     FK_ALLOWED_ORIGINS  (optional, comma-separated — defaults to *)
   ============================================================ */

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb'
    }
  }
};

// ── Rate limiter (5 calls / 10 min per IP) ─────────────────────
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_CALLS = 5;
const rateMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const bucket = rateMap.get(ip) || { count: 0, reset: now + RATE_WINDOW_MS };
  if (now > bucket.reset) { bucket.count = 0; bucket.reset = now + RATE_WINDOW_MS; }
  bucket.count += 1;
  rateMap.set(ip, bucket);
  return { ok: bucket.count <= RATE_MAX_CALLS, retryAfterSec: Math.max(1, Math.ceil((bucket.reset - now) / 1000)) };
}

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function setCors(req, res) {
  const origin = req.headers.origin || '';
  const allowList = (process.env.FK_ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean);
  const allow = allowList.includes('*') ? '*' : (allowList.includes(origin) ? origin : allowList[0] || '*');
  res.setHeader('Access-Control-Allow-Origin', allow);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// ── Default FK templates ───────────────────────────────────────
const DEFAULT_GRADE_SCALE = [
  { grade: 'A+', midpoint: 95, bandLow: 90, bandHigh: 100, tier: 'excellent' },
  { grade: 'A',  midpoint: 87, bandLow: 85, bandHigh: 89,  tier: 'excellent' },
  { grade: 'A-', midpoint: 82, bandLow: 80, bandHigh: 84,  tier: 'excellent' },
  { grade: 'B+', midpoint: 77, bandLow: 75, bandHigh: 79,  tier: 'proficient' },
  { grade: 'B',  midpoint: 72, bandLow: 70, bandHigh: 74,  tier: 'proficient' },
  { grade: 'B-', midpoint: 67, bandLow: 65, bandHigh: 69,  tier: 'proficient' },
  { grade: 'C+', midpoint: 62, bandLow: 60, bandHigh: 64,  tier: 'developing' },
  { grade: 'C',  midpoint: 57, bandLow: 55, bandHigh: 59,  tier: 'developing' },
  { grade: 'C-', midpoint: 52, bandLow: 50, bandHigh: 54,  tier: 'developing' },
  { grade: 'D',  midpoint: 44, bandLow: 40, bandHigh: 49,  tier: 'unsatisfactory' }
];

const DEFAULT_LATE_PENALTIES = [
  { label: 'On time — no penalty',        deduction: 0,  fail: false },
  { label: '1 day late (up to 24 hrs)',   deduction: 10, fail: false },
  { label: '2 days late (up to 48 hrs)',  deduction: 20, fail: false },
  { label: '3 days late (up to 72 hrs)',  deduction: 30, fail: false },
  { label: 'More than 3 days late',       deduction: 0,  fail: true  }
];

const DEFAULT_GRADE_FEEDBACK = [
  {
    grade: 'A+',
    intro: "This is genuinely outstanding work. Your submission shows exceptional analytical thinking, sophisticated command of the relevant frameworks, and the kind of polished, professional presentation that sets the benchmark for this assessment. The originality and rigour you have brought to every section are remarkable.",
    outro: "This is the standard to aspire to. Your work is exemplary in depth, structure, and communication. The next step is to test this thinking against external audiences — industry, publication, conference — where your analysis will hold its own."
  },
  {
    grade: 'A',
    intro: "This is excellent work. Your submission is well-structured, analytically strong, and demonstrates a confident grasp of the frameworks and their application. The depth and clarity of your work reflect a high level of engagement with the material.",
    outro: "Overall, this is an excellent submission: well-structured, well-argued, and well-written. The gap between this and an A+ is narrow and lies in originality and the precision of your evidence. You are clearly operating at a high standard."
  },
  {
    grade: 'A-',
    intro: "This is a very strong piece of work. Your submission shows clear analytical ability and a good command of the relevant frameworks. There are areas of genuine excellence here, though the work does not yet reach the consistency or depth of the higher A bands.",
    outro: "The gap to the top band is narrow and specific. Focus on the criterion-level feedback above to sharpen your strongest sections and lift the weaker ones to match. Top-tier work is well within your reach."
  },
  {
    grade: 'B+',
    intro: "Thank you for your submission. This is a solid and well-considered piece of work that shows a good understanding of the key concepts and frameworks. You have engaged meaningfully with the material and there are clear strengths here, particularly where your argument is most concrete.",
    outro: "You have produced a good piece of work with real strengths. To move into the A range, the priority is depth: deeper analysis of fewer points, supported by stronger evidence, will lift this further than broader coverage. The next band up is achievable."
  },
  {
    grade: 'B',
    intro: "Thank you for your submission. This is a competent piece of work that shows a sound grasp of the core concepts. Your work is generally clear and well-organised, and the foundations of strong analysis are visible in places.",
    outro: "Overall, this is a competent and well-considered submission. To move toward a B+ or higher, focus on the criterion-level actions above, particularly around analytical depth and use of evidence. You are tracking in the right direction."
  },
  {
    grade: 'B-',
    intro: "Thank you for your submission. Your work shows a reasonable understanding of the frameworks, though several sections lack the depth and consistency of higher bands. The foundations are present, but the analysis does not yet land with the precision the rubric expects.",
    outro: "You have the building blocks in place. The criterion feedback above identifies the specific gaps; closing two or three of those gaps would lift this work into a clear B. Focused effort on depth, evidence, and clarity of argument will pay off."
  },
  {
    grade: 'C+',
    intro: "Thank you for your submission. Your work shows a developing understanding of the key concepts, with some sections handled noticeably better than others. There are promising elements here that the criterion feedback below builds on directly.",
    outro: "There are real footholds in your work to build from. Two priorities: revisit the rubric descriptors at the proficient tier to see what the next step looks like, and re-engage with the course materials for the criteria flagged above."
  },
  {
    grade: 'C',
    intro: "Thank you for your submission. Your work shows a basic understanding of the key concepts and the effort you have put in is visible. There are foundations here to build on, but the analysis is not yet consistent enough across criteria to move into the proficient range.",
    outro: "Use this feedback as a roadmap. The single highest-leverage step is to re-read the rubric descriptors for each criterion and identify the one specific gap between your work and the proficient tier."
  },
  {
    grade: 'C-',
    intro: "Thank you for your submission. Your work touches on several required areas but lacks the depth and consistency needed to demonstrate a secure grasp of the key concepts. Read the criterion feedback below carefully; it identifies specific, addressable gaps rather than general weakness.",
    outro: "Please do not be discouraged. The improvement path here is concrete: pick the two criteria with the lowest scores, re-read their rubric descriptors, and rebuild those sections using the actions above."
  },
  {
    grade: 'D',
    intro: "Thank you for submitting your work. The submission does not yet meet the expected standard for this assessment, and the criterion feedback below sets out the gaps clearly. This is an important moment to engage with that feedback closely rather than move on.",
    outro: "The most useful next steps are practical: re-read the assessment brief and rubric alongside this feedback, book a meeting at office hours to discuss the gaps, and engage the academic support team early."
  }
];

// ── Claude API helper ──────────────────────────────────────────
async function callClaude(apiKey, messages, maxTokens) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || `Anthropic API error (${res.status})`;
    throw new Error(msg);
  }
  const text = Array.isArray(data.content)
    ? data.content.filter(c => c.type === 'text').map(c => c.text).join('\n').trim()
    : '';
  if (!text) throw new Error('Empty response from Anthropic');
  return text;
}

// Extract JSON from Claude's response (handles ```json code fences if present)
function extractJSON(text) {
  // Try raw parse first
  try { return JSON.parse(text); } catch {}
  // Strip markdown code fences
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    try { return JSON.parse(fenced[1].trim()); } catch {}
  }
  // Try to find first { ... } block
  const braceStart = text.indexOf('{');
  const braceEnd = text.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd > braceStart) {
    try { return JSON.parse(text.slice(braceStart, braceEnd + 1)); } catch {}
  }
  throw new Error('Could not parse JSON from Claude response');
}

// ── Detect mode ────────────────────────────────────────────────
async function detectAssessments(apiKey, pdfBase64) {
  const systemPrompt = `You analyze university assessment manuals to identify distinct assessment items. Return ONLY valid JSON — no markdown, no explanation, no prose.`;

  const userPrompt = `Analyze this assessment manual PDF and identify all distinct assessment sections.

For each section, determine whether it qualifies as exportable to a rubric-based marking system.

An assessment is exportable (exportable: true) ONLY when ALL of the following are confirmed:
1. The section has a rubric table with four performance bands (Excellent/A, Proficient/B, Developing/C, Unsatisfactory/D, or similar four-level scale)
2. At least one criterion row has a numeric percentage weight
3. The assessment appears to be formally graded and marked by a lecturer

Set exportable: false for: policy sections, workshop tasks, tutorial tests without a rubric table, informational text, or any assessment missing the four-band rubric or numeric weights.

Return exactly this JSON structure:
{
  "assessments": [
    {
      "title": "Assessment 1: Individual Case Essay",
      "weighting": 30,
      "rubricLikelihood": 0.95,
      "exportable": true,
      "notes": "Has 5 weighted criteria with 4-band rubric table"
    }
  ]
}

rubricLikelihood is a float from 0.0 to 1.0 indicating confidence that a four-band rubric is present.
weighting is null if not explicitly stated.
Include every distinct assessment-like section, including those with exportable: false.`;

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 }
        },
        { type: 'text', text: userPrompt }
      ]
    }
  ];

  const raw = await callClaude(apiKey, messages, 1500);
  const parsed = extractJSON(raw);
  if (!Array.isArray(parsed.assessments)) throw new Error('Detect response missing assessments array');
  return parsed.assessments;
}

// ── Extract mode ───────────────────────────────────────────────
async function extractAssessment(apiKey, pdfBase64, assessmentTitle) {
  const systemPrompt = `You extract data from university assessment manuals to create Feedback Kitchen scorer JSON. Return ONLY valid JSON — no markdown, no explanation, no prose. Never invent field values not present in the document.`;

  const userPrompt = `Extract a Feedback Kitchen scorer JSON for the assessment titled: "${assessmentTitle}"

Return exactly this JSON structure:
{
  "draft": {
    "assessmentTitle": "exact title from document",
    "name": "assessmentTitle + ' Scorer'",
    "courseName": "course code and year if found, else empty string",
    "universityName": "university name if found, else empty string",
    "assignmentInfo": "2-4 sentence summary: task description, weighting %, word/page limits, key submission constraints",
    "criteria": [
      {
        "name": "criterion name",
        "weight": 25,
        "rubric": {
          "excellent": "descriptor from Excellent/A column",
          "proficient": "descriptor from Proficient/B column",
          "developing": "descriptor from Developing/C column",
          "unsatisfactory": "descriptor from Unsatisfactory/D column"
        }
      }
    ],
    "scoreRounding": "half",
    "enableLatePenalties": true
  },
  "warnings": ["string describing any uncertain or missing fields"],
  "confidence": 0.85
}

Rubric column mapping:
  Excellent / A / Grade A  →  excellent
  Proficient / B / Grade B  →  proficient
  Developing / C / Grade C  →  developing
  Unsatisfactory / D / Grade D  →  unsatisfactory

Rules:
- criteria: include ONLY rows that have all four rubric bands AND a numeric weight percentage
- weights: use the numeric values from the document; if they don't sum to 100 add a warning
- assignmentInfo: include weighting %, word/page limit, submission format — exclude general AI policy or administrative text
- NEVER invent dates, page limits, or submission details not stated in this section — add a warning instead
- If a field is missing or uncertain, add a descriptive message to warnings[]
- confidence: your overall confidence (0.0–1.0) that the extracted data is accurate and complete`;

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 }
        },
        { type: 'text', text: userPrompt }
      ]
    }
  ];

  const raw = await callClaude(apiKey, messages, 6000);
  const parsed = extractJSON(raw);
  if (!parsed.draft) throw new Error('Extract response missing draft object');
  if (!Array.isArray(parsed.draft.criteria) || parsed.draft.criteria.length === 0) {
    throw new Error('No rubric criteria found in the selected assessment section');
  }
  return parsed;
}

// ── Server-side validation ─────────────────────────────────────
function validateDraft(draft) {
  const warnings = [];
  const REQUIRED_TIERS = ['excellent', 'proficient', 'developing', 'unsatisfactory'];

  if (!draft.assessmentTitle || !draft.assessmentTitle.trim()) {
    warnings.push('assessmentTitle is missing');
  }
  if (!Array.isArray(draft.criteria) || draft.criteria.length === 0) {
    warnings.push('No criteria found');
    return warnings;
  }

  let totalWeight = 0;
  draft.criteria.forEach((c, i) => {
    const label = c.name || `Criterion ${i + 1}`;
    if (!c.weight || typeof c.weight !== 'number') {
      warnings.push(`"${label}" is missing a numeric weight`);
    } else {
      totalWeight += c.weight;
    }
    if (!c.rubric) {
      warnings.push(`"${label}" has no rubric`);
    } else {
      REQUIRED_TIERS.forEach(tier => {
        if (!c.rubric[tier] || !String(c.rubric[tier]).trim()) {
          warnings.push(`"${label}" is missing the ${tier} rubric descriptor`);
        }
      });
    }
  });

  if (Math.abs(totalWeight - 100) > 0.5) {
    warnings.push(`Criterion weights sum to ${totalWeight}, not 100 — please adjust`);
  }

  return warnings;
}

// ── Main handler ───────────────────────────────────────────────
module.exports = async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Use POST.' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const { user, password, mode, pdfBase64, fileName, assessmentTitle } = body;

  // Auth
  const expectedUser = process.env.FK_PROXY_USER;
  const expectedPass = process.env.FK_PROXY_PASSWORD;
  if (!expectedUser || !expectedPass) {
    res.status(500).json({ error: 'Server not configured.' }); return;
  }
  if (user !== expectedUser || password !== expectedPass) {
    res.status(401).json({ error: 'Invalid username or password.' }); return;
  }

  // Rate limit
  const ip = getClientIp(req);
  const rl = rateLimit(ip);
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    res.status(429).json({ error: `Rate limit exceeded. Retry in ${rl.retryAfterSec}s.` }); return;
  }

  // Validate inputs
  if (mode !== 'detect' && mode !== 'extract') {
    res.status(400).json({ error: 'mode must be "detect" or "extract"' }); return;
  }
  if (typeof pdfBase64 !== 'string' || pdfBase64.length < 100) {
    res.status(400).json({ error: 'Missing or invalid pdfBase64' }); return;
  }
  if (mode === 'extract' && (!assessmentTitle || !assessmentTitle.trim())) {
    res.status(400).json({ error: 'assessmentTitle required for extract mode' }); return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY.' }); return; }

  try {
    if (mode === 'detect') {
      const assessments = await detectAssessments(apiKey, pdfBase64);
      console.log('[parse-manual] detect ok', { ip, fileName, count: assessments.length });
      res.status(200).json({ assessments });
      return;
    }

    // extract mode
    const result = await extractAssessment(apiKey, pdfBase64, assessmentTitle.trim());
    const draft = result.draft;

    // Assign IDs
    draft.id = uid();
    draft.created = new Date().toISOString();
    draft.version = '1.0';
    draft.appVersion = '2.5.1';

    // Add missing criterion IDs
    if (Array.isArray(draft.criteria)) {
      draft.criteria = draft.criteria.map(c => ({ id: uid(), ...c }));
    }

    // Apply defaults for fields not extracted from manual
    draft.gradeScale = DEFAULT_GRADE_SCALE;
    draft.gradeFeedback = JSON.parse(JSON.stringify(DEFAULT_GRADE_FEEDBACK));
    draft.latePenalties = JSON.parse(JSON.stringify(DEFAULT_LATE_PENALTIES));
    draft.enableLatePenalties = true;
    draft.scoreRounding = draft.scoreRounding || 'half';
    draft.courseName = draft.courseName || '';
    draft.universityName = draft.universityName || '';
    draft.assignmentInfo = draft.assignmentInfo || '';

    // Ensure name field
    if (!draft.name) {
      draft.name = (draft.assessmentTitle || 'Assessment') + ' Scorer';
    }

    // Server-side validation
    const validationWarnings = validateDraft(draft);
    const allWarnings = [...(result.warnings || []), ...validationWarnings];

    console.log('[parse-manual] extract ok', { ip, fileName, assessmentTitle, warnings: allWarnings.length });
    res.status(200).json({
      draft,
      warnings: allWarnings,
      confidence: typeof result.confidence === 'number' ? result.confidence : null
    });

  } catch (err) {
    console.error('[parse-manual] error', err && err.message);
    res.status(502).json({ error: (err && err.message) || 'Extraction failed' });
  }
};
