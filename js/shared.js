/* ============================================================
   Score Automator — Shared Logic (shared.js)
   All constants, state management, scoring, and feedback
   ============================================================ */

(function () {
  'use strict';

  const CONFIGS_KEY = 'SA_CONFIGS';
  const ACTIVE_KEY  = 'SA_ACTIVE';

  /* ── Grade constants (NZ default — used as fallback) ─────── */
  const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'];

  const GRADE_MIDPOINTS = {
    'A+': 95, 'A': 87, 'A-': 82,
    'B+': 77, 'B': 72, 'B-': 67,
    'C+': 62, 'C': 57, 'C-': 52,
    'D': 44
  };

  // Maps grade → rubric tier key (lowercase, used to index criterion.rubric)
  const GRADE_TIERS = {
    'A+': 'excellent', 'A': 'excellent', 'A-': 'excellent',
    'B+': 'proficient', 'B': 'proficient', 'B-': 'proficient',
    'C+': 'developing',  'C': 'developing',  'C-': 'developing',
    'D':  'unsatisfactory'
  };

  const TIER_LABELS = {
    excellent:      'Excellent (A+ / A / A-)',
    proficient:     'Proficient (B+ / B / B-)',
    developing:     'Developing (C+ / C / C-)',
    unsatisfactory: 'Unsatisfactory (D)'
  };

  const TIER_BADGE_COLOURS = {
    excellent:      '#d1fae5',   // green-100
    proficient:     '#dbeafe',   // blue-100
    developing:     '#fef9c3',   // yellow-100
    unsatisfactory: '#fee2e2'    // red-100
  };

  // Sorted descending — first match wins (NZ default fallback)
  const GRADE_THRESHOLDS = [
    [90, 'A+'], [85, 'A'], [80, 'A-'],
    [75, 'B+'], [70, 'B'], [65, 'B-'],
    [60, 'C+'], [55, 'C'], [50, 'C-'],
    [0,  'D']
  ];

  /* ── Defaults ─────────────────────────────────────────────── */
  const DEFAULT_LATE_PENALTIES = [
    { label: 'On time — no penalty',           deduction: 0  },
    { label: '1 day late (up to 24 hrs)',       deduction: 10 },
    { label: '2 days late (up to 48 hrs)',      deduction: 20 },
    { label: '3 days late (up to 72 hrs)',      deduction: 30 },
    { label: 'More than 3 days late',           deduction: 0, fail: true }
  ];

  const DEFAULT_GRADE_FEEDBACK = [
    {
      grade: 'A+',
      intro: "This is genuinely outstanding work. Your submission demonstrates exceptional analytical thinking, a sophisticated command of the relevant frameworks, and the kind of polished, professional presentation that sets the benchmark for this assessment. The originality and rigour you've brought to every section are truly impressive.",
      outro: "This is the standard to aspire to. Your work is exemplary in its depth, structure, and communication. Continue to challenge yourself and push the boundaries of your thinking. Outstanding effort — you should be very proud of this work."
    },
    {
      grade: 'A',
      intro: "This is excellent work. Your submission is well-structured, analytically strong, and demonstrates a confident grasp of the frameworks and their application. The depth and clarity of your work reflects a high level of engagement with the material and a genuine understanding of the key concepts.",
      outro: "Overall, this is an excellent submission that is well-structured, well-argued, and well-written. You should feel confident about the quality of this work. Keep building on these strengths and continue pushing your analysis to the next level. Excellent effort — keep it up!"
    },
    {
      grade: 'A-',
      intro: "This is a very strong piece of work. Your submission shows clear analytical ability and a good command of the relevant frameworks. There are areas of genuine excellence here, and with a little more depth or supporting evidence in places, this could move into the highest band.",
      outro: "This is a very strong submission with several areas of genuine quality. The gap to the top band is narrow, so focus on the specific feedback above to sharpen your analysis and strengthen your evidence base. You're clearly capable of top-tier work — keep refining your approach."
    },
    {
      grade: 'B+',
      intro: "Thank you for your submission. This is a solid and well-considered piece of work that demonstrates a good understanding of the key concepts and frameworks. You've engaged meaningfully with the material and there are clear strengths here. With some targeted refinement, you are well-placed to achieve even higher marks.",
      outro: "You've produced a good piece of work with real strengths. To move into the A range, focus on deepening your analysis, supporting claims with stronger evidence, and ensuring consistency across all sections. You're not far off — keep pushing and the next step up is very achievable."
    },
    {
      grade: 'B',
      intro: "Thank you for your submission. This is a competent piece of work that shows a sound understanding of the core concepts. Your work is generally clear and well-organised, though deeper analysis or stronger evidence would lift the quality further.",
      outro: "Overall, this is a competent and well-considered submission. You've shown a good grasp of the key frameworks and made a genuine effort throughout. Focus on the areas flagged above to strengthen the depth and rigour of your analysis. Good work — keep pushing forward and you'll continue to improve."
    },
    {
      grade: 'B-',
      intro: "Thank you for your submission. Your work demonstrates a reasonable understanding of the frameworks, though some sections would benefit from greater depth and more consistent application. The foundations are here — with more focused analytical effort, stronger results are within reach.",
      outro: "The building blocks are here and you're heading in the right direction. Focus on depth of analysis, use of evidence, and clarity of argument. With focused effort, a B or higher is well within your reach next time."
    },
    {
      grade: 'C+',
      intro: "Thank you for your submission. Your work shows a developing understanding of the key concepts, with some sections handled better than others. There are promising elements here, and the feedback below is intended to help you see where a little more effort would make a real difference.",
      outro: "There are promising elements in your work, and with more focused effort you can definitely move up. Pay close attention to the feedback above, particularly around analytical depth and use of evidence. Review the course materials and seek support where needed to strengthen your approach."
    },
    {
      grade: 'C',
      intro: "Thank you for your submission. Your work shows a basic understanding of the key concepts, and I can see the effort you have put in. There are some foundations here to build on, and the feedback below will help you focus your energy for future assessments.",
      outro: "There is clear potential in your work. Use this feedback as a roadmap for improvement — focus on deeper analysis, critical engagement, and clear structure. Don't hesitate to reach out if you'd like to discuss any of the feedback — keep working at it."
    },
    {
      grade: 'C-',
      intro: "Thank you for your submission. Your work touches on several required areas but lacks the depth and consistency needed to demonstrate a secure understanding of the key concepts. I'd encourage you to read the feedback below carefully as a guide for where to focus your efforts going forward.",
      outro: "Please don't be discouraged. Use the feedback above to identify specific areas to work on, and take advantage of available support — office hours, academic support services, and course materials. Improvement is very achievable with the right focus."
    },
    {
      grade: 'D',
      intro: "Thank you for submitting your work. While I appreciate that you made a submission, the work does not yet meet the expected standard for this assessment. The feedback below outlines the key areas that need significant development, and I encourage you to engage with this carefully and seek support if you are unsure how to move forward.",
      outro: "I would strongly encourage you to review the assessment brief and marking rubric carefully, and to make use of available support — whether that is visiting office hours, working with the academic support team, or engaging with the course materials more deeply. Please don't give up — with focused effort and the right support, improvement is absolutely achievable."
    }
  ];

  /* ── Utility ──────────────────────────────────────────────── */
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  // Default scoreToGrade using hardcoded NZ thresholds (fallback only)
  function scoreToGrade(score) {
    for (const [floor, grade] of GRADE_THRESHOLDS) {
      if (score >= floor) return grade;
    }
    return 'D';
  }

  // scoreToGrade using a custom gradeScale array
  // Sorts by bandLow descending so highest band matches first
  function scoreToGradeFromScale(score, gradeScale) {
    const sorted = gradeScale.slice().sort((a, b) => b.bandLow - a.bandLow);
    for (const entry of sorted) {
      if (score >= entry.bandLow) return entry.grade;
    }
    // If below all bands, return the lowest grade in the scale
    return sorted[sorted.length - 1].grade;
  }

  function formatDate(date) {
    if (!date) date = new Date();
    return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function newConfig() {
    return {
      id:             uid(),
      created:        new Date().toISOString(),
      name:           'My Scorer',
      assessmentTitle:'',
      courseName:     '',
      universityName: '',
      assignmentInfo: '',
      version:        '1.0',
      appVersion:     '2.5.1',   // Feedback Kitchen app version for export provenance
      gradeScale:     null,   // null = use NZ default; array = custom scale from builder Step 2
      criteria: [
        {
          id: uid(), name: '', weight: 100,
          rubric: { excellent: '', proficient: '', developing: '', unsatisfactory: '' }
        }
      ],
      gradeFeedback:      JSON.parse(JSON.stringify(DEFAULT_GRADE_FEEDBACK)),
      latePenalties:      JSON.parse(JSON.stringify(DEFAULT_LATE_PENALTIES)),
      enableLatePenalties: true,
      scoreRounding:      'none'   // 'none' | 'half' | 'whole'
    };
  }

  /* ── Persistence ─────────────────────────────────────────── */
  function loadAllConfigs() {
    try { return JSON.parse(localStorage.getItem(CONFIGS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  function saveAllConfigs(configs) {
    localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
  }

  function saveConfig(config) {
    const all = loadAllConfigs();
    const idx = all.findIndex(c => c.id === config.id);
    if (idx >= 0) all[idx] = config; else all.push(config);
    saveAllConfigs(all);
  }

  function deleteConfig(id) {
    saveAllConfigs(loadAllConfigs().filter(c => c.id !== id));
    if (getActiveId() === id) localStorage.removeItem(ACTIVE_KEY);
  }

  function loadConfig(id) {
    return loadAllConfigs().find(c => c.id === id) || null;
  }

  function getActiveId()    { return localStorage.getItem(ACTIVE_KEY); }
  function setActiveId(id)  { localStorage.setItem(ACTIVE_KEY, id); }
  function loadActiveConfig() {
    const id = getActiveId();
    return id ? loadConfig(id) : null;
  }

  /* ── Scoring engine ──────────────────────────────────────── */
  function computeScores(config, studentGrades, latePenaltyIndex) {
    const rounding = config.scoreRounding || 'none';
    let weightedTotal = 0;
    const rows        = [];

    // Build lookup maps from custom gradeScale if present
    const useCustomScale  = Array.isArray(config.gradeScale) && config.gradeScale.length > 0;
    const scaleMidpoints  = {};  // grade → midpoint
    const scaleTiers      = {};  // grade → tier key

    if (useCustomScale) {
      config.gradeScale.forEach(g => {
        scaleMidpoints[g.grade] = g.midpoint;
        scaleTiers[g.grade]     = g.tier;
      });
    }

    for (let i = 0; i < config.criteria.length; i++) {
      const criterion = config.criteria[i];
      const sg        = studentGrades[i] || {};

      if (!sg.grade) {
        rows.push({ criterion, grade: null, midpoint: null, override: null,
                    finalScore: null, weightedScore: null, tier: null, descriptor: null });
        continue;
      }

      // Use custom scale values when available, fall back to hardcoded NZ defaults
      const midpoint   = useCustomScale
        ? (scaleMidpoints[sg.grade] !== undefined ? scaleMidpoints[sg.grade] : 50)
        : (GRADE_MIDPOINTS[sg.grade] !== undefined ? GRADE_MIDPOINTS[sg.grade] : 50);

      let override = null;
      if (sg.override !== undefined && sg.override !== null && sg.override !== '') {
        const parsed = parseFloat(sg.override);
        if (!isNaN(parsed)) {
          override = parsed;
        }
      }
      const finalScore = override !== null ? override : midpoint;
      const weightedScore = finalScore * criterion.weight / 100;

      const tier       = useCustomScale
        ? (scaleTiers[sg.grade] || 'developing')
        : (GRADE_TIERS[sg.grade] || 'developing');

      const descriptor = criterion.rubric[tier] || '';

      // Sum the displayed (rounded) per-criterion weighted scores so the
      // total always equals the visible column sum. This trades a theoretical
      // sub-0.5 precision drift for perfect visual consistency for markers.
      weightedTotal += parseFloat(formatScore(weightedScore, rounding));
      rows.push({ criterion, grade: sg.grade, midpoint, override, finalScore, weightedScore, tier, descriptor });
    }

    const roundedTotal = parseFloat(formatScore(weightedTotal, rounding));

    const lp = (config.enableLatePenalties && latePenaltyIndex != null)
                 ? config.latePenalties[latePenaltyIndex]
                 : config.latePenalties[0];

    const isFail         = lp && lp.fail;
    const deduction      = lp ? lp.deduction : 0;
    const penalisedScore = isFail ? 0 : Math.max(0, roundedTotal - deduction);
    const roundedPenalisedScore = parseFloat(formatScore(penalisedScore, rounding));

    // Use custom scale thresholds for grade suggestion if available
    const suggestedGrade = isFail ? (useCustomScale ? config.gradeScale[config.gradeScale.length - 1].grade : 'D')
      : useCustomScale
        ? scoreToGradeFromScale(roundedPenalisedScore, config.gradeScale)
        : scoreToGrade(roundedPenalisedScore);

    return { rows, weightedTotal: roundedTotal, deduction, isFail, penalisedScore: roundedPenalisedScore, suggestedGrade, latePenalty: lp, rawTotal: weightedTotal };
  }

  function generateFeedbackText(config, scoreResult) {
    const { rows, weightedTotal, penalisedScore, suggestedGrade, latePenalty, deduction, isFail } = scoreResult;
    const rounding = config.scoreRounding || 'none';

    // Intro/outro always reflects the quality of the actual work (pre-penalty grade),
    // so a late deduction doesn't unfairly colour the academic feedback tone.
    const useCustomScale   = Array.isArray(config.gradeScale) && config.gradeScale.length > 0;
    const prepenaltyGrade  = useCustomScale
      ? scoreToGradeFromScale(weightedTotal, config.gradeScale)
      : scoreToGrade(weightedTotal);
    const entry = config.gradeFeedback.find(gf => gf.grade === prepenaltyGrade);

    const parts = [];

    if (entry?.intro) { parts.push(entry.intro); parts.push(''); }

    for (const row of rows) {
      if (!row.grade) continue;
      const ws = formatScore(row.weightedScore, rounding);
      parts.push(`${row.criterion.name} – ${ws} / ${row.criterion.weight}`);
      if (row.descriptor) parts.push(row.descriptor);
      parts.push('');
    }

    parts.push(`TOTAL SCORE: ${formatScore(weightedTotal, rounding)} / 100`);

    // Outro sits here — after the score summary, before any late penalty notice
    if (entry?.outro) { parts.push(''); parts.push(entry.outro); }

    if (latePenalty && (deduction > 0 || isFail)) {
      parts.push('');
      const item = config.assessmentTitle || 'submission';
      if (isFail) {
        const failGrade = config.gradeScale
          ? config.gradeScale[config.gradeScale.length - 1].grade
          : 'D';
        parts.push(`LATE SUBMISSION NOTICE: This ${item} was submitted more than 3 days late and receives a grade of ${failGrade} as per university policy.`);
        parts.push(`FINAL SCORE (after late penalty): 0 / 100`);
      } else {
        parts.push(`LATE SUBMISSION NOTICE: As your ${item} was submitted ${latePenalty.label.toLowerCase()}, a further ${deduction}% (out of 100%) has been deducted from the total above.`);
        parts.push(`FINAL SCORE (after late penalty): ${formatScore(penalisedScore, rounding)} / 100`);
      }
    }

    return parts.join('\n');
  }

  /* ── AI Garnish (beta) — Stage 0 prompt builder ──────────── */
  // SANDBOX ONLY. Builds a prompt string the marker can paste into Claude Pro
  // (or similar). The model rewrites ONLY the criterion-by-criterion body —
  // intro, outro, TOTAL SCORE line, and late-penalty wording are produced
  // deterministically and stitched back together by assembleFinalFeedback().
  const AI_LOG_KEY     = 'SA_AI_LOG';
  const SNIPPETS_KEY   = 'SA_SNIPPETS';
  const AI_LOG_MAX     = 20;
  const AI_BODY_WORD_CAP_DEFAULT = 350;

  function loadSnippets() {
    try { return JSON.parse(localStorage.getItem(SNIPPETS_KEY) || '[]'); }
    catch (e) { return []; }
  }

  /* ── PII scrubber ────────────────────────────────────────────
     Strips configured student name and student ID from any string
     before it enters the prompt. Called from buildAIGarnishPrompt
     so the guarantee is code-enforced, not marker-discipline.
     Pulls identifiers from the live DOM fields (#student-name,
     #student-id) and also from any explicitly-passed opts.studentName
     / opts.studentId. Case-insensitive, whole-token match, redacts
     with [REDACTED]. Generic email pattern is also stripped.
     ───────────────────────────────────────────────────────── */
  function _getStudentIdentifiers(opts) {
    const ids = [];
    const push = v => {
      const s = (v || '').trim();
      if (s && s.length >= 1) ids.push(s);
    };
    push(opts && opts.studentName);
    push(opts && opts.studentId);
    if (typeof document !== 'undefined') {
      const nameEl = document.getElementById('student-name');
      const idEl   = document.getElementById('student-id');
      if (nameEl) push(nameEl.value);
      if (idEl)   push(idEl.value);
      // Also strip name tokens individually (first name alone is still PII)
      if (nameEl && nameEl.value) {
        nameEl.value.trim().split(/\s+/).forEach(tok => {
          if (tok.length >= 2) push(tok);
        });
      }
    }
    // De-dupe, sort longest-first so "John Smith" is replaced before "John"
    return Array.from(new Set(ids)).sort((a, b) => b.length - a.length);
  }

  function _escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function scrubPII(text, opts) {
    if (!text) return text;
    let out = String(text);
    const ids = _getStudentIdentifiers(opts || {});
    // Unicode-aware "word" chars: any letter or number (any script) plus
    // apostrophe variants and hyphen, so names like "Renée", "Müller",
    // "O'Brien", "Ngāti", "Smith-Jones" are matched correctly.
    ids.forEach(id => {
      const re = new RegExp(
        '(^|[^\\p{L}\\p{N}\\u2019\\u0027\\-])' +
        _escapeRegex(id) +
        '(?=[^\\p{L}\\p{N}\\u2019\\u0027\\-]|$)',
        'giu'
      );
      out = out.replace(re, '$1[REDACTED]');
    });
    // Generic email pattern (safety net)
    out = out.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED]');
    return out;
  }

  function buildAIGarnishPrompt(config, scoreResult, opts) {
    opts = opts || {};
    const markerNotesRaw = (opts.markerNotes || '').trim();
    const markerNotes    = scrubPII(markerNotesRaw, opts);
    const snippets       = Array.isArray(opts.snippets) ? opts.snippets : loadSnippets();
    const wordCap        = opts.wordCap || AI_BODY_WORD_CAP_DEFAULT;
    const exemplars    = snippets.slice(0, 5).map(function (s) {
      // Snippets may be strings or { label, text } objects — handle both
      if (typeof s === 'string') return s;
      return (s && (s.text || s.label)) || '';
    }).filter(Boolean);

    const { rows, weightedTotal } = scoreResult;
    const useCustomScale = Array.isArray(config.gradeScale) && config.gradeScale.length > 0;
    const prepenaltyGrade = useCustomScale
      ? scoreToGradeFromScale(weightedTotal, config.gradeScale)
      : scoreToGrade(weightedTotal);

    const rounding = config.scoreRounding || 'none';
    const criteriaBlock = rows
      .filter(function (r) { return r.grade; })
      .map(function (r) {
        return [
          'CRITERION: ' + r.criterion.name,
          '  Weight: ' + r.criterion.weight + '%',
          '  Grade awarded: ' + r.grade + '  (tier: ' + (r.tier || 'n/a') + ')',
          '  Weighted score: ' + formatScore(r.weightedScore, rounding) + ' / ' + r.criterion.weight,
          '  Rubric descriptor (substantive claims MUST be preserved):',
          '    ' + (r.descriptor || '(no descriptor)').replace(/\n/g, '\n    ')
        ].join('\n');
      }).join('\n\n');

    const exemplarBlock = exemplars.length
      ? exemplars.map(function (e, i) { return '  [' + (i + 1) + '] ' + e; }).join('\n')
      : '  (none supplied — use a warm, specific, second-person academic voice)';

    const notesBlock = markerNotes
      ? markerNotes
      : '(none supplied — rely on rubric descriptors; do not invent criticism)';

    return [
      'ROLE: You are drafting the CRITERION-BY-CRITERION BODY of feedback for a',
      'university assessment. This is a rewrite/personalisation task, not a grading',
      'task.',
      '',
      'HARD RULES:',
      '  1. Do NOT change, mention, justify, or re-derive the grade.',
      '  2. Do NOT produce an intro, outro, TOTAL SCORE line, or late-penalty wording.',
      '     Those are produced separately by deterministic code and will be stitched',
      '     around your output.',
      '  3. Preserve every substantive claim in each rubric descriptor.',
      '  4. Integrate the marker\'s private notes naturally into the relevant criterion',
      '     where they are specific to that criterion. Do not invent criticism or',
      '     praise that is not supported by the rubric descriptor or the notes.',
      '  5. Use Au/NZ spelling. Address the student in the second person.',
      '  6. Match the tutor voice exemplars where natural.',
      '  7. Stay under ' + wordCap + ' words for the whole body.',
      '  8. Output format: one block per criterion, in the same order as below.',
      '     For each criterion use exactly this header line:',
      '       <Criterion name> – <weighted score to 1 d.p.> / <weight>',
      '     followed by one or two short paragraphs of personalised commentary.',
      '     Separate criteria with a single blank line. No markdown, no bullet list.',
      '',
      'CONTEXT (for your information only — do not quote):',
      '  Assessment: ' + (config.assessmentTitle || '(untitled)'),
      '  Course: '     + (config.courseName || '(unspecified)'),
      '  Pre-penalty grade (set by marker — do not mention): ' + prepenaltyGrade,
      '',
      'CRITERIA TO REWRITE:',
      '',
      criteriaBlock || '(no graded criteria — abort)',
      '',
      'MARKER\'S PRIVATE NOTES (integrate where relevant):',
      notesBlock,
      '',
      'TUTOR VOICE EXEMPLARS (preferred phrasings):',
      exemplarBlock,
      '',
      'Return ONLY the rewritten criterion-by-criterion body. Nothing else.'
    ].join('\n');
  }

  function buildAIAssistPrompt(mode, config, scoreResult, opts) {
    opts = opts || {};
    const base = buildAIGarnishPrompt(config, scoreResult, opts);
    const existingBody = scrubPII((opts.existingBody || '').trim(), opts);
    const extras = {
      draft:
        '\n\nMODE: DRAFT_FROM_RUBRIC — you are producing a fresh criterion-by-criterion body.',
      improve:
        '\n\nMODE: IMPROVE_CLARITY_AND_TONE — you are given an EXISTING criterion body below. Preserve every substantive claim; rewrite for clarity, tone, and consistency. Do not shorten aggressively.' +
        '\n\nEXISTING BODY TO IMPROVE:\n' + (existingBody || '(none supplied — fall back to DRAFT mode)'),
      shorten:
        '\n\nMODE: SHORTEN_FOR_LMS — you are given an EXISTING criterion body below. Preserve every substantive claim. Compress to under 1800 characters total. Keep the per-criterion structure.' +
        '\n\nEXISTING BODY TO SHORTEN:\n' + (existingBody || '(none supplied — fall back to DRAFT mode)')
    };
    return base + (extras[mode] || extras.draft);
  }

  // Stitches: [student header] + intro + AI body + TOTAL SCORE + outro + late-penalty.
  // aiBody is the raw paste-back from the LLM (just the criteria rewrite).
  function assembleFinalFeedback(config, scoreResult, aiBody, opts) {
    opts = opts || {};
    const studentName = (opts.studentName || '').trim();
    const useCustomScale = Array.isArray(config.gradeScale) && config.gradeScale.length > 0;
    const { weightedTotal, penalisedScore, latePenalty, deduction, isFail } = scoreResult;
    const prepenaltyGrade = useCustomScale
      ? scoreToGradeFromScale(weightedTotal, config.gradeScale)
      : scoreToGrade(weightedTotal);
    const entry = config.gradeFeedback.find(function (gf) { return gf.grade === prepenaltyGrade; });

    const parts = [];
    if (studentName) { parts.push('Hi ' + studentName + ','); parts.push(''); }
    if (entry && entry.intro) { parts.push(entry.intro); parts.push(''); }

    const rounding = config.scoreRounding || 'none';

    parts.push(String(aiBody || '').trim());
    parts.push('');
    parts.push('TOTAL SCORE: ' + formatScore(weightedTotal, rounding) + ' / 100');

    if (entry && entry.outro) { parts.push(''); parts.push(entry.outro); }

    if (latePenalty && (deduction > 0 || isFail)) {
      parts.push('');
      const item = config.assessmentTitle || 'submission';
      if (isFail) {
        const failGrade = useCustomScale
          ? config.gradeScale[config.gradeScale.length - 1].grade
          : 'D';
        parts.push('LATE SUBMISSION NOTICE: This ' + item + ' was submitted more than 3 days late and receives a grade of ' + failGrade + ' as per university policy.');
        parts.push('FINAL SCORE (after late penalty): 0 / 100');
      } else {
        parts.push('LATE SUBMISSION NOTICE: As your ' + item + ' was submitted ' + latePenalty.label.toLowerCase() + ', a further ' + deduction + '% (out of 100%) has been deducted from the total above.');
        parts.push('FINAL SCORE (after late penalty): ' + formatScore(penalisedScore, rounding) + ' / 100');
      }
    }
    return parts.join('\n');
  }

  function logAssistantRun(entry) {
    try {
      const log = JSON.parse(localStorage.getItem(AI_LOG_KEY) || '[]');
      log.unshift(Object.assign({ ts: new Date().toISOString() }, entry));
      while (log.length > AI_LOG_MAX) log.pop();
      localStorage.setItem(AI_LOG_KEY, JSON.stringify(log));
    } catch (e) { /* ignore */ }
  }

  function clearAssistantLog() { localStorage.removeItem(AI_LOG_KEY); }

  // Back-compat aliases (deprecated — remove after all callers updated)
  const logAIGarnish = logAssistantRun;
  const clearAIGarnishLog = clearAssistantLog;

  /* ── Cohort persistence (per scorer) ─────────────────────────
     Stores completed-student records under SA_COHORT_<scorerId>.
     Shape:
       {
         scorerId, label, multiMarker, createdAt, updatedAt,
         students: [ { id, key, name, studentId, tutor, date,
                       grades: [...], penaltyIdx, scoreResult,
                       feedbackText, markerNotes, savedAt } ]
       }
     Match-key for upsert: studentId (case-insensitive, trimmed) if present,
     otherwise name (case-insensitive, trimmed).
  ─────────────────────────────────────────────────────────────── */
  const COHORT_PREFIX = 'SA_COHORT_';

  function cohortKey(scorerId) { return COHORT_PREFIX + scorerId; }

  function studentMatchKey(student) {
    const sid  = (student.studentId || '').trim().toLowerCase();
    if (sid) return 'sid:' + sid;
    const name = (student.name || '').trim().toLowerCase();
    return name ? 'name:' + name : null;
  }

  function getCohort(scorerId) {
    try {
      const raw = localStorage.getItem(cohortKey(scorerId));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveCohort(cohort) {
    if (!cohort || !cohort.scorerId) return;
    cohort.updatedAt = new Date().toISOString();
    localStorage.setItem(cohortKey(cohort.scorerId), JSON.stringify(cohort));
  }

  function initCohort(scorerId, label, multiMarker) {
    const cohort = {
      scorerId:    scorerId,
      label:       (label || '').trim() || 'Cohort',
      multiMarker: !!multiMarker,
      createdAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
      students:    []
    };
    saveCohort(cohort);
    return cohort;
  }

  function addToCohort(scorerId, studentRecord) {
    let cohort = getCohort(scorerId);
    if (!cohort) {
      // No cohort yet — caller must prompt first. Initialise as unlabelled fallback
      // so we don't lose data, but this path should rarely be hit.
      cohort = initCohort(scorerId, 'Untitled cohort', false);
    }
    const key = studentMatchKey(studentRecord);
    if (!key) {
      // No ID and no name — refuse to save
      return { saved: false, reason: 'no-identifier' };
    }
    studentRecord.key     = key;
    studentRecord.savedAt = new Date().toISOString();
    if (!studentRecord.id) studentRecord.id = uid();

    const existingIdx = cohort.students.findIndex(s => s.key === key);
    let replaced = false;
    if (existingIdx >= 0) {
      studentRecord.id        = cohort.students[existingIdx].id;
      studentRecord.createdAt = cohort.students[existingIdx].createdAt || cohort.students[existingIdx].savedAt;
      cohort.students[existingIdx] = studentRecord;
      replaced = true;
    } else {
      studentRecord.createdAt = studentRecord.savedAt;
      cohort.students.push(studentRecord);
    }
    saveCohort(cohort);
    return { saved: true, replaced: replaced, count: cohort.students.length };
  }

  function removeFromCohort(scorerId, studentKey) {
    const cohort = getCohort(scorerId);
    if (!cohort) return false;
    cohort.students = cohort.students.filter(s => s.key !== studentKey);
    saveCohort(cohort);
    return true;
  }

  function clearCohort(scorerId) {
    localStorage.removeItem(cohortKey(scorerId));
  }

  function cohortAgeDays(cohort) {
    if (!cohort || !cohort.createdAt) return 0;
    const ms = Date.now() - new Date(cohort.createdAt).getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }

  /* ── Score formatting helper ──────────────────────────────── */
  // Rounds and formats a numeric score according to the scorer's rounding preference.
  // rounding: 'none' (1 d.p.), 'half' (nearest 0.5), 'whole' (nearest integer)
  function formatScore(value, rounding) {
    const n = parseFloat(value);
    if (isNaN(n)) return value;
    if (rounding === 'whole') return String(Math.round(n));
    if (rounding === 'half')  return (Math.round(n * 2) / 2).toFixed(1);
    return n.toFixed(1); // 'none' — default 1 decimal place
  }

  /* ── Export to global ─────────────────────────────────────── */
  window.SA = {
    GRADES, GRADE_MIDPOINTS, GRADE_TIERS, TIER_LABELS, TIER_BADGE_COLOURS,
    GRADE_THRESHOLDS, DEFAULT_LATE_PENALTIES, DEFAULT_GRADE_FEEDBACK,
    uid, scoreToGrade, scoreToGradeFromScale, formatDate, newConfig,
    loadAllConfigs, saveAllConfigs, saveConfig, deleteConfig, loadConfig,
    getActiveId, setActiveId, loadActiveConfig,
    computeScores, generateFeedbackText, formatScore,
    buildAIGarnishPrompt, buildAIAssistPrompt, assembleFinalFeedback, scrubPII,
    loadSnippets, logAssistantRun, clearAssistantLog,
    // Deprecated aliases
    logAIGarnish, clearAIGarnishLog,
    // Cohort API
    getCohort, initCohort, saveCohort, addToCohort,
    removeFromCohort, clearCohort, cohortAgeDays, studentMatchKey
  };

  /* ── Analytics ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href*="ko-fi.com/smann"]').forEach(el => {
      el.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'kofi_click', {
            event_category: 'engagement',
            event_label: 'footer_support_button',
            transport_type: 'beacon'
          });
        }
      });
    });
  });
})();
