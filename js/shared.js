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

  // Tier severity order (highest → lowest). Used everywhere to render tiers consistently.
  const TIER_ORDER = ['excellent', 'proficient', 'developing', 'satisfactory', 'unsatisfactory'];

  const TIER_LABELS = {
    excellent:      'Excellent (A+ / A / A-)',
    proficient:     'Proficient (B+ / B / B-)',
    developing:     'Developing (C+ / C / C-)',
    satisfactory:   'Satisfactory',
    unsatisfactory: 'Unsatisfactory (D)'
  };

  // Short default labels (no band suffix) — used as placeholders for the
  // builder's tier-label customiser, and as a fallback when stripping the
  // suffix from a TIER_LABELS entry isn't possible.
  const TIER_LABELS_SHORT = {
    excellent:      'Excellent',
    proficient:     'Proficient',
    developing:     'Developing',
    satisfactory:   'Satisfactory',
    unsatisfactory: 'Unsatisfactory'
  };

  // Returns the display label for a tier key, honouring config.tierLabels
  // when present. opts.withRange = true appends the grade range in parens
  // (e.g. "Very Good (A+ / A / A-)"). Falls back gracefully if config or
  // tierLabels is missing.
  function getTierLabel(config, tierKey, opts) {
    opts = opts || {};
    const custom = config && config.tierLabels && config.tierLabels[tierKey];
    const base   = (custom && String(custom).trim()) || TIER_LABELS_SHORT[tierKey] || tierKey;
    if (!opts.withRange) return base;
    // Build range string from config.gradeScale or default mapping.
    let range = '';
    if (Array.isArray(config && config.gradeScale)) {
      const grades = config.gradeScale.filter(g => g.tier === tierKey).map(g => g.grade).filter(Boolean);
      if (grades.length) range = ' (' + grades.join(' / ') + ')';
    } else {
      const dflt = TIER_LABELS[tierKey] || '';
      const m = dflt.match(/\(([^)]+)\)/);
      if (m) range = ' (' + m[1] + ')';
    }
    return base + range;
  }

  const TIER_BADGE_COLOURS = {
    excellent:      '#d1fae5',   // green-100
    proficient:     '#dbeafe',   // blue-100
    developing:     '#fef9c3',   // yellow-100
    satisfactory:   '#ffedd5',   // orange-100
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
      intro: "This is genuinely outstanding work. Your submission shows exceptional analytical thinking, sophisticated command of the relevant frameworks, and the kind of polished, professional presentation that sets the benchmark for this assessment. The originality and rigour you have brought to every section are remarkable.",
      outro: "This is the standard to aspire to. Your work is exemplary in depth, structure, and communication. The next step is to test this thinking against external audiences (industry, publication, conference) where your analysis will hold its own."
    },
    {
      grade: 'A',
      intro: "This is excellent work. Your submission is well-structured, analytically strong, and demonstrates a confident grasp of the frameworks and their application. The depth and clarity of your work reflect a high level of engagement with the material.",
      outro: "Overall, this is an excellent submission: well-structured, well-argued, and well-written. The gap between this and an A+ is narrow and lies in originality and the precision of your evidence. You are clearly operating at a high standard."
    },
    {
      grade: 'A-',
      intro: "This is a very strong piece of work. Your submission shows clear analytical ability and a good command of the relevant frameworks. There are areas of genuine excellence here, though the work does not yet reach the consistency or depth of the higher A bands.",
      outro: "The gap to the top band is narrow and specific. Focus on the criterion-level feedback above to sharpen your sharpest sections and lift the weaker ones to match. Top-tier work is well within your reach."
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
      outro: "There are real footholds in your work to build from. Two priorities: revisit the rubric descriptors at the proficient tier to see what the next step looks like, and re-engage with the course materials for the criteria flagged above. Booking a follow-up to discuss this would be worthwhile."
    },
    {
      grade: 'C',
      intro: "Thank you for your submission. Your work shows a basic understanding of the key concepts and the effort you have put in is visible. There are foundations here to build on, but the analysis is not yet consistent enough across criteria to move into the proficient range.",
      outro: "Use this feedback as a roadmap. The single highest-leverage step is to re-read the rubric descriptors for each criterion and identify the one specific gap between your work and the proficient tier. Office hours are a good place to talk through that diagnosis."
    },
    {
      grade: 'C-',
      intro: "Thank you for your submission. Your work touches on several required areas but lacks the depth and consistency needed to demonstrate a secure grasp of the key concepts. Read the criterion feedback below carefully; it identifies specific, addressable gaps rather than general weakness.",
      outro: "Please do not be discouraged. The improvement path here is concrete: pick the two criteria with the lowest scores, re-read their rubric descriptors, and rebuild those sections using the actions above. Office hours and academic support services exist for exactly this stage and will accelerate your progress."
    },
    {
      grade: 'D',
      intro: "Thank you for submitting your work. The submission does not yet meet the expected standard for this assessment, and the criterion feedback below sets out the gaps clearly. This is an important moment to engage with that feedback closely rather than move on.",
      outro: "The most useful next steps are practical: re-read the assessment brief and rubric alongside this feedback, book a meeting at office hours to discuss the gaps, and engage the academic support team early. Improvement from this point is achievable, but it requires deliberate, supported effort starting now."
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

  // Return the band minimum (lower threshold) for a grade letter, for either
  // a custom gradeScale or the default NZ thresholds.
  function bandMinimumForGrade(grade, gradeScale) {
    if (Array.isArray(gradeScale) && gradeScale.length) {
      const entry = gradeScale.find(g => g.grade === grade);
      return entry ? entry.bandLow : null;
    }
    const entry = GRADE_THRESHOLDS.find(([_, g]) => g === grade);
    return entry ? entry[0] : null;
  }

  // Apply a marker-chosen grade override to an existing scoreResult.
  // - Snaps weightedTotal + penalisedScore UP to the band minimum of the new grade
  //   (use case: bump a student at the top of one band into the next).
  // - Leaves per-criterion rows untouched (audit trail preserved).
  // - Attaches an `override` metadata object for downstream display/export.
  // Returns a new object; does not mutate input. If overrideGrade is empty or
  // not in the active scale, returns the original scoreResult unchanged.
  function applyGradeOverride(config, scoreResult, overrideGrade) {
    if (!scoreResult || !overrideGrade) return scoreResult;
    const scale = Array.isArray(config && config.gradeScale) && config.gradeScale.length
      ? config.gradeScale
      : null;
    const validGrades = scale ? scale.map(g => g.grade) : GRADES;
    if (!validGrades.includes(overrideGrade)) return scoreResult;

    const originalGrade = scoreResult.suggestedGrade;
    const originalTotal = scoreResult.weightedTotal;
    const originalPenalised = scoreResult.penalisedScore;
    const bandMin = bandMinimumForGrade(overrideGrade, scale);
    if (bandMin === null) {
      // Fallback: letter-only change if we can't resolve a band minimum.
      return Object.assign({}, scoreResult, {
        suggestedGrade: overrideGrade,
        override: { originalGrade, originalTotal, originalPenalised, newGrade: overrideGrade, newTotal: originalTotal, snapped: false }
      });
    }

    // Snap up only — never reduce a student's mark via override.
    const newTotal = Math.max(originalTotal, bandMin);
    // Preserve any late-penalty deduction that was applied to the original total.
    const deductionPoints = (typeof originalPenalised === 'number' && typeof originalTotal === 'number')
      ? (originalTotal - originalPenalised)
      : 0;
    const newPenalised = Math.max(0, newTotal - Math.max(0, deductionPoints));

    return Object.assign({}, scoreResult, {
      suggestedGrade: overrideGrade,
      weightedTotal:  newTotal,
      penalisedScore: newPenalised,
      override: {
        originalGrade, originalTotal, originalPenalised,
        newGrade: overrideGrade, newTotal, newPenalised,
        bandMin, snapped: newTotal !== originalTotal
      }
    });
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
      tierLabels:     null,   // null = use defaults; object {excellent, proficient, developing, unsatisfactory} = custom labels
      criteria: [
        {
          id: uid(), name: '', weight: 100,
          rubric: { excellent: '', proficient: '', developing: '', satisfactory: '', unsatisfactory: '' }
        }
      ],
      gradeFeedback:      JSON.parse(JSON.stringify(DEFAULT_GRADE_FEEDBACK)),
      latePenalties:      JSON.parse(JSON.stringify(DEFAULT_LATE_PENALTIES)),
      enableLatePenalties: true,
      scoreRounding:      'none',  // 'none' | 'half' | 'whole'
      spellingLocale:     'auto'   // 'auto' | 'au-nz' | 'us' — controls AU/NZ post-processor
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

  // Lazy upgrade for configs created before the 5th tier ('satisfactory') existed.
  // Adds missing rubric keys per criterion. Non-destructive — does not touch
  // existing values, gradeScale, or tierLabels. Returns the same config object.
  function migrateConfig(config) {
    if (!config) return config;
    if (Array.isArray(config.criteria)) {
      config.criteria.forEach(c => {
        if (c && c.rubric) {
          TIER_ORDER.forEach(tier => {
            if (!(tier in c.rubric)) c.rubric[tier] = '';
          });
        }
      });
    }
    return config;
  }

  function loadConfig(id) {
    const c = loadAllConfigs().find(c => c.id === id) || null;
    return migrateConfig(c);
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

  function generateFeedbackText(config, scoreResult, opts) {
    opts = opts || {};
    const { rows, weightedTotal, penalisedScore, suggestedGrade, latePenalty, deduction, isFail } = scoreResult;
    const rounding = config.scoreRounding || 'none';

    // Intro/outro always reflects the quality of the actual work (pre-penalty grade),
    // so a late deduction doesn't unfairly colour the academic feedback tone.
    const useCustomScale   = Array.isArray(config.gradeScale) && config.gradeScale.length > 0;
    const prepenaltyGrade  = useCustomScale
      ? scoreToGradeFromScale(weightedTotal, config.gradeScale)
      : scoreToGrade(weightedTotal);
    const entry = config.gradeFeedback.find(gf => gf.grade === prepenaltyGrade);

    // Phase 4: per-scorer intro/outro overrides with {name}/{group}/{grade}/{course} substitution.
    const audienceMode = (opts.audienceMode === 'group' || opts.audienceMode === 'group-named') ? 'group' : 'individual';
    const subs = {
      name:   (opts.studentName || '').trim(),
      group:  (opts.groupName || '').trim() || (audienceMode === 'group' ? 'your group' : ''),
      grade:  prepenaltyGrade,
      course: config.courseName || ''
    };
    const introText = (typeof opts.introOverride === 'string' && opts.introOverride.trim())
      ? substituteFeedbackVars(opts.introOverride, subs)
      : (entry && entry.intro);
    const outroText = (typeof opts.outroOverride === 'string' && opts.outroOverride.trim())
      ? substituteFeedbackVars(opts.outroOverride, subs)
      : (entry && entry.outro);

    const parts = [];

    if (introText) { parts.push(introText); parts.push(''); }

    for (const row of rows) {
      if (!row.grade) continue;
      const ws = formatScore(row.weightedScore, rounding);
      parts.push(`${row.criterion.name} – ${ws} / ${row.criterion.weight}`);
      if (row.descriptor) parts.push(row.descriptor);
      parts.push('');
    }

    parts.push(`TOTAL SCORE: ${formatScore(weightedTotal, rounding)} / 100`);

    // Marker-override disclosure (shown to student when total was bumped to next band).
    if (scoreResult.override && scoreResult.override.snapped) {
      const o = scoreResult.override;
      parts.push('');
      parts.push(
        `Note: Your weighted criterion scores total ${formatScore(o.originalTotal, rounding)}/100. ` +
        `I have rounded this up to ${formatScore(o.newTotal, rounding)}/100 (${o.newGrade}) ` +
        `in recognition of your overall performance.`
      );
    }

    // Outro sits here — after the score summary, before any late penalty notice
    if (outroText) { parts.push(''); parts.push(outroText); }

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
      '  7. Stay under ' + wordCap + ' words for the whole body. PREFER BREVITY — students skim, so cut filler before adding qualifiers. Less is usually better.',
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

    // Length mode — Brief enforces hard cap; Standard allows two sentences.
    const lengthMode = (opts.lengthMode === 'standard') ? 'standard' : 'brief';
    const lengthRule = (lengthMode === 'brief')
      ? '\n\nLENGTH RULE (CRITICAL): Brief mode. Each criterion MUST be exactly 2 sentences and 30 words or fewer combined. After drafting each criterion, count the words. If a criterion exceeds 30 words, REWRITE it more tersely before moving on. Do not output a criterion that exceeds the cap.'
      : '\n\nLENGTH RULE (CRITICAL): Standard mode. Each criterion MUST be exactly 2 sentences and 50 words or fewer combined. After drafting each criterion, count the words. If a criterion exceeds 50 words, REWRITE it more tersely before moving on.';

    // Audience mode — singular, generic group, or named group.
    // 'group-named' = first reference uses the typed group name once (in the
    // first criterion's first sentence if natural), every reference after
    // reverts to "your group" to avoid repetition.
    const groupName = (opts.groupName || '').trim();
    const audienceMode = (opts.audienceMode === 'group' || opts.audienceMode === 'group-named')
      ? opts.audienceMode
      : 'individual';

    let audienceRule;
    if (audienceMode === 'group-named' && groupName) {
      audienceRule = '\n\nAUDIENCE RULE: Group submission with named group "' + groupName + '". Use "' + groupName + '" exactly ONCE in the first criterion (where natural), then use "your group" / "your group has" for every subsequent reference. Do NOT use "you" or "your response". Do NOT repeat the group name across multiple criteria.';
    } else if (audienceMode === 'group' || audienceMode === 'group-named') {
      audienceRule = '\n\nAUDIENCE RULE: Group submission. Use "your group" / "your group has". Do NOT use "you" or "your response".';
    } else {
      audienceRule = '\n\nAUDIENCE RULE: Individual submission. Address the student as "you" / "your".';
    }

    const extras = {
      // Single unified mode. Old "draft" / "improve" / "shorten" all route here.
      improve_criterion_body:
        '\n\nMODE: IMPROVE_CRITERION_BODY — produce a fresh criterion-by-criterion body using the strict 2-sentence pattern below. If an EXISTING BODY is supplied, treat it as additional marker insight; preserve any substantive claim it contains, but rewrite cleanly to the pattern. Do NOT carry across phrasing, padding, or hedges from the existing body.' +

        '\n\nFOR EACH CRITERION, OUTPUT EXACTLY 2 SENTENCES:' +
        '\n  Sentence 1 (Evaluation): Rubric-grounded comment naming 1–2 specific strengths and/or weaknesses you observed in the work. Reference what the student/group actually did, not generic categories.' +
        '\n  Sentence 2 (Action): Action only — never a second evaluative comment. MUST begin with one of these exact verbs and MUST follow the matching pattern:' +
        '\n    • "Add [specific element] to [specific section/argument]."' +
        '\n    • "Clarify [specific concept/claim] by [specific method]."' +
        '\n    • "Compare [X] to [Y] using [evidence type]."' +
        '\n    • "Link [concept] to [course framework/example]."' +
        '\n    • "Proofread [section] for [specific issue]."' +
        '\n    • "Replace [vague element] with [specific element]."' +
        '\n    • "Restructure [section] so that [specific outcome]."' +
        '\n    • "Support [claim] with [specific evidence type]."' +
        '\n  Sentence 2 MUST start with: Add, Clarify, Compare, Link, Proofread, Replace, Restructure, or Support. No other openings are allowed. Words like "Focus", "Strengthen", "Deepen", "Improve", "Work on", "Greater", "Please" are NOT allowed.' +
        '\n  Even for high-scoring criteria (e.g. 10/10), give one forward-looking action from the list above (e.g. "Add one sentence that..." or "Compare this to...").' +
        '\n  State the action only. Do NOT explain why it matters.' +

        '\n\nBANNED PHRASES (do not use unless immediately followed by a specific named change):' +
        '\n  "could be improved", "would benefit from", "more rigour", "deeper analysis",' +
        '\n  "stronger argument", "clearer structure", "better evidence", "more detail",' +
        '\n  "needs work", "lacks depth".' +

        '\n\nADDITIONAL RULES:' +
        '\n  • Do NOT reuse the same imperative verb across more than two criteria.' +
        '\n  • Do NOT invent claims unsupported by the rubric descriptor or marker notes.' +
        '\n  • Do NOT use em dashes, en dashes, ellipses, or exclamation marks.' +
        '\n  • Use spelling consistent with the user locale (post-processor will normalise).' +

        '\n\nEXISTING BODY (treat as supplementary marker insight, not as text to keep):' +
        '\n' + (existingBody || '(none — generate fresh from rubric and notes)')
    };

    // Map legacy modes to the unified mode for back-compat with existing callers.
    const resolved = (mode === 'draft' || mode === 'improve' || mode === 'shorten')
      ? 'improve_criterion_body'
      : (mode || 'improve_criterion_body');

    return base + lengthRule + audienceRule + (extras[resolved] || extras.improve_criterion_body);
  }

  // Substitute {name}, {group}, {grade}, {course} placeholders in custom intro/outro templates.
  function substituteFeedbackVars(template, vars) {
    if (!template) return template;
    return String(template)
      .replace(/\{name\}/g,   vars.name   || '')
      .replace(/\{group\}/g,  vars.group  || '')
      .replace(/\{grade\}/g,  vars.grade  || '')
      .replace(/\{course\}/g, vars.course || '');
  }

  // Stitches: [student header] + intro + AI body + TOTAL SCORE + outro + late-penalty.
  // aiBody is the raw paste-back from the LLM (just the criteria rewrite).
  // opts:
  //   studentName    — student's name for greeting
  //   audienceMode   — 'individual' (default) or 'group'
  //   groupName      — optional group label, used when audienceMode === 'group'
  //   introOverride  — per-scorer custom intro template (with {name}/{group}/{grade}/{course})
  //   outroOverride  — per-scorer custom outro template (same vars)
  function assembleFinalFeedback(config, scoreResult, aiBody, opts) {
    opts = opts || {};
    const studentName = (opts.studentName || '').trim();
    const audienceMode = (opts.audienceMode === 'group' || opts.audienceMode === 'group-named') ? 'group' : 'individual';
    const groupName = (opts.groupName || '').trim();
    const useCustomScale = Array.isArray(config.gradeScale) && config.gradeScale.length > 0;
    const { weightedTotal, penalisedScore, latePenalty, deduction, isFail } = scoreResult;
    const prepenaltyGrade = useCustomScale
      ? scoreToGradeFromScale(weightedTotal, config.gradeScale)
      : scoreToGrade(weightedTotal);
    const entry = config.gradeFeedback.find(function (gf) { return gf.grade === prepenaltyGrade; });

    const subs = {
      name:   studentName,
      group:  groupName || (audienceMode === 'group' ? 'your group' : ''),
      grade:  prepenaltyGrade,
      course: config.courseName || ''
    };
    const introText = (typeof opts.introOverride === 'string' && opts.introOverride.trim())
      ? substituteFeedbackVars(opts.introOverride, subs)
      : (entry && entry.intro);
    const outroText = (typeof opts.outroOverride === 'string' && opts.outroOverride.trim())
      ? substituteFeedbackVars(opts.outroOverride, subs)
      : (entry && entry.outro);

    const parts = [];
    if (studentName) { parts.push('Hi ' + studentName + ','); parts.push(''); }
    if (introText) { parts.push(introText); parts.push(''); }

    const rounding = config.scoreRounding || 'none';

    let processedBody = postProcessAIBody(String(aiBody || '').trim(), config);
    // Validation: default ON for the unified flow. Set opts.validate === false
    // to suppress (e.g. legacy export paths that don't expect inline flags).
    if (opts.validate !== false) {
      const validation = validateAIBody(processedBody, { lengthMode: opts.lengthMode });
      processedBody = annotateAIBodyWithValidation(processedBody, validation);
    }
    parts.push(processedBody);
    parts.push('');
    parts.push('TOTAL SCORE: ' + formatScore(weightedTotal, rounding) + ' / 100');

    // Marker-override disclosure (shown to student when total was bumped to next band).
    if (scoreResult.override && scoreResult.override.snapped) {
      const o = scoreResult.override;
      parts.push('');
      const subjPossessive = (audienceMode === 'group') ? "Your group's" : 'Your';
      const yourTok = (audienceMode === 'group') ? "your group's" : 'your';
      parts.push(
        'Note: ' + subjPossessive + ' weighted criterion scores total ' + formatScore(o.originalTotal, rounding) + '/100. ' +
        'I have rounded this up to ' + formatScore(o.newTotal, rounding) + '/100 (' + o.newGrade + ') ' +
        'in recognition of ' + yourTok + ' overall performance.'
      );
    }

    if (outroText) { parts.push(''); parts.push(outroText); }

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

  /* ── Post-processor (non-LLM) ────────────────────────────────
     Mechanical cleanup applied to the AI-generated criterion
     body before it is stitched into the final feedback. Strips
     forbidden punctuation, normalises spacing and decimals,
     enforces AU/NZ spelling (locale-gated), and flags duplicated
     hedge phrases across criteria for marker review.
  ─────────────────────────────────────────────────────────────── */

  // Banned hedge phrases that should never appear unless followed by
  // a concrete fix. Duplicates across criteria are flagged, not removed.
  const POSTPROC_FLAG_PHRASES = [
    'more rigour', 'deeper analysis', 'stronger argument',
    'clearer structure', 'better evidence', 'more detail',
    'needs work', 'lacks depth'
  ];

  // AU/NZ spelling normalisations. Conservative list, extend as needed.
  // Only applied when the user's locale is AU or NZ (or config opt-in).
  const POSTPROC_SPELLING = [
    [/\borganiz(e|ed|es|ing|ation|ational)\b/gi, 'organis$1'],
    [/\banalyz(e|ed|es|ing)\b/gi,                'analys$1'],
    [/\bbehavior(s|al|ally)?\b/gi,               'behaviour$1'],
    [/\bcolor(s|ed|ing|ful)?\b/gi,               'colour$1'],
    [/\bfavor(s|ed|ing|able|ably|ite)?\b/gi,     'favour$1'],
    [/\bcenter(s|ed|ing)?\b/gi,                  'centre$1'],
    [/\bemphasize\b/gi,   'emphasise'],
    [/\bemphasized\b/gi,  'emphasised'],
    [/\bemphasizes\b/gi,  'emphasises'],
    [/\bemphasizing\b/gi, 'emphasising'],
    [/\brecognize\b/gi,   'recognise'],
    [/\brecognized\b/gi,  'recognised'],
    [/\brecognizes\b/gi,  'recognises'],
    [/\brecognizing\b/gi, 'recognising'],
    [/\bcriticize\b/gi,   'criticise'],
    [/\bcriticized\b/gi,  'criticised'],
    [/\bcriticizes\b/gi,  'criticises'],
    [/\bcriticizing\b/gi, 'criticising'],
    [/\bjudgment\b/gi,                           'judgement']
  ];

  // Locale gate. Resolution order:
  //   1. Explicit override via config.spellingLocale ('au-nz' | 'us' | 'auto')
  //   2. Resolved browser/Intl locale region (AU, NZ)
  //   3. Default: do NOT apply AU/NZ spelling
  function shouldApplyAuNzSpelling(config) {
    const override = config && config.spellingLocale;
    if (override === 'au-nz') return true;
    if (override === 'us')    return false;
    // override is 'auto', undefined, or null — fall through to detection.
    try {
      const region = (typeof Intl !== 'undefined' && Intl.DateTimeFormat)
        ? (Intl.DateTimeFormat().resolvedOptions().locale || '')
        : (typeof navigator !== 'undefined' ? (navigator.language || '') : '');
      // Match e.g. "en-NZ", "en-AU", "mi-NZ".
      return /-(NZ|AU)\b/i.test(region);
    } catch (e) {
      return false;
    }
  }

  function postProcessSingle(text, config) {
    if (!text) return text;
    let out = String(text);

    // Decimal normalisation FIRST so space-stripping rules below don't see
    // a bare ".5" as "space + punctuation".
    out = out.replace(/(^|[^\d])\.(\d)/g, '$10.$2');

    // Punctuation normalisation
    out = out
      .replace(/—/g, ', ')                              // em dash → comma
      .replace(/–/g, '-')                               // en dash → hyphen (header dash restored separately)
      .replace(/\.{3,}/g, '.')                          // ellipsis → full stop
      .replace(/!+/g, '.')                              // exclamation → full stop
      .replace(/\s{2,}/g, ' ')                          // collapse whitespace
      .replace(/\s+([,;:])|\s+\.(?!\d)/g, function (m) {// no space before , ; : or non-decimal .
        return m.replace(/\s+/, '');
      })
      .replace(/([,;:])(?=[A-Za-z])/g, '$1 ')           // single space after , ; :
      .replace(/\.(?=[A-Za-z])/g, '. ');                // single space after .

    // AU/NZ spelling — locale-gated.
    if (shouldApplyAuNzSpelling(config)) {
      POSTPROC_SPELLING.forEach(function (pair) {
        out = out.replace(pair[0], pair[1]);
      });
    }

    return out.trim();
  }

  // Restores the criterion header line's en dash separator (Name – ws / weight)
  // because postProcessSingle converts en dashes to hyphens globally.
  function restoreCriterionHeaderDash(line) {
    return line.replace(/^(.+?)\s-\s(\d[\d.]*\s\/\s\d+)\s*$/, '$1 – $2');
  }

  // Cross-criterion duplicate-phrase flagger. Returns the body unchanged
  // unless a banned hedge appears in 2+ criteria, in which case the
  // second+ occurrences are wrapped with a [REVIEW: duplicate phrase] tag
  // visible to the marker but easy to grep and remove.
  function flagDuplicateHedges(criterionBlocks) {
    const counts = {};
    POSTPROC_FLAG_PHRASES.forEach(function (p) { counts[p] = 0; });

    return criterionBlocks.map(function (block) {
      let out = block;
      POSTPROC_FLAG_PHRASES.forEach(function (p) {
        const re = new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
        const occursHere = re.test(block);
        if (occursHere) {
          if (counts[p] >= 1) {
            out = out.replace(re, '$& [REVIEW: duplicate phrase]');
          }
          counts[p] += 1;
        }
      });
      return out;
    });
  }

  // Splits AI body into per-criterion blocks (separated by blank line),
  // runs postProcessSingle on each, restores the header dash, then runs
  // cross-criterion dedupe flagging, and rejoins.
  function postProcessAIBody(aiBody, config) {
    if (!aiBody) return aiBody;
    const blocks = String(aiBody).split(/\n\s*\n/).map(function (b) { return b.trim(); }).filter(Boolean);
    const cleaned = blocks.map(function (block) {
      const lines = block.split('\n');
      const processed = lines.map(function (line, idx) {
        const cleanedLine = postProcessSingle(line, config);
        return idx === 0 ? restoreCriterionHeaderDash(cleanedLine) : cleanedLine;
      });
      return processed.join('\n');
    });
    const flagged = flagDuplicateHedges(cleaned);
    return flagged.join('\n\n');
  }

  /* ── Validator (post-processor) ──────────────────────────────
     Lightweight conformance check on the AI body AFTER post-
     processing. Per criterion, verifies:
       • exactly 2 sentences
       • sentence 2 starts with an allowed action verb
       • word count within the active length cap
     Returns an array of issues (one row per criterion that has
     any). Non-blocking — markers see a [VALIDATION] flag inline
     and a summary the UI can display. Also returns metadata for
     telemetry / future analysis.
  ─────────────────────────────────────────────────────────────── */
  const VALID_ACTION_VERBS = ['Add', 'Clarify', 'Compare', 'Link', 'Proofread', 'Replace', 'Restructure', 'Support'];

  function _splitSentences(text) {
    if (!text) return [];
    // Split on . ? ! followed by space/end. Crude but workable.
    return String(text)
      .split(/(?<=[.?!])\s+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function _wordCount(text) {
    return (String(text || '').match(/\S+/g) || []).length;
  }

  // Splits a criterion block into { header, body } where header is the
  // first line (Name – ws / weight) and body is the rest.
  function _splitCriterionBlock(block) {
    const lines = String(block).split('\n');
    return {
      header: lines[0] || '',
      body:   lines.slice(1).join(' ').trim()
    };
  }

  function validateAIBody(aiBody, opts) {
    opts = opts || {};
    const lengthMode = (opts.lengthMode === 'standard') ? 'standard' : 'brief';
    const wordCap    = (lengthMode === 'brief') ? 30 : 50;
    const blocks     = String(aiBody || '').split(/\n\s*\n/).map(function (b) { return b.trim(); }).filter(Boolean);

    const issues = [];
    const verbCounts = {};
    VALID_ACTION_VERBS.forEach(function (v) { verbCounts[v] = 0; });

    blocks.forEach(function (block, idx) {
      const parts = _splitCriterionBlock(block);
      const headerName = parts.header.replace(/\s[–-]\s.*$/, '').trim();
      const body  = parts.body;
      const sentences = _splitSentences(body);
      const words = _wordCount(body);
      const blockIssues = [];

      // 1. Sentence count
      if (sentences.length !== 2) {
        blockIssues.push('expected 2 sentences, got ' + sentences.length);
      }

      // 2. Action verb on sentence 2
      const s2 = sentences[1] || '';
      const firstWord = (s2.match(/^[A-Z][a-z]+/) || [''])[0];
      const verbOk = VALID_ACTION_VERBS.indexOf(firstWord) !== -1;
      if (!verbOk) {
        blockIssues.push('sentence 2 should start with one of ' + VALID_ACTION_VERBS.join('/') + ' (got "' + (firstWord || '?') + '")');
      } else {
        verbCounts[firstWord] = (verbCounts[firstWord] || 0) + 1;
      }

      // 3. Word cap
      if (words > wordCap) {
        blockIssues.push('exceeds ' + lengthMode + ' word cap (' + words + ' > ' + wordCap + ')');
      }

      if (blockIssues.length) {
        issues.push({
          index: idx,
          criterion: headerName || ('block ' + (idx + 1)),
          sentences: sentences.length,
          words: words,
          firstActionWord: firstWord,
          messages: blockIssues
        });
      }
    });

    // 4. Verb overuse — same verb on >2 criteria
    const overused = Object.keys(verbCounts).filter(function (v) { return verbCounts[v] > 2; });

    return {
      ok: issues.length === 0 && overused.length === 0,
      issues: issues,
      verbCounts: verbCounts,
      overusedVerbs: overused,
      lengthMode: lengthMode,
      wordCap: wordCap,
      blockCount: blocks.length
    };
  }

  // Inline flag injector — wraps each flagged criterion's body with a
  // [VALIDATION: ...] tag so markers see it without breaking flow.
  // Returns the modified body.
  function annotateAIBodyWithValidation(aiBody, validationResult) {
    if (!aiBody || !validationResult || validationResult.ok) return aiBody;
    const blocks = String(aiBody).split(/\n\s*\n/);
    const issuesByIndex = {};
    validationResult.issues.forEach(function (i) { issuesByIndex[i.index] = i; });

    return blocks.map(function (block, idx) {
      const issue = issuesByIndex[idx];
      if (!issue) return block;
      return block + '\n[VALIDATION: ' + issue.messages.join('; ') + ']';
    }).join('\n\n');
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
    GRADES, GRADE_MIDPOINTS, GRADE_TIERS, TIER_LABELS, TIER_LABELS_SHORT, TIER_BADGE_COLOURS, TIER_ORDER,
    getTierLabel, migrateConfig,
    GRADE_THRESHOLDS, DEFAULT_LATE_PENALTIES, DEFAULT_GRADE_FEEDBACK,
    uid, scoreToGrade, scoreToGradeFromScale, bandMinimumForGrade, applyGradeOverride, formatDate, newConfig,
    loadAllConfigs, saveAllConfigs, saveConfig, deleteConfig, loadConfig,
    getActiveId, setActiveId, loadActiveConfig,
    computeScores, generateFeedbackText, formatScore,
    buildAIGarnishPrompt, buildAIAssistPrompt, assembleFinalFeedback, substituteFeedbackVars, scrubPII,
    postProcessAIBody, postProcessSingle, shouldApplyAuNzSpelling,
    validateAIBody, annotateAIBodyWithValidation, VALID_ACTION_VERBS,
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
