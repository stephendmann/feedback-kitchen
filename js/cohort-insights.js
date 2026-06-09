/* ============================================================
   Cohort Insights — FK Phase 1
   Metrics engine + renderer for the in-app Cohort Insights panel.

   Reads from the existing cohort localStorage object produced by
   shared.js / excel.js — no new schema fields, no server required.

   Exposes: window.CohortInsights = { cohortMetrics, detectState, renderInsights }

   Thresholds match fk_metrics.py TH exactly. Mixed-marker States
   A / B / C match the canonical spec in inside_fk_vs_outside_fk.md,
   fk_native_implementation_plan.md, fk_navigation_note.md, and
   mixed_marker_design_note.md.
   ============================================================ */

(function () {
  'use strict';

  /* ── Thresholds — match fk_metrics.py TH verbatim ─────────── */
  var TH = {
    scale_compressed:     0.60,
    scale_wide:           0.95,
    within_sd_flat_pct:   3.0,
    override_soft_flag:   0.15,
    fail_rate_soft_flag:  0.20,
    alpha_minimum_n:      8,
    bimodality_gap_multiplier: 1.5,
    bimodality_min_gap:   8.0,
    notes_min_chars:      5,
    SMALL_N:              20,
    VERY_SMALL_N:         12
  };

  /* ── Math helpers — mirror fk_metrics.py formulas exactly ──── */

  function avg(arr) {
    if (!arr.length) return 0;
    return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  }

  function safeStdev(arr) {
    if (arr.length < 2) return 0;
    var m = avg(arr);
    var variance = arr.reduce(function (s, x) { return s + Math.pow(x - m, 2); }, 0) / (arr.length - 1);
    return Math.sqrt(variance);
  }

  /* Adjusted Fisher-Pearson standardised moment — matches Python skew() */
  function skewStat(xs) {
    var n = xs.length;
    if (n < 3) return null;
    var m = avg(xs);
    var s = safeStdev(xs);
    if (s === 0) return 0;
    var sum3 = xs.reduce(function (acc, x) { return acc + Math.pow((x - m) / s, 3); }, 0);
    return (n / ((n - 1) * (n - 2))) * sum3;
  }

  /* Excess kurtosis, bias-corrected — matches Python kurtosis() */
  function kurtosisStat(xs) {
    var n = xs.length;
    if (n < 4) return null;
    var m = avg(xs);
    var s = safeStdev(xs);
    if (s === 0) return 0;
    var sum4 = xs.reduce(function (acc, x) { return acc + Math.pow((x - m) / s, 4); }, 0);
    var k4 = (n * (n + 1) / ((n - 1) * (n - 2) * (n - 3))) * sum4;
    return k4 - 3 * Math.pow(n - 1, 2) / ((n - 2) * (n - 3));
  }

  /* Bimodality gap heuristic — matches fk_metrics.py bimodality() */
  function bimodalityGap(xs) {
    var sorted = xs.slice().sort(function (a, b) { return a - b; });
    var n = sorted.length;
    if (n < 6) return { flagged: false };
    var gaps = [];
    for (var i = 1; i < n; i++) {
      gaps.push({ gap: sorted[i] - sorted[i - 1], pos: [sorted[i - 1], sorted[i]] });
    }
    var gapVals = gaps.map(function (g) { return g.gap; }).slice().sort(function (a, b) { return a - b; });
    var medianGap = gapVals[Math.floor(gapVals.length / 2)];
    var maxGap = gaps.reduce(function (best, g) { return g.gap > best.gap ? g : best; }, gaps[0]);
    var threshold = Math.max(TH.bimodality_gap_multiplier * medianGap, TH.bimodality_min_gap);
    return {
      flagged: maxGap.gap > threshold,
      gap_position: maxGap.pos,
      gap_size: maxGap.gap
    };
  }

  /* Cronbach's alpha — matches fk_metrics.py cronbach_alpha() */
  function cronbachAlpha(rows) {
    var n = rows.length;
    if (!n) return null;
    var k = rows[0].length;
    if (n < TH.alpha_minimum_n || k < 2) return null;
    var itemVars = [];
    for (var i = 0; i < k; i++) {
      var col = rows.map(function (r) { return r[i]; });
      itemVars.push(Math.pow(safeStdev(col), 2));
    }
    var totals = rows.map(function (r) { return r.reduce(function (a, b) { return a + b; }, 0); });
    var totalVar = Math.pow(safeStdev(totals), 2);
    if (totalVar === 0) return null;
    return (k / (k - 1)) * (1 - itemVars.reduce(function (a, b) { return a + b; }, 0) / totalVar);
  }

  /* ── Core metrics — pure function over cohort.students[] ───── */

  function cohortMetrics(config, students) {
    if (!students || !students.length) return null;
    var criteria = (config && config.criteria) || [];
    var k = criteria.length;

    /* Pre-penalty totals (weightedTotal) and post-penalty (penalisedScore).
       Fall back gracefully when penalisedScore is absent (no late penalties). */
    var totals = students.map(function (s) {
      return (s.scoreResult && typeof s.scoreResult.weightedTotal === 'number')
        ? s.scoreResult.weightedTotal : 0;
    });
    var penalised = students.map(function (s) {
      if (s.scoreResult && typeof s.scoreResult.penalisedScore === 'number') {
        return s.scoreResult.penalisedScore;
      }
      return (s.scoreResult && typeof s.scoreResult.weightedTotal === 'number')
        ? s.scoreResult.weightedTotal : 0;
    });

    var n = students.length;
    var mean_pre_penalty = avg(totals);
    var mean_total       = avg(penalised);
    var min_total        = Math.min.apply(null, totals);
    var max_total        = Math.max.apply(null, totals);
    var total_score_sd   = safeStdev(totals);
    var total_score_range = max_total - min_total;
    var scale_use_ratio  = total_score_range / 100;

    /* Within-student SD: SD of per-criterion finalScore values for each
       student (0–100 scale), then averaged across students.
       Uses finalScore (= override if set, else midpoint). Falls back to
       midpoint when finalScore is absent (older records). */
    var withinSDs = students.map(function (s) {
      var rows = (s.scoreResult && s.scoreResult.rows) ? s.scoreResult.rows : [];
      var scores = rows.map(function (r) {
        if (typeof r.finalScore === 'number') return r.finalScore;
        if (typeof r.midpoint  === 'number') return r.midpoint;
        return 0;
      });
      return scores.length >= 2 ? safeStdev(scores) : 0;
    });
    var within_student_sd_pct = avg(withinSDs);

    /* Late penalty: any student where latePenalty.fail or latePenalty.deduction > 0 */
    var late_penalty_count = students.filter(function (s) {
      var lp = s.scoreResult && s.scoreResult.latePenalty;
      if (!lp) return false;
      if (lp.fail) return true;
      if (typeof lp.deduction === 'number' && lp.deduction > 0) return true;
      return false;
    }).length;

    /* Override: students where scoreResult.override is set */
    var override_count = students.filter(function (s) {
      return !!(s.scoreResult && s.scoreResult.override);
    }).length;
    var override_rate = n ? override_count / n : 0;

    /* Notes completion: trimmed length > notes_min_chars */
    var notes_completion_rate = students.filter(function (s) {
      return s.markerNotes && s.markerNotes.trim().length > TH.notes_min_chars;
    }).length / n;

    /* Feedback word counts */
    var wordCounts = students.map(function (s) {
      var fb = (s.feedbackText || '').trim();
      return fb ? fb.split(/\s+/).length : 0;
    });
    var feedback_word_count_mean = Math.round(avg(wordCounts));
    var feedback_word_count_sd   = Math.round(safeStdev(wordCounts));

    /* Grade bands (tier counts) — uses SA helpers when available */
    var TIER_ORDER = ['excellent', 'proficient', 'developing', 'satisfactory', 'unsatisfactory'];
    var tierCounts = { excellent: 0, proficient: 0, developing: 0, satisfactory: 0, unsatisfactory: 0 };
    var useCustomScale = config && Array.isArray(config.gradeScale) && config.gradeScale.length > 0;
    var tierOf = function (grade) {
      if (useCustomScale) {
        var entry = config.gradeScale.find(function (g) { return g.grade === grade; });
        return entry ? entry.tier : 'developing';
      }
      return (typeof SA !== 'undefined' && SA.GRADE_TIERS && SA.GRADE_TIERS[grade]) || 'developing';
    };
    students.forEach(function (s) {
      var g = s.scoreResult && s.scoreResult.suggestedGrade;
      if (g && tierCounts[tierOf(g)] !== undefined) tierCounts[tierOf(g)]++;
    });

    var grade_bands = {};
    TIER_ORDER.forEach(function (tier) {
      if (tierCounts[tier] > 0) {
        var label = (typeof SA !== 'undefined') ? SA.getTierLabel(config, tier) : tier;
        grade_bands[label] = tierCounts[tier];
      }
    });

    /* Fail rate (pre-penalty) — unsatisfactory tier */
    var fail_count_pre_penalty = students.filter(function (s) {
      var g = s.scoreResult && s.scoreResult.suggestedGrade;
      return g && tierOf(g) === 'unsatisfactory';
    }).length;
    var fail_rate_pre_penalty = n ? fail_count_pre_penalty / n : 0;

    /* Distribution shape */
    var skewVal = skewStat(totals);
    var kurtVal = kurtosisStat(totals);
    var bim     = bimodalityGap(totals);

    /* Cronbach's alpha — n >= alpha_minimum_n, k >= 2 criteria */
    var alphaRows = students.map(function (s) {
      var rows = (s.scoreResult && s.scoreResult.rows) ? s.scoreResult.rows : [];
      return rows.map(function (r) {
        return typeof r.finalScore === 'number' ? r.finalScore
             : typeof r.midpoint  === 'number' ? r.midpoint : 0;
      });
    }).filter(function (r) { return r.length === k; });
    var alpha = (alphaRows.length >= TH.alpha_minimum_n && k >= 2)
      ? cronbachAlpha(alphaRows) : null;

    return {
      n: n,
      mean_pre_penalty: mean_pre_penalty,
      mean_total: mean_total,
      min_total: min_total,
      max_total: max_total,
      total_score_sd: total_score_sd,
      total_score_range: total_score_range,
      scale_use_ratio: scale_use_ratio,
      within_student_sd_pct: within_student_sd_pct,
      late_penalty_count: late_penalty_count,
      override_count: override_count,
      override_rate: override_rate,
      notes_completion_rate: notes_completion_rate,
      feedback_word_count_mean: feedback_word_count_mean,
      feedback_word_count_sd: feedback_word_count_sd,
      grade_bands: grade_bands,
      fail_count_pre_penalty: fail_count_pre_penalty,
      fail_rate_pre_penalty: fail_rate_pre_penalty,
      skew: skewVal,
      kurtosis: kurtVal,
      bimodality: bim,
      alpha: alpha
    };
  }

  /* ── Mixed-marker state detection ──────────────────────────── */

  /* State A — Single-marker cohort.   Trigger: cohort.multiMarker = false.
     State B — Mixed, reliable per-row attribution.
               Trigger: multiMarker = true AND every student has a non-blank tutor.
     State C — Mixed, unreliable attribution.
               Trigger: multiMarker = true AND any student has blank/nan tutor. */
  function detectState(cohort, currentTutor) {
    var multi = !!cohort.multiMarker;
    var total_n = cohort.students.length;

    if (!multi) {
      return { state: 'A', subset_n: null, total_n: total_n, subset_students: null };
    }

    var tutorValues = cohort.students.map(function (s) { return (s.tutor || '').trim(); });
    var tutor_complete = tutorValues.every(function (t) {
      return t && t.toLowerCase() !== 'nan';
    });

    if (!tutor_complete) {
      return { state: 'C', subset_n: null, total_n: total_n, subset_students: null };
    }

    /* State B — filter subset for current logged-in tutor */
    var tutorName = (currentTutor || '').trim();
    var subset_students = tutorName
      ? cohort.students.filter(function (s) {
          return (s.tutor || '').trim().toLowerCase() === tutorName.toLowerCase();
        })
      : [];

    return {
      state: 'B',
      subset_n: subset_students.length,
      total_n: total_n,
      subset_students: subset_students
    };
  }

  /* ── Plain-English summary bullets ─────────────────────────── */

  function buildSummary(m, state) {
    var b = [];
    var s1 = 'Cohort of ' + m.n + ' scripts; mean ' + fmt(m.mean_pre_penalty, 1) + ' (pre-penalty)';
    if (m.late_penalty_count) {
      s1 += ', ' + m.late_penalty_count + ' late-penalty adjustment' + (m.late_penalty_count > 1 ? 's' : '');
    }
    b.push(s1 + '.');

    if (m.scale_use_ratio < TH.scale_compressed) {
      b.push('In this cohort, scale use sits at ' + pct(m.scale_use_ratio) + ' of the available range — anchor papers can help check whether top and bottom work is spread enough.');
    } else if (m.scale_use_ratio > TH.scale_wide) {
      b.push('In this cohort, scale use is wide (' + pct(m.scale_use_ratio) + '); worth confirming extremes are clearly evidenced in your Notes.');
    } else if (m.within_student_sd_pct < TH.within_sd_flat_pct) {
      b.push('Within-script differentiation is flat in this cohort (' + fmt(m.within_student_sd_pct, 1) + '%); worth a brief check on whether one criterion is anchoring the others.');
    } else {
      b.push('Marking spread looks balanced in this cohort — both across the scale and across criteria within each script.');
    }
    if (m.notes_completion_rate === 1) {
      b.push("Marker's Notes completed on every script — strong audit trail if any grade is queried.");
    } else if (m.notes_completion_rate === 0) {
      b.push("Marker's Notes were not used; even short notes per script make later moderation conversations easier.");
    } else {
      b.push("Marker's Notes recorded on " + pct(m.notes_completion_rate) + ' of scripts.');
    }

    var isVerySmall = m.n < 12;
    var isSmall     = m.n < 20;
    if (!isVerySmall && m.bimodality && m.bimodality.flagged) {
      var gp   = m.bimodality.gap_position;
      var hedge = isSmall ? '; small cohort, so treat as a hint' : '';
      b.push('A possible two-group pattern shows in the totals (gap ' + fmt(gp[0], 0) + '–' + fmt(gp[1], 0) + ')' + hedge + ' — worth a brief look at whether two distinct student groups are present. Describes the cohort, not your marking.');
    } else if (!isVerySmall && typeof m.skew === 'number' && Math.abs(m.skew) > 1) {
      var hedge2 = isSmall ? '; small cohort, so treat as descriptive only' : '';
      b.push('The cohort distribution skews ' + (m.skew < 0 ? 'left' : 'right') + ' (' + fmt(m.skew, 2) + ')' + hedge2 + '. Describes the cohort\'s shape, not your marking.');
    }
    return b.slice(0, 5);
  }

  /* ── Formative prompts ─────────────────────────────────────── */

  /* State C: suppressed entirely.
     State B: caller passes subset metrics so prompts describe the individual.
     State A / B-subset: same rule set. */
  function buildFormativePrompts(m) {
    var p = [];
    var isVerySmall = m.n < 12;
    var isSmall     = m.n < 20;

    if (m.scale_use_ratio < TH.scale_compressed) {
      p.push('Scale use is compressed (' + pct(m.scale_use_ratio) + ') — anchor papers with clearly evidenced top and bottom scores can help check whether the spread is appropriate for this cohort.');
    } else if (m.scale_use_ratio > TH.scale_wide) {
      p.push('Scale use is wide (' + pct(m.scale_use_ratio) + ') — confirming that the extreme scripts are well-evidenced in your Marker\'s Notes will make any later moderation conversation straightforward.');
    }

    if (m.within_student_sd_pct < TH.within_sd_flat_pct) {
      p.push('Within-script criterion differentiation is flat (' + fmt(m.within_student_sd_pct, 1) + '%) — worth checking whether the rubric criteria are functioning independently or whether one criterion is anchoring the others.');
    }

    if (m.override_rate > TH.override_soft_flag) {
      p.push(pct(m.override_rate) + ' of scripts had a suggested-band override — worth a look at the criterion descriptions near the grade boundaries to see if they could be clearer.');
    }

    if (m.notes_completion_rate === 0) {
      p.push("Marker's Notes weren't used on any script — even a brief note per student makes later moderation conversations easier and provides an audit trail if any grade is queried.");
    } else if (m.notes_completion_rate < 0.5) {
      p.push("Marker's Notes were recorded on " + pct(m.notes_completion_rate) + ' of scripts — aiming for notes on every script gives you a stronger audit trail.');
    }

    if (m.fail_rate_pre_penalty > TH.fail_rate_soft_flag) {
      p.push(pct(m.fail_rate_pre_penalty) + ' of scripts were in the fail band before late penalties — worth reviewing whether the rubric descriptors at the lower end reflect the assessment intent clearly.');
    }

    if (!isVerySmall && m.bimodality && m.bimodality.flagged) {
      var gp   = m.bimodality.gap_position;
      var hedge = isSmall ? '; small cohort, so treat as a hint' : '';
      p.push('A possible two-group pattern shows in the totals (gap around ' + fmt(gp[0], 0) + '–' + fmt(gp[1], 0) + ')' + hedge + ' — worth considering whether two distinct student groups are present and whether the assessment is pitched well for both.');
    }

    return p.slice(0, 5);
  }

  /* ── Rendering helpers ─────────────────────────────────────── */

  function fmt(x, d) {
    d = (d === undefined) ? 2 : d;
    return typeof x === 'number' ? x.toFixed(d) : '—';
  }
  function pct(x) { return (x * 100).toFixed(0) + '%'; }

  function escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pbadge(cls, text) {
    return '<span class="ci-pbadge ci-' + cls + '">' + escHtml(text) + '</span>';
  }

  /* ── Main render function ───────────────────────────────────── */

  function renderInsights(panel, config, cohort, currentTutor) {
    if (!panel) return;

    var ctx = detectState(cohort, currentTutor);
    var m   = cohortMetrics(config, cohort.students);
    if (!m) {
      panel.innerHTML = '<p class="ci-note">No data yet — add students to the cohort first.</p>';
      return;
    }

    var isSmall     = m.n < TH.SMALL_N;
    var isVerySmall = m.n < TH.VERY_SMALL_N;

    /* α label and qualifier change in mixed-marker states */
    var ALPHA_LABEL = ctx.state === 'A'
      ? 'Cohort consistency (α)'
      : 'Cohort consistency (α) — mixed-marker cohort';
    var QUALIFIER = '<span class="ci-qualifier">this cohort only</span>';
    var ALPHA_QUALIFIER = ctx.state === 'A' ? QUALIFIER
      : '<span class="ci-qualifier">this cohort only · multiple markers · not a tutor metric</span>';

    /* α tooltip — prepend mixed-marker note in States B and C */
    var alphaTipBase = "Cronbach's α for this cohort only — a description of how the criterion marks moved together across these scripts. It is not a tutor performance metric. Some coupling is expected when criteria build on each other. FK is fully human-marked. A pooled, cross-cohort version sits in the Coordinator Dashboard, where pooling makes the interpretation reliable.";
    var alphaTip = (ctx.state === 'B' || ctx.state === 'C')
      ? 'This cohort was marked by more than one person, so this α describes how the criteria moved together across all scripts collectively — not how any single marker behaved. ' + alphaTipBase
      : alphaTipBase;

    /* ── Section: skew ── */
    var skewHtml;
    if (isVerySmall) {
      skewHtml = fmt(m.skew) + ' <span class="ci-small-n">— too few scripts to interpret reliably</span>';
    } else {
      var skewStrong = typeof m.skew === 'number' && Math.abs(m.skew) > 1;
      var skewBadge  = skewStrong
        ? pbadge('amber', (isSmall ? 'Possibly skewed ' : 'Skewed ') + (m.skew < 0 ? 'left' : 'right'))
        : '';
      skewHtml = fmt(m.skew) + ' ' + skewBadge + ' ' + QUALIFIER;
    }

    /* ── Section: kurtosis ── */
    var kurtHtml = isVerySmall
      ? fmt(m.kurtosis) + ' <span class="ci-small-n">— too few scripts to interpret reliably</span>'
      : fmt(m.kurtosis) + ' ' + QUALIFIER;

    /* ── Section: bimodality ── */
    var bimHtml;
    if (isVerySmall) {
      bimHtml = '<span class="ci-dist-icon">•</span> <span class="ci-small-n">Distribution shape needs more scripts to read reliably</span>';
    } else if (m.bimodality && m.bimodality.flagged) {
      var gp   = m.bimodality.gap_position;
      var note = isSmall ? '<span class="ci-small-n"> — small cohort, treat as a hint only</span>' : '';
      bimHtml = '<span class="ci-dist-icon">⋈</span> Possible two-group pattern ' +
                pbadge('amber', 'gap ' + fmt(gp[0], 0) + '–' + fmt(gp[1], 0)) + note;
    } else {
      bimHtml = '<span class="ci-dist-icon">•</span> Approximately unimodal';
    }

    /* ── Section: alpha ── */
    var alphaHtml;
    if (typeof m.alpha === 'number') {
      var alphaNote = isSmall ? ' <span class="ci-small-n">— small sample; interpret loosely</span>' : '';
      alphaHtml = fmt(m.alpha, 3) + ' ' + ALPHA_QUALIFIER + alphaNote;
    } else {
      alphaHtml = 'Not computed <span class="ci-small-n">(n &lt; 8 — too few scripts for a reliable α)</span>';
    }

    /* ── Section: pre/post penalty ── */
    var prepostHtml = m.late_penalty_count > 0
      ? '<strong>' + fmt(m.mean_pre_penalty, 2) + '</strong> pre-penalty → <strong>' + fmt(m.mean_total, 2) + '</strong> post-penalty <span style="color:#64748b;font-weight:normal">(' + m.late_penalty_count + ' late)</span>'
      : 'No penalties applied — pre- and post-penalty means are identical';

    /* ── Section: grade-bands bar chart ── */
    var bandVals = Object.values(m.grade_bands);
    var bandMax  = bandVals.length ? Math.max.apply(null, bandVals.concat([1])) : 1;
    var bandsHtml = Object.entries(m.grade_bands).map(function (kv) {
      var label = kv[0], count = kv[1];
      return '<div class="ci-bar-row">' +
        '<div class="ci-bar-label">' + escHtml(label) + '</div>' +
        '<div class="ci-bar-track"><div class="ci-bar" style="width:' + Math.round(count / bandMax * 100) + '%"></div></div>' +
        '<div class="ci-bar-count">' + count + '</div>' +
        '</div>';
    }).join('') || '<p class="ci-note">No grade data yet.</p>';

    /* ── Section: mixed-marker context strip ── */
    var mixedStripHtml = '';
    if (ctx.state === 'B') {
      mixedStripHtml = '<div class="ci-mixed-strip"><strong>Mixed-marker cohort.</strong> This assessment is configured for multiple markers. Figures below describe all scripts in this cohort.</div>';
    } else if (ctx.state === 'C') {
      mixedStripHtml = '<div class="ci-mixed-strip"><strong>Mixed-marker cohort.</strong> This assessment is configured for multiple markers. Figures below describe all scripts in your local export.</div>';
    }

    /* ── Section: marking behaviour ── */
    var behaviourHeading = 'Marking patterns in this cohort';

    var scaleBadge  = m.scale_use_ratio < TH.scale_compressed ? pbadge('amber', 'Compressed')
      : m.scale_use_ratio > TH.scale_wide                     ? pbadge('amber', 'Wide')
      :                                                          pbadge('teal',  'Balanced');
    var withinBadge = m.within_student_sd_pct < TH.within_sd_flat_pct ? pbadge('amber', 'Flat')
      :                                                                   pbadge('teal',  'Differentiated');
    var lateBadgeHtml = m.late_penalty_count > 0
      ? m.late_penalty_count + ' ' + pbadge('purple', 'administrative') : '0';
    var overBadge   = m.override_rate > TH.override_soft_flag ? ' ' + pbadge('amber', 'High override rate') : '';
    var overHtml    = m.override_count + ' (' + pct(m.override_rate) + ')' + overBadge;
    var notesBadge  = m.notes_completion_rate === 1 ? ' ' + pbadge('teal', 'Full notes')
      : m.notes_completion_rate === 0               ? ' ' + pbadge('amber', 'No notes') : '';
    var notesHtml   = pct(m.notes_completion_rate) + notesBadge;

    var scaleUseTip   = "How much of the available scoring range you used. Compressed marking (&lt;60%) can quietly squash differences between strong and average work; anchor papers help. Wide marking (&gt;95%) is fine when the extremes are well-evidenced.";
    var withinSdTip   = "How much each student's criterion marks vary from each other on average. If this is very low (&lt;3%), it can mean the rubric is functioning more like one overall judgement than independent criteria. Worth checking whether you're seeing genuine across-the-board strength/weakness or whether one criterion is anchoring the others.";

    var behaviourBodyHtml =
        '<h3 class="ci-h3">Spread across the scale</h3>' +
        '<div class="ci-grid">' +
          '<div class="ci-k">Total-score SD</div><div class="ci-v">' + fmt(m.total_score_sd, 2) + '</div>' +
          '<div class="ci-k">Range used</div><div class="ci-v">' + fmt(m.total_score_range, 1) + ' pts</div>' +
          '<div class="ci-k"><span class="ci-tip" title="' + scaleUseTip + '">Scale-use ratio</span></div>' +
          '<div class="ci-v">' + pct(m.scale_use_ratio) + ' ' + scaleBadge + '</div>' +
        '</div>' +
        '<h3 class="ci-h3">Within-script differentiation</h3>' +
        '<div class="ci-grid">' +
          '<div class="ci-k"><span class="ci-tip" title="' + withinSdTip + '">Within-student SD across criteria</span></div>' +
          '<div class="ci-v">' + fmt(m.within_student_sd_pct, 1) + '% ' + withinBadge + '</div>' +
        '</div>' +
        '<h3 class="ci-h3">Marking decisions</h3>' +
        '<div class="ci-grid">' +
          '<div class="ci-k">Late penalties applied</div><div class="ci-v">' + lateBadgeHtml + '</div>' +
          '<div class="ci-k">Suggested-band overrides</div><div class="ci-v">' + overHtml + '</div>' +
        '</div>' +
        '<h3 class="ci-h3">Documentation</h3>' +
        '<div class="ci-grid">' +
          '<div class="ci-k">Marker\'s Notes completion</div><div class="ci-v">' + notesHtml + '</div>' +
          '<div class="ci-k">Feedback length (mean ± SD)</div><div class="ci-v">' + m.feedback_word_count_mean + ' ± ' + m.feedback_word_count_sd + ' words</div>' +
        '</div>';

    /* ── Summary and formative prompts ── */
    var summaryBullets = buildSummary(m, ctx.state);
    var prompts = buildFormativePrompts(m);

    /* ── Assemble full panel HTML ── */
    panel.innerHTML =
      mixedStripHtml +

      '<header class="ci-header">' +
        '<h1 class="ci-h1">Cohort Insights</h1>' +
        '<p class="ci-subtitle">' + escHtml(cohort.label || 'Cohort') + ' · ' + m.n + ' scripts</p>' +
      '</header>' +

      '<div class="ci-summary-block">' +
        '<h3 class="ci-summary-h3">Plain-English summary</h3>' +
        '<ul class="ci-summary-ul">' +
          summaryBullets.map(function (t) { return '<li>' + escHtml(t) + '</li>'; }).join('') +
        '</ul>' +
        '<p class="ci-panel-note" style="margin-top:10px">These bullets describe this cohort only. They are not a comparison with other tutors or other cohorts and are not intended as a performance review.</p>' +
      '</div>' +

      '<section class="ci-section">' +
        '<h2 class="ci-h2">Cohort at a glance</h2>' +
        '<div class="ci-grid">' +
          '<div class="ci-k">Scripts marked</div><div class="ci-v">' + m.n + '</div>' +
          '<div class="ci-k">Mean total</div><div class="ci-v">' + fmt(m.mean_pre_penalty, 2) + ' / 100</div>' +
          '<div class="ci-k">Lowest mark</div><div class="ci-v">' + fmt(m.min_total, 1) + '</div>' +
          '<div class="ci-k">Highest mark</div><div class="ci-v">' + fmt(m.max_total, 1) + '</div>' +
          '<div class="ci-k">Penalty adjustment</div><div class="ci-v">' + prepostHtml + '</div>' +
        '</div>' +
        '<h3 class="ci-h3">Grade bands</h3>' +
        bandsHtml +
        '<p class="ci-panel-note">Distribution figures (min, max, SD, range, grade bands) are computed on the <strong>pre-penalty</strong> dataset. Post-penalty mean is shown for administrative reconciliation only. Late-penalised scripts are excluded from performance fail counts.</p>' +
      '</section>' +

      '<section class="ci-section">' +
        '<h2 class="ci-h2">' + escHtml(behaviourHeading) + '</h2>' +
        behaviourBodyHtml +
      '</section>' +

      '<section class="ci-section">' +
        '<h2 class="ci-h2">Distribution shape</h2>' +
        '<div class="ci-grid">' +
          '<div class="ci-k">Skew</div><div class="ci-v">' + skewHtml + '</div>' +
          '<div class="ci-k">Kurtosis</div><div class="ci-v">' + kurtHtml + '</div>' +
          '<div class="ci-k">Bimodality</div><div class="ci-v">' + bimHtml + '</div>' +
          '<div class="ci-k"><span class="ci-tip" title="' + escHtml(alphaTip) + '">' + escHtml(ALPHA_LABEL) + '</span></div>' +
          '<div class="ci-v">' + alphaHtml + '</div>' +
        '</div>' +
        '<p class="ci-disclaimer">All figures on this page describe <strong>this cohort only</strong>. With a single cohort it is not possible to tell whether any pattern is typical or unusual, rubric-driven or marker-driven. Cross-cohort comparison and rubric-level role labels (unique / moderate / amplifier) live in the Coordinator Dashboard, where pooled data makes that interpretation reliable. Treat anything here as an observation, not a verdict.</p>' +
      '</section>' +

      '<section class="ci-section">' +
        '<h2 class="ci-h2">Formative prompts</h2>' +
        (prompts.length
          ? '<ul class="ci-prompts-ul">' + prompts.map(function (p) { return '<li>' + escHtml(p) + '</li>'; }).join('') + '</ul>'
          : '<p class="ci-note">No specific prompts for this cohort — marking patterns all look balanced.</p>') +
        '<p class="ci-panel-note">Prompts are starting points for your own reflection — not rankings, scores, or judgements about your marking.</p>' +
      '</section>' +

      '<footer class="ci-footer">Feedback Kitchen is a human-marked, comment-compilation tool. There is no AI grading. This view describes your cohort only and is intended as formative reflection — not a performance review and not a comparison with other tutors.</footer>' +

      '<div class="mt-5 mb-2 flex justify-center gap-3 flex-wrap">' +
        '<button onclick="S && S.hideCohortInsights && S.hideCohortInsights()" ' +
                'class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition-colors">' +
          '← Back to marking' +
        '</button>' +
        '<button id="ci-copy-btn" onclick="S && S.copyCohortInsights && S.copyCohortInsights()" ' +
                'class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">' +
          'Copy insights' +
        '</button>' +
      '</div>';
  }

  /* ── Public API ─────────────────────────────────────────────── */
  window.CohortInsights = { cohortMetrics: cohortMetrics, detectState: detectState, renderInsights: renderInsights };

})();
