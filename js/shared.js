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
      gradeScale:     null,   // null = use NZ default; array = custom scale from builder Step 2
      criteria: [
        {
          id: uid(), name: '', weight: 100,
          rubric: { excellent: '', proficient: '', developing: '', unsatisfactory: '' }
        }
      ],
      gradeFeedback:      JSON.parse(JSON.stringify(DEFAULT_GRADE_FEEDBACK)),
      latePenalties:      JSON.parse(JSON.stringify(DEFAULT_LATE_PENALTIES)),
      enableLatePenalties: true
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

      const override   = (sg.override !== undefined && sg.override !== null && sg.override !== '')
                           ? parseFloat(sg.override) : null;
      const finalScore = override !== null ? override : midpoint;
      const weightedScore = finalScore * criterion.weight / 100;

      const tier       = useCustomScale
        ? (scaleTiers[sg.grade] || 'developing')
        : (GRADE_TIERS[sg.grade] || 'developing');

      const descriptor = criterion.rubric[tier] || '';

      weightedTotal += weightedScore;
      rows.push({ criterion, grade: sg.grade, midpoint, override, finalScore, weightedScore, tier, descriptor });
    }

    const lp = (config.enableLatePenalties && latePenaltyIndex != null)
                 ? config.latePenalties[latePenaltyIndex]
                 : config.latePenalties[0];

    const isFail         = lp && lp.fail;
    const deduction      = lp ? lp.deduction : 0;
    const penalisedScore = isFail ? 0 : Math.max(0, weightedTotal - deduction);

    // Use custom scale thresholds for grade suggestion if available
    const suggestedGrade = isFail ? (useCustomScale ? config.gradeScale[config.gradeScale.length - 1].grade : 'D')
      : useCustomScale
        ? scoreToGradeFromScale(penalisedScore, config.gradeScale)
        : scoreToGrade(penalisedScore);

    return { rows, weightedTotal, deduction, isFail, penalisedScore, suggestedGrade, latePenalty: lp };
  }

  function generateFeedbackText(config, scoreResult) {
    const { rows, weightedTotal, penalisedScore, suggestedGrade, latePenalty, deduction, isFail } = scoreResult;

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
      const ws = row.weightedScore.toFixed(1);
      parts.push(`${row.criterion.name} – ${ws} / ${row.criterion.weight}`);
      if (row.descriptor) parts.push(row.descriptor);
      parts.push('');
    }

    parts.push(`TOTAL SCORE: ${weightedTotal.toFixed(1)} / 100`);

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
        parts.push(`FINAL SCORE (after late penalty): ${penalisedScore.toFixed(1)} / 100`);
      }
    }

    return parts.join('\n');
  }

  /* ── Export to global ─────────────────────────────────────── */
  window.SA = {
    GRADES, GRADE_MIDPOINTS, GRADE_TIERS, TIER_LABELS, TIER_BADGE_COLOURS,
    GRADE_THRESHOLDS, DEFAULT_LATE_PENALTIES, DEFAULT_GRADE_FEEDBACK,
    uid, scoreToGrade, scoreToGradeFromScale, formatDate, newConfig,
    loadAllConfigs, saveAllConfigs, saveConfig, deleteConfig, loadConfig,
    getActiveId, setActiveId, loadActiveConfig,
    computeScores, generateFeedbackText
  };
})();
