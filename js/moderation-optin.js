/* ============================================================
   Feedback Kitchen — Moderation Export Opt-In (moderation-optin.js)

   Local-only CRUD for the lecturer/coordinator opt-in record that
   gates the privacy-reduced moderation export.

   Storage:
     localStorage key: FK_MOD_EXPORT_OPTINS
     value: { [paperKey]: OptInRecord, ... }
     paperKey = `${paper_code}::${cohort_id}::${assessment_id}`

   This module performs ZERO network calls and never touches the
   identified-export code path. See: docs/fk_moderation_export_v1.md
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'FK_MOD_EXPORT_OPTINS';

  /* ── Storage I/O (defensive against quota/parse errors) ──── */
  function _readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
        ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function _writeAll(map) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map || {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ── Key helpers ─────────────────────────────────────────── */
  function _normIdent(s) {
    return String(s == null ? '' : s).trim();
  }

  function _paperKey(paperCode, cohortId, assessmentId) {
    return `${_normIdent(paperCode)}::${_normIdent(cohortId)}::${_normIdent(assessmentId)}`;
  }

  /* ── Public: read ────────────────────────────────────────── */
  function getModerationOptIn(paperCode, cohortId, assessmentId) {
    const all = _readAll();
    const rec = all[_paperKey(paperCode, cohortId, assessmentId)];
    return rec || null;
  }

  function getAllModerationOptIns() {
    return _readAll();
  }

  /* ── Public: write ───────────────────────────────────────── */
  // input: {
  //   lecturer_name, lecturer_role,
  //   paper_code, cohort_id, assessment_id,
  //   opt_in_recorded   // boolean confirming the checkbox
  // }
  function setModerationOptIn(input) {
    const i = input || {};

    // Required fields — all three identifiers + lecturer name + recorded flag
    const paper_code     = _normIdent(i.paper_code);
    const cohort_id      = _normIdent(i.cohort_id);
    const assessment_id  = _normIdent(i.assessment_id);
    const lecturer_name  = _normIdent(i.lecturer_name);
    const opt_in_recorded = (i.opt_in_recorded === true);

    if (!paper_code || !cohort_id || !assessment_id) {
      return { ok: false, reason: 'missing-identifiers' };
    }
    if (!lecturer_name) {
      return { ok: false, reason: 'missing-lecturer-name' };
    }
    if (!opt_in_recorded) {
      return { ok: false, reason: 'not-confirmed' };
    }

    // Pull provenance from existing globals (no new dependencies).
    const fkVersion = (window.SA && typeof window.SA.getFKVersion === 'function')
      ? window.SA.getFKVersion() : '';
    const schemaVer = (window.FKModSchema && window.FKModSchema.MOD_EXPORT_SCHEMA_VERSION) || 'modexport-v1';
    const textVer   = (window.FKModSchema && window.FKModSchema.MOD_OPTIN_TEXT_VERSION) || 'modexport-optin-v1';

    const record = {
      lecturer_name:        lecturer_name,
      lecturer_role:        _normIdent(i.lecturer_role) || null,
      paper_code:           paper_code,
      cohort_id:            cohort_id,
      assessment_id:        assessment_id,
      fk_version:           fkVersion,
      opt_in_timestamp:     new Date().toISOString(),
      opt_in_version:       schemaVer,
      opt_in_text_version:  textVer,
      opt_in_recorded:      true,
      enabled:              true
    };

    const all = _readAll();
    all[_paperKey(paper_code, cohort_id, assessment_id)] = record;
    const wrote = _writeAll(all);
    return wrote
      ? { ok: true, record: record }
      : { ok: false, reason: 'storage-error' };
  }

  /* ── Public: clear / disable ─────────────────────────────── */
  // Per spec: opt-out blocks future exports only; previously
  // generated files are unaffected. We mark `enabled=false` and
  // keep the record for audit, OR fully remove it if hard=true.
  function clearModerationOptIn(paperCode, cohortId, assessmentId, opts) {
    const hard = !!(opts && opts.hard);
    const all = _readAll();
    const k = _paperKey(paperCode, cohortId, assessmentId);
    if (!(k in all)) return { ok: true, found: false };

    if (hard) {
      delete all[k];
    } else {
      all[k] = Object.assign({}, all[k], { enabled: false });
    }
    return _writeAll(all)
      ? { ok: true, found: true, hard: hard }
      : { ok: false, reason: 'storage-error' };
  }

  /* ── Public: gating check ────────────────────────────────── */
  function isModerationEnabledForCurrentPaper(paperCode, cohortId, assessmentId) {
    const rec = getModerationOptIn(paperCode, cohortId, assessmentId);
    return !!(rec && rec.enabled === true && rec.opt_in_recorded === true);
  }

  /* ── Export to global ────────────────────────────────────── */
  window.FKModOptIn = {
    STORAGE_KEY,
    getModerationOptIn,
    getAllModerationOptIns,
    setModerationOptIn,
    clearModerationOptIn,
    isModerationEnabledForCurrentPaper
  };
})();
