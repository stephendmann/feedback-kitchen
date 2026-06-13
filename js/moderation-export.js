/* ============================================================
   Feedback Kitchen — Moderation Export Workbook Builder
   (moderation-export.js)

   Entry point: buildAndDownloadModExport({ config, cohort, optInRecord })

   This is a fully decoupled code path. It does NOT call
   exportToExcel() or any function in excel.js. It does NOT
   make network requests. All state is in-memory or
   localStorage (via the opt-in record already resolved by
   the caller).

   Requires (loaded before this script):
     window.XLSX              — SheetJS
     window.SA                — shared.js (getFKVersion, GRADE_TIERS, formatScore)
     window.FKModSchema       — moderation-schema.js
     window.FKModSuppression  — moderation-suppression.js
     window.FKModReadme       — moderation-readme.js

   See: docs/fk_moderation_export_v1.md
   ============================================================ */

(function () {
  'use strict';

  /* ── Rubric version hash ─────────────────────────────────────
     djb2-derived 32-bit hash of all criteria names, weights,
     and tier descriptors. Changes when the rubric changes.
     Produces a stable 8-character lowercase hex string.

     FK-11: the canonical implementation lives in shared.js
     (SA.rubricVersionHash) and is stamped onto each record at save
     time; we delegate to it so the live-config fallback hash is
     byte-identical to the per-record stamps. The inline copy below
     is retained only as a defence against load-order surprises. */
  function _rubricHash(config) {
    if (window.SA && typeof window.SA.rubricVersionHash === 'function') {
      return window.SA.rubricVersionHash(config);
    }
    const str = (config.criteria || []).map(function (c) {
      return [
        c.name, c.weight,
        (c.rubric && c.rubric.excellent)      || '',
        (c.rubric && c.rubric.proficient)     || '',
        (c.rubric && c.rubric.developing)     || '',
        (c.rubric && c.rubric.satisfactory)   || '',
        (c.rubric && c.rubric.unsatisfactory) || ''
      ].join('\x00');
    }).join('\x01');
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  /* ── Grade band resolver ────────────────────────────────────
     Maps suggestedGrade → tier key using the scorer's custom
     gradeScale if present, otherwise the default GRADE_TIERS. */
  function _gradeBand(suggestedGrade, config) {
    if (!suggestedGrade) return 'developing';
    if (Array.isArray(config && config.gradeScale) && config.gradeScale.length) {
      const entry = config.gradeScale.find(function (g) { return g.grade === suggestedGrade; });
      return entry ? entry.tier : 'developing';
    }
    return (window.SA && window.SA.GRADE_TIERS && window.SA.GRADE_TIERS[suggestedGrade]) || 'developing';
  }

  /* ── Submission window bucket ───────────────────────────────
     Converts the student's penaltyIdx to a privacy-safe
     submission timing label. Uses the penalty deduction/fail
     flags rather than the human-readable label text. */
  function _submissionWindow(s, config) {
    const idx = typeof s.penaltyIdx === 'number' ? s.penaltyIdx : 0;
    const penalties = (config && config.latePenalties) || [];
    const p = penalties[idx];
    if (!p || (!p.deduction && !p.fail)) return 'on_time';
    if (p.fail) return 'late_fail';
    return 'late_band_' + idx;
  }

  /* ── Edit count proxy ───────────────────────────────────────
     Counts criteria where the marker explicitly set a grade
     (i.e. grade present AND not bulk-auto-filled). Used as a
     lightweight proxy for marking engagement. */
  function _editCount(s) {
    const grades = Array.isArray(s.grades) ? s.grades : [];
    return grades.filter(function (g) { return g && g.grade && !g.autoFilled; }).length;
  }

  /* ── Score formatter ─────────────────────────────────────── */
  function _fmt(v, rounding) {
    if (typeof v !== 'number') return '';
    if (window.SA && window.SA.formatScore) {
      return parseFloat(window.SA.formatScore(v, rounding));
    }
    return parseFloat(v.toFixed(2));
  }

  /* ══════════════════════════════════════════════════════════
     buildAndDownloadModExport
     ══════════════════════════════════════════════════════════
     sess = { config, cohort, optInRecord }

     Returns the filename string on success, or null if the
     export was blocked / failed without producing a file. */
  function buildAndDownloadModExport(sess) {
    if (typeof XLSX === 'undefined') {
      alert('Excel library (SheetJS) is not loaded. Please check your connection and try again.');
      return null;
    }

    const { config, cohort, optInRecord } = sess || {};
    if (!config || !cohort || !optInRecord) {
      alert('Moderation Export: missing session data. Please try again.');
      return null;
    }

    const students  = cohort.students || [];
    const schema    = window.FKModSchema      || {};
    const supp      = window.FKModSuppression || {};
    const minN      = schema.COHORT_MIN_N     || 15;

    // Hard gate — caller must have already shown the block dialog, but guard again.
    if (students.length < minN) return null;

    const criteria   = config.criteria  || [];
    const rounding   = config.scoreRounding || 'none';
    const rubricHash = _rubricHash(config);
    const fkVersion  = (window.SA && typeof window.SA.getFKVersion === 'function')
      ? window.SA.getFKVersion() : (config.appVersion || '');
    const exportTs   = schema.roundExportTimestampToHour
      ? schema.roundExportTimestampToHour(new Date())
      : new Date().toISOString();

    /* ── Tutor label map ── */
    const tutorMap = supp.buildTutorLabelMap ? supp.buildTutorLabelMap(students) : {};

    /* ── Grade band counts (for suppression flag check) ── */
    const bandCounts = {};
    for (const s of students) {
      const band = _gradeBand((s.scoreResult || {}).suggestedGrade, config);
      bandCounts[band] = (bandCounts[band] || 0) + 1;
    }

    /* ── Build raw row objects, then shuffle ── */
    const rawRows = students.map(function (s) {
      const sr   = s.scoreResult || {};
      const band = _gradeBand(sr.suggestedGrade, config);
      const total = typeof sr.penalisedScore === 'number' ? sr.penalisedScore : 0;
      return { s: s, sr: sr, srRows: sr.rows || [], tutor: (s.tutor || '').trim(), band: band, total: total };
    });
    const shuffled = supp.shuffleRows ? supp.shuffleRows(rawRows) : rawRows.slice();

    /* ── Row labels + extreme row detection ── */
    const labels = supp.assignRowLabels
      ? supp.assignRowLabels(shuffled.length)
      : shuffled.map(function (_, i) { return 'R' + String(i + 1).padStart(3, '0'); });
    const totals     = shuffled.map(function (r) { return r.total; });
    const extremeSet = new Set(supp.calculateExtremeRows ? supp.calculateExtremeRows(totals) : []);

    /* ── Suppression thresholds ── */
    const THRESHOLDS = {
      COHORT_MIN_N:         schema.COHORT_MIN_N         || 15,
      TUTOR_MIN_N:          schema.TUTOR_MIN_N           || 5,
      GRADE_BAND_MIN_N:     schema.GRADE_BAND_MIN_N      || 5,
      EXTREME_SD_THRESHOLD: schema.EXTREME_SD_THRESHOLD  || 3
    };

    /* ── 10_rows column headers ── */
    const colHeaders = [
      'row_label', 'paper_code', 'cohort_id', 'assessment_id',
      'rubric_version_hash', 'tutor_label'
    ];
    criteria.forEach(function (_, k) {
      colHeaders.push('criterion_' + (k + 1) + '_score');
      colHeaders.push('criterion_' + (k + 1) + '_max');
    });
    colHeaders.push(
      'total_score', 'total_max', 'grade_band',
      'submission_window', 'time_to_mark_bucket', 'edit_count',
      'suppression_flag', 'extreme_row_flag', 'fk_version', 'export_timestamp'
    );

    /* ── 10_rows data rows ── */
    const dataRows = shuffled.map(function (r, i) {
      const tutorLabel  = tutorMap[r.tutor] || 'T_other';
      const bandCount   = bandCounts[r.band] || 0;
      const isExtreme   = extremeSet.has(i);
      const suppFlags   = supp.buildSuppressionFlags
        ? supp.buildSuppressionFlags({ tutorLabel: tutorLabel, gradeBandCount: bandCount, isExtreme: isExtreme })
        : '';

      // FK-11: prefer the rubric hash stamped on the record at save time;
      // fall back to the live-config hash only for legacy records saved
      // before per-record stamping existed.
      const rowRubricHash = r.s.rubricVersionHash || rubricHash;
      const row = [
        labels[i],
        optInRecord.paper_code, optInRecord.cohort_id, optInRecord.assessment_id,
        rowRubricHash, tutorLabel
      ];
      criteria.forEach(function (_, k) {
        const srRow = r.srRows[k] || {};
        row.push(typeof srRow.finalScore === 'number' ? srRow.finalScore : '');
        row.push(100);
      });
      row.push(
        _fmt(r.total, rounding),
        100,
        r.band,
        _submissionWindow(r.s, config),
        'n/a',
        _editCount(r.s),
        suppFlags,
        isExtreme ? 1 : 0,
        fkVersion,
        exportTs
      );
      return row;
    });

    /* ── Suppression descriptions for 00_README ── */
    const suppDesc = {
      COHORT_LT_15_BLOCK:        'Export blocked — cohort has fewer than ' + THRESHOLDS.COHORT_MIN_N + ' students. No file is produced.',
      TUTOR_LT_5_COLLAPSED:      'Tutor had fewer than ' + THRESHOLDS.TUTOR_MIN_N + ' students; relabelled T_other.',
      GRADE_BAND_LT_5_SUPPRESSED:'Grade band has fewer than ' + THRESHOLDS.GRADE_BAND_MIN_N + ' students; treat band-level aggregates with caution.',
      EXTREME_ROW_FLAGGED:       'Total score is more than ' + THRESHOLDS.EXTREME_SD_THRESHOLD + ' SD from the cohort mean; review for data-entry errors.'
    };

    /* ── Sheet 1: 00_README ── */
    const readmeRows = (window.FKModReadme && window.FKModReadme.buildReadmeContent)
      ? window.FKModReadme.buildReadmeContent(optInRecord, suppDesc)
      : [['FK Moderation Export', 'Schema: ' + (schema.MOD_EXPORT_SCHEMA_VERSION || 'modexport-v1')]];

    /* ── Sheet 3: 20_methods ── */
    const methodsRows = (window.FKModReadme && window.FKModReadme.buildMethodsContent)
      ? window.FKModReadme.buildMethodsContent(
          schema.MOD_EXPORT_SCHEMA_VERSION || 'modexport-v1',
          fkVersion, THRESHOLDS)
      : [['20_methods', 'see 00_README']];

    /* ── Sheet 4: 90_manifest ────────────────────────────────
       Two-column key/value layout compatible with the
       fk_moderation_pack.py _manifest_from_df() reader.
       Column headers must be exactly "key" and "value". */
    const extremeCount   = extremeSet.size;
    const suppressedBands = Object.keys(bandCounts)
      .filter(function (b) { return bandCounts[b] < THRESHOLDS.GRADE_BAND_MIN_N; });
    const tOtherPresent  = Object.values(tutorMap).some(function (v) { return v === 'T_other'; });

    /* ── FK-11: rubric-version provenance ────────────────────────
       Distinct per-record rubric hashes (with the live-config
       fallback for legacy unstamped records). One value → the cohort
       was marked against a single rubric version; more than one →
       the rubric changed mid-cohort and the manifest must say so. */
    const rubricVersions = Array.from(new Set(students.map(function (s) {
      return s.rubricVersionHash || rubricHash;
    }))).sort();
    const rubricMixed = rubricVersions.length > 1;
    const manRubricHash = rubricMixed ? 'mixed' : (rubricVersions[0] || rubricHash);

    const suppNotes = [
      tOtherPresent     ? 'TUTOR_LT_5_COLLAPSED applied'                                 : '',
      suppressedBands.length ? 'GRADE_BAND_LT_5_SUPPRESSED: ' + suppressedBands.join(', ') : '',
      extremeCount          ? 'EXTREME_ROW_FLAGGED: ' + extremeCount + ' row(s)'           : '',
      rubricMixed           ? 'RUBRIC_VERSION_MIXED: ' + rubricVersions.length + ' versions' : ''
    ].filter(Boolean).join('; ') || '';

    const MAN_KV = [
      ['key',                  'value'],
      ['schema_version',       schema.MOD_EXPORT_SCHEMA_VERSION || 'modexport-v1'],
      ['fk_version',           fkVersion],
      ['export_timestamp',     exportTs],
      ['rubric_version_hash',  manRubricHash],
      ['rubric_versions',      rubricVersions.join('; ')],
      ['paper_code',           optInRecord.paper_code   || ''],
      ['cohort_id',            optInRecord.cohort_id    || ''],
      ['assessment_id',        optInRecord.assessment_id || ''],
      ['n_students',           students.length],
      ['n_criteria',           criteria.length],
      ['criteria_names',       criteria.map(function (c) { return c.name; }).join('; ')],
      ['n_extreme_rows',       extremeCount],
      ['tutor_other_present',  tOtherPresent ? 'yes' : 'no'],
      ['suppressed_bands',     suppressedBands.length ? suppressedBands.join('; ') : 'none'],
      ['suppression_notes',    suppNotes],
      ['lecturer_name',        optInRecord.lecturer_name  || ''],
      ['lecturer_role',        optInRecord.lecturer_role  || ''],
      ['opt_in_timestamp',     optInRecord.opt_in_timestamp || ''],
      ['opt_in_version',       optInRecord.opt_in_version   || ''],
      ['opt_in_text_version',  optInRecord.opt_in_text_version || '']
    ];

    /* ── Assemble workbook (sheet order: 00_README, 10_rows, 20_methods, 90_manifest) ── */
    const wb = XLSX.utils.book_new();

    const wsReadme = XLSX.utils.aoa_to_sheet(readmeRows);
    wsReadme['!cols'] = [{ wch: 46 }, { wch: 74 }];
    XLSX.utils.book_append_sheet(wb, wsReadme, schema.SHEET_README || '00_README');

    const wsRows = XLSX.utils.aoa_to_sheet([colHeaders].concat(dataRows));
    const rowCols = [{ wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 10 }];
    criteria.forEach(function () { rowCols.push({ wch: 18 }); rowCols.push({ wch: 10 }); });
    rowCols.push(
      { wch: 12 }, { wch: 10 }, { wch: 20 },
      { wch: 18 }, { wch: 18 }, { wch: 10 },
      { wch: 42 }, { wch: 16 }, { wch: 14 }, { wch: 26 }
    );
    wsRows['!cols'] = rowCols;
    XLSX.utils.book_append_sheet(wb, wsRows, schema.SHEET_ROWS || '10_rows');

    const wsMethods = XLSX.utils.aoa_to_sheet(methodsRows);
    wsMethods['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 82 }];
    XLSX.utils.book_append_sheet(wb, wsMethods, schema.SHEET_METHODS || '20_methods');

    const wsManifest = XLSX.utils.aoa_to_sheet(MAN_KV);
    wsManifest['!cols'] = [{ wch: 28 }, { wch: 66 }];
    XLSX.utils.book_append_sheet(wb, wsManifest, schema.SHEET_MANIFEST || '90_manifest');

    /* ── Write file ── */
    const filename = schema.buildModExportFilename
      ? schema.buildModExportFilename(optInRecord.paper_code, optInRecord.cohort_id, optInRecord.assessment_id)
      : 'FK_ModExport.xlsx';
    XLSX.writeFile(wb, filename);
    return filename;
  }

  window.FKModExport = { buildAndDownloadModExport: buildAndDownloadModExport };
})();
