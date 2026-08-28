/**
 * Scorer application logic.
 *
 * Extracted verbatim from an inline <script> in scorer.html so the browser can
 * cache it between visits. It was ~200 KB of the page's ~332 KB, re-downloaded
 * and re-parsed on every single load because inline code cannot be cached.
 *
 * Loaded as a classic (non-defer) script at the same position it previously
 * occupied, so execution order relative to the other inline blocks is
 * unchanged. Contents are byte-identical to what was inline.
 */
  'use strict';
  /* ============================================================
     Scorer — live grading logic
     ============================================================ */
  const S = (function () {

    let config          = null;
    let studentGrades   = [];   // [{ grade, override }]
    let latePenaltyIdx  = 0;
    let scoreResult     = null;
    let _displayRounding = 'none'; // runtime override — initialised from config.scoreRounding

    // State for feedback merging (preserves manual edits when grades change)
    let lastGeneratedText = "";
    let lastScoreResult = null;
    let lastConfig = null;

    // Focus mode (criterion-by-criterion workspace) — additive view over the same data.
    const FK_FOCUS_KEY = 'SA_FOCUS_MODE';
    let focusMode = false;
    let focusIdx  = 0;
    let _focusSavedAdjOpen = false; // remembers Penalty & grade override open state before focus entry

    // Snippets
    const SNIPPETS_KEY = 'SA_SNIPPETS';
    let snippets = [];
    let sheetJSPromise = null;

    /* ── Draft persistence v2 (FK-21) ─────────────────────────────
       Re-implements PR #12's intent: a debounced autosave of the
       in-progress student so a tab close/refresh mid-mark doesn't lose
       work. Per-scorer key; routes writes through SA.safeSetItem (FK-24)
       and degrades silently on quota; gated on FK-07's
       _sessionHasUnsavedWork() so only real, graded work is stored.
       Offered back on load via a non-blocking Resume/Discard banner. */
    const FK_DRAFT_PREFIX = 'SA_DRAFT_V1_';
    let _draftReady = false;            // flips true once the resume offer has run
    let _draftSaveTimer = null;
    const DRAFT_DEBOUNCE_MS = 1000;

    function _draftKey() {
      return FK_DRAFT_PREFIX + ((config && config.id) || 'default');
    }

    function _buildDraft() {
      const v = id => { const x = el(id); return x ? x.value : ''; };
      return {
        scorerId:           (config && config.id) || '',
        savedAt:            new Date().toISOString(),
        studentGrades:      JSON.parse(JSON.stringify(studentGrades || [])),
        latePenalty:        v('late-penalty-select') || '0',
        gradeOverride:      v('grade-override'),
        studentName:        v('student-name'),
        studentId:          v('student-id'),
        studentTutor:       getSetting('clearTutorBetweenStudents', false) ? '' : v('student-tutor'),  // FK-33: keep the marker name out of the on-device draft on shared machines
        studentDate:        v('student-date'),
        feedbackText:       v('feedback-text'),
        additionalComments: v('additional-comments')
      };
    }

    // Immediate write. No-op unless there is real unsaved work (>=1 graded
    // criterion AND changed since the last save/load/reset — FK-07 gate).
    // safeSetItem throws StorageWriteError on quota; swallow it — the draft is
    // best-effort and must never interrupt marking (FK-21 AC#4).
    function saveDraft() {
      if (!_draftReady || !config || !config.id) return;
      if (!_sessionHasUnsavedWork()) return;
      try {
        SA.safeSetItem(_draftKey(), JSON.stringify(_buildDraft()));
      } catch (e) { /* quota / private browsing — degrade silently */ }
    }

    function _scheduleDraftSave() {
      if (!_draftReady) return;
      if (_draftSaveTimer) clearTimeout(_draftSaveTimer);
      _draftSaveTimer = setTimeout(saveDraft, DRAFT_DEBOUNCE_MS);
    }

    // Flush synchronously on page-hide so the last edits survive a hard close.
    function _flushDraftSave() {
      if (_draftSaveTimer) { clearTimeout(_draftSaveTimer); _draftSaveTimer = null; }
      saveDraft();
    }

    function clearDraft() {
      if (_draftSaveTimer) { clearTimeout(_draftSaveTimer); _draftSaveTimer = null; }
      try { localStorage.removeItem(_draftKey()); } catch (e) {}
    }

    function _readDraft() {
      if (!config || !config.id) return null;
      try {
        const raw = localStorage.getItem(_draftKey());
        if (!raw) return null;
        const d = JSON.parse(raw);
        if (d && d.scorerId && d.scorerId !== config.id) return null; // this scorer only
        return d;
      } catch (e) { return null; }
    }

    function _draftHasGrades(d) {
      return !!(d && Array.isArray(d.studentGrades) && d.studentGrades.some(g => g && g.grade));
    }

    // Debounced autosave on the fields that don't already route through
    // recalculate() (grades / penalty / override do — see recalculate()).
    function wireDraftAutosave() {
      ['feedback-text', 'additional-comments', 'student-name', 'student-id', 'student-tutor']
        .forEach(function (id) {
          const elx = el(id);
          if (elx && !elx._fk21Wired) {
            elx.addEventListener('input', _scheduleDraftSave);
            elx._fk21Wired = true;
          }
        });
      window.addEventListener('pagehide', _flushDraftSave);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') _flushDraftSave();
      });
    }

    // On load: if a draft for this scorer holds graded work, offer it via a
    // non-blocking banner. Always flips _draftReady true at the end so autosave
    // can begin — the init recalculate() before this is a no-op while
    // _draftReady is false, so it can't clobber the stored draft.
    function _offerDraftResume() {
      const d = _readDraft();
      const banner = el('draft-resume-banner');
      if (d && _draftHasGrades(d) && banner) {
        let when = '';
        try { when = new Date(d.savedAt).toLocaleString(); } catch (e) {}
        const label = el('draft-resume-label');
        if (label) label.textContent = when ? ('Unsaved draft from ' + when) : 'Unsaved draft found';
        banner.classList.remove('hidden');
      }
      _draftReady = true;
    }

    function resumeDraft() {
      const d = _readDraft();
      if (!d) { discardDraft(); return; }
      const set = (id, val) => { const x = el(id); if (x) x.value = (val == null ? '' : val); };
      studentGrades = Array.isArray(d.studentGrades)
        ? JSON.parse(JSON.stringify(d.studentGrades)) : studentGrades;
      (config.criteria || []).forEach(function (_, i) {
        const g = studentGrades[i] || {};
        set('grade-sel-' + i, g.grade || '');
        set('override-' + i, (g.override == null ? '' : g.override));
      });
      set('student-name', d.studentName);
      set('student-id', d.studentId);
      set('student-tutor', d.studentTutor);
      set('student-date', d.studentDate);
      set('grade-override', d.gradeOverride);
      set('late-penalty-select', d.latePenalty || '0');
      const banner = el('draft-resume-banner'); if (banner) banner.classList.add('hidden');
      recalculate();            // re-render rows + totals from the restored grades
      // Restore free text AFTER recalculate(): on a fresh page lastGeneratedText
      // is null, so recalculate() regenerates feedback from the grades and would
      // otherwise overwrite the marker's saved feedback. Set it last so the
      // saved text wins (FK-21 AC#6 "restore all fields exactly").
      const fb = el('feedback-text'); if (fb) fb.value = d.feedbackText || '';
      const nt = el('additional-comments'); if (nt) nt.value = d.additionalComments || '';
      lastGeneratedText = '';   // saved feedback is now authoritative, not generated
      refreshStatusChips();
      updateMarkingAs();        // FK-33: reflect the resumed tutor in the topbar readout
      try { _refreshAllAutoPills(); } catch (e) {}
      showCohortToast('Draft restored.', 'green');
      // The restored state IS genuine unsaved work — keep the draft and leave
      // the session "dirty" so the unsaved-work guard still applies.
    }

    function discardDraft() {
      clearDraft();
      const banner = el('draft-resume-banner'); if (banner) banner.classList.add('hidden');
    }

    /* ── Shared modal helpers (PR #14) ──────────────────────
       openModal / closeModal provide:
         • role="dialog" + aria-modal + aria-labelledby (fallback if not in HTML)
         • focus on first focusable element (or heading)
         • Tab / Shift+Tab trap within the modal
         • Escape to close
         • trigger-element focus restore on close
    ────────────────────────────────────────────────────── */
    const _modalTriggers    = {};   // id → element that opened the modal
    const _modalKeyHandlers = {};   // id → keydown handler attached to the modal div

    function _getFocusables(container) {
      return Array.from(container.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
        'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      )).filter(function (n) {
        return !n.closest('.hidden') && getComputedStyle(n).display !== 'none';
      });
    }

    function openModal(id, triggerEl) {
      const modal = el(id);
      if (!modal) return;

      // Store trigger (caller can pass explicit element; fall back to active element)
      _modalTriggers[id] = (triggerEl !== undefined ? triggerEl : document.activeElement) || null;

      // Ensure ARIA attributes — static in HTML, set here as a safety net
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      if (!modal.hasAttribute('aria-labelledby')) {
        const h = modal.querySelector('h1[id],h2[id],h3[id],h4[id]');
        if (h) modal.setAttribute('aria-labelledby', h.id);
      }

      modal.classList.remove('hidden');

      // Attach Tab-trap + Escape handler BEFORE focus so the trap is armed
      // during the requestAnimationFrame gap between unhide and focus placement.
      function keyHandler(e) {
        if (e.key === 'Escape') {
          closeModal(id);
          return;
        }
        if (e.key !== 'Tab') return;
        const foc = _getFocusables(modal);
        if (!foc.length) return;
        const first = foc[0], last = foc[foc.length - 1];
        // If focus escaped (e.g. during rAF delay or backdrop click), pull it back.
        if (!modal.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      _modalKeyHandlers[id] = keyHandler;
      modal.addEventListener('keydown', keyHandler);

      // Queue focus after the browser has painted the now-visible modal so
      // .focus() reliably succeeds (synchronous focus on a just-unhidden element
      // can silently fail in some browsers before layout settles).
      requestAnimationFrame(function () {
        const focusables = _getFocusables(modal);
        if (focusables.length) {
          focusables[0].focus();
        } else {
          const h = modal.querySelector('h1,h2,h3,h4');
          if (h) {
            if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '-1');
            h.focus();
          }
        }
      });
    }

    function closeModal(id) {
      const modal = el(id);
      if (!modal || modal.classList.contains('hidden')) return; // already closed

      modal.classList.add('hidden');

      // Remove the per-modal key listener
      const handler = _modalKeyHandlers[id];
      if (handler) {
        modal.removeEventListener('keydown', handler);
        delete _modalKeyHandlers[id];
      }

      // Restore focus to the triggering element
      const trigger = _modalTriggers[id];
      delete _modalTriggers[id];
      if (trigger && typeof trigger.focus === 'function') {
        try { trigger.focus(); } catch (_) {}
      }
    }

    /* ── Init ────────────────────────────────────────────── */
    function init() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id') || SA.getActiveId();

      config = id ? SA.loadConfig(id) : SA.loadActiveConfig();

      // Fallback: no active id but scorers exist → use the first one.
      if (!config) {
        const all = SA.loadAllConfigs();
        if (all && all.length > 0) {
          config = all[0];
        }
      }

      if (!config) {
        renderNoConfigScreen();
        return;
      }

      SA.setActiveId(config.id);
      _displayRounding = config.scoreRounding || 'none';
      highlightRoundingBtn(_displayRounding);
      document.getElementById('app').classList.remove('hidden');

      // Show the demo onboarding panel once per fresh demo launch.
      if (config.id === 'demo-written-response-v2'
          && localStorage.getItem('SA_DEMO_ONBOARDING_DISMISSED') !== '1') {
        const panel = document.getElementById('demo-onboarding');
        if (panel) panel.classList.remove('hidden');
      }

      // Header, nav & page title
      const navParts = [config.name, config.assessmentTitle].filter(Boolean);
      document.getElementById('nav-scorer-name').textContent = navParts.join(' · ');
      updateMarkingAs();   // FK-33: initialise the "Marking as" topbar readout
      const hdrTitle = [config.courseName, config.assessmentTitle].filter(Boolean).join(' — ') || 'Feedback Kitchen';
      document.getElementById('hdr-title').textContent = hdrTitle;
      document.title = hdrTitle === 'Feedback Kitchen' ? 'Feedback Kitchen' : 'Feedback Kitchen — ' + hdrTitle;
      document.getElementById('hdr-subtitle').textContent =
        [config.assignmentInfo, config.universityName].filter(Boolean).join('  ·  ');

      // Framework label chip — shown when config carries a frameworkLabel (e.g. VRIO demo rubric)
      var fwChip = document.getElementById('framework-label-chip');
      if (fwChip && config.frameworkLabel) {
        fwChip.textContent = config.frameworkLabel;
        fwChip.classList.remove('hidden');
      }

      document.getElementById('footer-edit-link').href = 'builder.html?id=' + config.id;
      document.getElementById('edit-scorer-btn').href = 'builder.html?id=' + config.id;

      // Date
      document.getElementById('student-date').value = SA.formatDate();

      // Student grades array
      studentGrades = config.criteria.map(() => ({ grade: '', override: null, overrideManual: false, autoFilled: false }));

      // Late penalty select
      const sel = document.getElementById('late-penalty-select');
      if (!config.enableLatePenalties) {
        document.getElementById('late-penalty-controls').style.display = 'none';
      } else {
        config.latePenalties.forEach((lp, i) => {
          const opt = document.createElement('option');
          opt.value = i; opt.textContent = lp.label;
          sel.appendChild(opt);
        });
      }

      loadSnippets();
      refreshAIInputChips();
      _setOverridePlaceholder();

      document.querySelectorAll('.feedback-box').forEach(ta => {
        const grow = () => {
          if (CSS && CSS.supports && CSS.supports('field-sizing: content')) return;
          ta.style.height = 'auto';
          ta.style.height = Math.min(ta.scrollHeight + 2, window.innerHeight * 0.6) + 'px';
        };
        ta.addEventListener('input', grow);
        grow();
      });

      renderCriteriaRows();
      recalculate();
      restoreSectionState();
      // Restore Focus mode preference (per browser). After recalculate() so scoreResult exists.
      try { if (localStorage.getItem(FK_FOCUS_KEY) === '1') applyFocusMode(true); } catch (e) { /* private mode */ }
      restoreExplainerState();
      updateAILoginBadge();
      applyAudienceLengthIntroOutroToUI();
      applyBulkFillVisibility();
      refreshCohortUI();

      // Warn user if they try to leave with unsaved cohort data (not yet exported)
      window.addEventListener('beforeunload', function (e) {
        const cohort = SA.getCohort(config && config.id);
        if (cohort && cohort.students && cohort.students.length > 0) {
          e.preventDefault();
          e.returnValue = 'You have ' + cohort.students.length + ' students in this cohort. Export before closing to save permanently.';
          return e.returnValue;
        }
      });

      // 30-day nudge
      const existing = SA.getCohort(config.id);
      if (existing && SA.cohortAgeDays(existing) > 30 && existing.students.length > 0) {
        setTimeout(function () {
          showCohortToast('Cohort "' + (existing.label || '—') + '" is over 30 days old — export or clear.', 'amber');
        }, 1200);
      }

      wireSectionStatePersistence();
      wireExplainerPersistence();
      bindKeyboardShortcuts();
      _markSessionClean();
      wireDraftAutosave();   // FK-21: debounced autosave + page-hide flush
      _offerDraftResume();   // FK-21: offer any saved draft, then enable autosave
    }

    /* ── No-config screen (with list if scorers exist) ───── */
    function renderNoConfigScreen() {
      const screen = document.getElementById('no-config');
      const list   = document.getElementById('no-config-list');
      const title  = document.getElementById('no-config-title');
      const msg    = document.getElementById('no-config-msg');
      const all    = (SA.loadAllConfigs && SA.loadAllConfigs()) || [];

      if (all.length > 0) {
        // Requested ?id= missing but other scorers exist — offer them.
        title.textContent = 'Pick a scorer';
        msg.textContent = 'The requested scorer wasn\'t found, but you have these saved scorers:';
        list.innerHTML = all.map(function (c) {
          const label = [c.name, c.assessmentTitle].filter(Boolean).join(' · ') || c.id;
          return '<a href="scorer.html?id=' + encodeURIComponent(c.id) +
                 '" class="block px-4 py-3 mb-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 transition-colors text-slate-700">' +
                 escHtml(label) + '</a>';
        }).join('');
      } else {
        list.innerHTML = '';
      }
      screen.classList.remove('hidden');
    }

    /* ── Render criteria table rows ──────────────────────── */
    function renderCriteriaRows() {
      const tbody = document.getElementById('criteria-tbody');
      tbody.innerHTML = '';

      const gradeOptions = config.gradeScale ? config.gradeScale.map(g => g.grade) : SA.GRADES;

      // Populate the bulk-fill dropdown with the same grade scale
      const bulkSel = document.getElementById('bulk-fill-grade');
      if (bulkSel) {
        bulkSel.innerHTML = '<option value="">— Grade —</option>'
          + gradeOptions.map(g => `<option value="${g}">${g}</option>`).join('');
      }

      config.criteria.forEach((c, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="font-medium text-slate-700">${escHtml(c.name)}</td>
          <td class="text-center text-sm text-slate-500 font-semibold">${c.weight}%</td>
          <td class="text-center">
            <select class="grade-select" id="grade-sel-${i}"
                    aria-label="Grade for ${c.name}"
                    onchange="S.onGradeChange(${i})"
                    onmousedown="S.onGradeRowReviewed(${i})"
                    onfocus="S.onGradeRowReviewed(${i})">
              <option value="">— Select —</option>
              ${gradeOptions.map(g => `<option value="${g}">${g}</option>`).join('')}
            </select>
            <span id="auto-pill-${i}" class="ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 align-middle hidden" title="This grade was set by Bulk-fill and has not yet been reviewed. Open the row\u2019s grade dropdown or override field to mark as reviewed.">bulk-filled</span>
          </td>
          <td class="text-center">
            <span class="cell-calc rounded px-2 py-1 text-sm" id="midpoint-${i}">—</span>
          </td>
          <td class="text-center">
            <input type="number" id="override-${i}" class="override-input" placeholder="–"
                   min="0" max="100" step="0.5"
                   onmousedown="S.onOverridePrime(${i})"
                   onkeydown="S.onOverrideKeydown(${i}, event)"
                   onwheel="S.onOverridePrime(${i})"
                   onfocus="S.onOverrideFocus(${i})"
                   oninput="S.onOverrideChange(${i})">
          </td>
          <td class="text-center">
            <span class="font-bold text-slate-700 text-sm" id="final-score-${i}">—</span>
          </td>
          <td class="text-center">
            <span class="font-bold text-emerald-700 text-sm" id="weighted-${i}">—</span>
          </td>
          <td class="text-center">
            <span class="tier-pill" id="tier-${i}"></span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    /* ── Event handlers ──────────────────────────────────── */
    function parseOptionalNumber(raw) {
      if (raw == null) return null;
      const s = String(raw).trim();
      if (s === '') return null;
      const n = Number(s);
      return Number.isFinite(n) ? n : null;
    }

    function onGradeChange(i) {
      studentGrades[i].grade = document.getElementById('grade-sel-' + i).value;
      // Always wipe override on grade change — fresh start.
      studentGrades[i].override = null;
      studentGrades[i].overrideManual = false;
      // Manual change clears the auto-filled flag for this row.
      studentGrades[i].autoFilled = false;
      _refreshAutoPill(i);
      document.getElementById('override-' + i).value = '';
      recalculate();
      refreshAIInputChips();
    }

    // ── Bulk-fill ungraded criteria ─────────────────────────
    let _bulkFillSnapshot = null;   // { grades: [...prev studentGrades], indices: [filled idxs] }

    function _refreshAutoPill(i) {
      const pill = document.getElementById('auto-pill-' + i);
      if (!pill) return;
      if (studentGrades[i] && studentGrades[i].autoFilled) pill.classList.remove('hidden');
      else pill.classList.add('hidden');
    }

    function _refreshAllAutoPills() {
      (studentGrades || []).forEach((_, i) => _refreshAutoPill(i));
    }

    function bulkFillUngraded() {
      const sel = document.getElementById('bulk-fill-grade');
      const grade = sel ? sel.value : '';
      if (!grade) {
        showCohortToast('Pick a grade first.', 'amber');
        return;
      }
      // Snapshot for undo (deep enough — these are flat objects)
      const snapshot = (studentGrades || []).map(g => ({
        grade: g.grade, override: g.override,
        overrideManual: g.overrideManual, autoFilled: g.autoFilled
      }));
      const filled = [];
      studentGrades.forEach((g, i) => {
        if (!g.grade) {
          g.grade = grade;
          g.override = null;
          g.overrideManual = false;
          g.autoFilled = true;
          const dd = document.getElementById('grade-sel-' + i);
          if (dd) dd.value = grade;
          const ov = document.getElementById('override-' + i);
          if (ov) ov.value = '';
          filled.push(i);
        }
      });
      if (filled.length === 0) {
        showCohortToast('No ungraded criteria to fill.', 'slate');
        return;
      }
      _bulkFillSnapshot = { grades: snapshot, indices: filled };
      _refreshAllAutoPills();
      recalculate();
      refreshAIInputChips();
      _showUndoToast('Filled ' + filled.length + ' ungraded ' +
        (filled.length === 1 ? 'criterion' : 'criteria') + ' with ' + grade + '.');
      usageTrack && usageTrack('used_bulk_fill');

      // Quality prompt: if more than half the criteria for this student are now bulk-filled,
      // show a (non-punitive) modal asking the marker to review each row before saving.
      const totalCriteria = (studentGrades || []).length;
      const bulkCount = (studentGrades || []).filter(g => g && g.autoFilled).length;
      if (totalCriteria > 0 && (bulkCount / totalCriteria) > 0.5) {
        showBulkFillThresholdModal(bulkCount, totalCriteria);
      }
    }

    /* Bulk-fill threshold quality prompt (>50% bulk-filled) */
    function showBulkFillThresholdModal(bulkCount, total) {
      const msg = el('bulk-fill-threshold-msg');
      if (msg) {
        msg.textContent = 'More than half of this student\u2019s criteria were bulk-filled (' +
          bulkCount + ' of ' + total + '). Bulk-fill is best used where one performance tier ' +
          'clearly dominates. Please review each row before saving.';
      }
      openModal('bulk-fill-threshold-modal', el('bulk-fill-apply'));
      usageTrack && usageTrack('bulk_fill_threshold_warned');
    }
    function hideBulkFillThresholdModal() {
      closeModal('bulk-fill-threshold-modal');
    }

    function undoBulkFill() {
      if (!_bulkFillSnapshot) return;
      const snap = _bulkFillSnapshot.grades;
      snap.forEach((g, i) => {
        if (!studentGrades[i]) return;
        studentGrades[i].grade = g.grade;
        studentGrades[i].override = g.override;
        studentGrades[i].overrideManual = g.overrideManual;
        studentGrades[i].autoFilled = g.autoFilled;
        const dd = document.getElementById('grade-sel-' + i);
        if (dd) dd.value = g.grade || '';
        const ov = document.getElementById('override-' + i);
        if (ov) ov.value = (g.override == null ? '' : g.override);
      });
      _bulkFillSnapshot = null;
      _refreshAllAutoPills();
      recalculate();
      refreshAIInputChips();
      showCohortToast('Bulk-fill undone.', 'slate');
    }

    function _showUndoToast(msg) {
      // Remove any previous bulk-fill toast first
      const prev = document.getElementById('bulk-fill-toast');
      if (prev) prev.remove();
      const t = document.createElement('div');
      t.id = 'bulk-fill-toast';
      t.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3';
      t.innerHTML = '<span></span><button type="button" class="underline text-blue-300 hover:text-blue-200" onclick="S.undoBulkFill(); var p=document.getElementById(\'bulk-fill-toast\'); if(p) p.remove();">Undo</button>';
      t.firstChild.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () {
        if (!t.parentNode) return;
        t.style.opacity = '0';
        t.style.transition = 'opacity 0.4s';
        setTimeout(function () { t.remove(); }, 400);
      }, 5000);
    }

    // Seed the input's committed numeric value with the midpoint BEFORE the
    // browser's spinner/keyboard logic reads it. Runs on mousedown (spinner
    // click) and keydown (arrow keys) — both fire before the value changes.
    function _primeOverrideFromMidpoint(i) {
      if (studentGrades[i].override !== null) return false;
      const grade = studentGrades[i].grade;
      if (!grade) return false;
      const row = scoreResult && scoreResult.rows && scoreResult.rows[i];
      if (!row || row.midpoint == null) return false;
      const el = document.getElementById('override-' + i);
      if (!el || el.value !== '') return false;
      el.value = row.midpoint;
      studentGrades[i].override = row.midpoint;
      studentGrades[i].overrideManual = false;
      return true;
    }

    function onOverridePrime(i) {
      _primeOverrideFromMidpoint(i);
    }

    function onOverrideKeydown(i, ev) {
      if (ev && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
        _primeOverrideFromMidpoint(i);
      }
    }

    function onOverrideFocus(i) {
      // Kept for backwards compatibility; priming now happens on mousedown/keydown.
      // Do not populate on focus alone — tabbing into the field shouldn't commit a value.
      onGradeRowReviewed(i);
    }

    // First-touch review marker: clears bulk-fill flag on a row when the marker
    // opens that row's grade dropdown or override field. The grade itself is preserved;
    // only the "not yet reviewed" chip is cleared.
    function onGradeRowReviewed(i) {
      const g = studentGrades && studentGrades[i];
      if (!g) return;
      if (g.autoFilled) {
        g.autoFilled = false;
        _refreshAutoPill(i);
        refreshStatusChips();
      }
    }

    function onOverrideChange(i) {
      const parsed = parseOptionalNumber(document.getElementById('override-' + i).value);
      studentGrades[i].override = parsed;
      studentGrades[i].overrideManual = parsed !== null;
      recalculate();
    }

    function onStudentChange() {
      updateFeedback(); refreshStickySummary(); refreshAIInputChips();
      if (focusMode) focusRefreshStudentName();
      updateMarkingAs();   // FK-33: keep the topbar "Marking as" readout in sync with the tutor field
    }

    /* ── FK-33: shared-machine tutor safety ──────────────────────
       The Tutor field persists between students (advertised convenience) and,
       while there's unsaved work, into the on-device draft. On shared/lab
       machines that risks the next marker silently working under the previous
       tutor's name. These helpers surface the current marker and let a new one
       take over cleanly. Cohort records (layer 3) intentionally keep `tutor`. */
    function updateMarkingAs() {
      const ti = el('student-tutor');
      const out = el('marking-as-name');
      if (!out) return;
      const t = ti ? (ti.value || '').trim() : '';
      out.textContent = t || 'not set';
      out.classList.toggle('text-slate-500', !t);   // muted when unset (AA on white: #64748b ≥4.5:1)
      out.classList.toggle('text-slate-700', !!t);
    }
    function switchTutor() {
      const ti = el('student-tutor');
      if (ti) { ti.value = ''; ti.dispatchEvent(new Event('input')); }  // fires onStudentChange + draft autosave reschedule
      if (!_sessionHasUnsavedWork()) clearDraft();   // no work in progress → drop any stale draft so it can't be resumed by the next marker
      updateMarkingAs();
      if (ti) ti.focus();
    }
    function applyClearTutorSetting() {
      const cb = el('setting-clear-tutor');
      if (cb) cb.checked = !!getSetting('clearTutorBetweenStudents', false);
    }
    function setClearTutorBetweenStudents(on) {
      setSetting('clearTutorBetweenStudents', !!on);
      applyClearTutorSetting();
    }

    /* ── Grade-override helpers ──────────────────────────── */
    function _activeGradeScale() {
      return (config && Array.isArray(config.gradeScale) && config.gradeScale.length)
        ? config.gradeScale.map(g => g.grade)
        : SA.GRADES;
    }
    // Normalise common typing variants: trim, uppercase, en/em-dash → hyphen, strip spaces.
    function normaliseGradeInput(raw) {
      return String(raw || '')
        .replace(/[\u2010-\u2015\u2212]/g, '-')   // hyphens, dashes, minus → '-'
        .replace(/\s+/g, '')
        .trim()
        .toUpperCase();
    }
    // VALIDATION CONVENTION (FK-13 / INS-8): the overall grade override is a
    // HARD INVALID — an off-scale value sets aria-invalid='true' below and is
    // not applied. This is intentionally different from the per-criterion
    // override inputs in recalculate(), where out-of-band is a SOFT WARNING
    // (aria-invalid stays 'false'). Keep the two models distinct; do not flatten.
    function _renderOverrideStatus() {
      const inp = document.getElementById('grade-override');
      const out = document.getElementById('grade-override-status');
      if (!inp || !out) return;
      const raw = inp.value;
      const norm = normaliseGradeInput(raw);
      inp.classList.remove('out-of-band');
      inp.style.borderColor = '';
      if (!raw) {
        out.className = 'text-xs text-slate-600';
        out.innerHTML = 'Overrides the <em>overall</em> calculated grade. Leave blank to use the weighted result.';
        inp.setAttribute('aria-invalid', 'false');
        return;
      }
      const scale = _activeGradeScale();
      if (scale.includes(norm)) {
        inp.value = norm;  // reflect normalisation back to user
        inp.style.borderColor = '#16a34a';
        out.className = 'text-xs text-emerald-600 font-medium';
        out.textContent = '✓ Override applied: ' + norm;
        inp.setAttribute('aria-invalid', 'false');
      } else {
        inp.style.borderColor = '#dc2626';
        out.className = 'text-xs text-red-600';
        out.textContent = 'Not in this rubric’s grade scale. Valid: ' + scale.join(', ');
        inp.setAttribute('aria-invalid', 'true');
      }
    }
    function onOverrideGrade() {
      // Block override if a fail-grade late penalty is currently active.
      const sel = document.getElementById('late-penalty-select');
      const idx = parseInt(sel ? sel.value : '0', 10);
      const lp  = (config && config.latePenalties && config.latePenalties[idx]) || null;
      const ovrInput = el('grade-override');
      if (lp && lp.fail && ovrInput && ovrInput.value.trim()) {
        const out = el('grade-override-status');
        ovrInput.style.borderColor = '#dc2626';
        if (out) {
          out.className = 'text-xs text-red-600';
          out.textContent = 'Cannot override — current late penalty results in an automatic fail. Change the penalty first if you want to award a different grade.';
        }
        recalculate();
        return;
      }
      _renderOverrideStatus();
      recalculate();
    }

    // Late-penalty change handler — clears any active grade override if the
    // selected penalty results in an automatic fail (per university policy).
    function onPenaltyChange() {
      const sel = document.getElementById('late-penalty-select');
      const idx = parseInt(sel.value || '0', 10);
      const lp  = (config && config.latePenalties && config.latePenalties[idx]) || null;
      const ovrInput = el('grade-override');
      const banner   = el('penalty-override-conflict');
      const bannerTx = el('penalty-override-conflict-text');
      // Hide banner by default each time this fires
      banner.classList.add('hidden');
      if (lp && lp.fail && ovrInput && ovrInput.value.trim()) {
        const removed = ovrInput.value.trim().toUpperCase();
        ovrInput.value = '';
        // Reset border/status
        ovrInput.style.borderColor = '';
        const out = el('grade-override-status');
        if (out) {
          out.className = 'text-xs text-slate-600';
          out.innerHTML = 'Overrides the <em>overall</em> calculated grade. Leave blank to use the weighted result.';
        }
        bannerTx.textContent = ' Late penalty results in a fail grade, so the previous override (' + removed + ') was cleared. Re-enter it if you want to award a non-fail grade despite lateness.';
        banner.classList.remove('hidden');
      }
      recalculate();
    }
    function _setOverridePlaceholder() {
      const inp = document.getElementById('grade-override');
      if (!inp) return;
      const scale = _activeGradeScale();
      // Pick a mid-scale example if available, else first.
      const example = scale[Math.floor(scale.length / 2)] || scale[0] || '';
      if (example) inp.placeholder = 'e.g. ' + example;
    }

    /* ── Recalculate ─────────────────────────────────────── */
    // FK-09 boundary adapter: ALL scoring inputs the engine consumes are
    // gathered here, in one place, and nowhere else in the score path.
    // The two DOM-as-state inputs (INS-3: penalty select, letter-override
    // input) live only in the DOM until save — this function is the single
    // bridge. recalculate() and any future headless caller consume the
    // returned object; nothing between here and the SA.* engine calls
    // touches the DOM for input.
    function readScoringInputs() {
      return {
        studentGrades: studentGrades,
        latePenaltyIdx: parseInt(document.getElementById('late-penalty-select').value || '0', 10),
        overrideGrade: normaliseGradeInput(el('grade-override').value)
      };
    }

    // FK-13 (WCAG 2.1 AA 4.1.3 Status Messages): debounced, de-duplicated
    // announcer for the recomputed result. The visible weighted-total / grade
    // cells are written with plain textContent outside any live region, so a
    // screen-reader user changing a grade would otherwise hear nothing about
    // the outcome. Debounced so rapid successive recalculations announce only
    // the settled result, not every intermediate keystroke.
    let _scoreAnnounceTimer = null;
    let _lastScoreAnnouncement = '';
    function _announceScoreResult(msg) {
      const liveEl = el('score-result-live');
      if (!liveEl) return;
      if (msg === _lastScoreAnnouncement) return;   // suppress chatty repeats
      _lastScoreAnnouncement = msg;
      if (_scoreAnnounceTimer) clearTimeout(_scoreAnnounceTimer);
      if (!msg) { liveEl.textContent = ''; return; }
      _scoreAnnounceTimer = setTimeout(function () {
        liveEl.textContent = '';     // clear first so an unchanged string still re-announces
        liveEl.textContent = msg;
      }, 500);
    }

    function recalculate() {
      const inputs   = readScoringInputs();
      latePenaltyIdx = inputs.latePenaltyIdx;
      scoreResult    = SA.computeScores(config, inputs.studentGrades, inputs.latePenaltyIdx);

      // Apply marker grade override (snaps total UP to band minimum of new grade).
      // Per-criterion rows always come from the original scoreResult.
      const effective = SA.applyGradeOverride(config, scoreResult, inputs.overrideGrade);
      const { rows } = scoreResult;
      const { weightedTotal, penalisedScore, suggestedGrade, latePenalty, isFail } = effective;

      // Update row cells
      let weightSum = 0;
      rows.forEach((row, i) => {
        const TIER_COLOURS = {
          excellent:      'bg-blue-200 text-blue-900 ring-1 ring-blue-300',
          proficient:     'bg-green-200 text-green-900 ring-1 ring-green-300',
          developing:     'bg-amber-200 text-amber-900 ring-1 ring-amber-300',
          satisfactory:   'bg-orange-200 text-orange-900 ring-1 ring-orange-300',
          unsatisfactory: 'bg-red-200 text-red-900 ring-1 ring-red-300'
        };
        if (row.grade) {
          weightSum += row.criterion.weight;
          el('midpoint-' + i).textContent   = SA.formatScore(row.midpoint, _displayRounding);
          el('final-score-' + i).textContent = SA.formatScore(row.finalScore, _displayRounding);
          el('weighted-' + i).textContent    = SA.formatScore(row.weightedScore, _displayRounding);
          el('tier-' + i).textContent      = row.tier ? SA.getTierLabel(config, row.tier) : '';
          el('tier-' + i).className        = 'tier-pill ' + (TIER_COLOURS[row.tier] || '');

          // Check override band
          const overInp = el('override-' + i);
          if (row.override !== null) {
            // Use config.gradeScale band if available, otherwise fall back to midpoint ±6
            const scaleEntry = config.gradeScale
              ? config.gradeScale.find(g => g.grade === row.grade)
              : null;
            const bandLow  = scaleEntry ? scaleEntry.bandLow  : (SA.GRADE_MIDPOINTS[row.grade] - 6);
            const bandHigh = scaleEntry ? scaleEntry.bandHigh : (SA.GRADE_MIDPOINTS[row.grade] + 6);
            const oob = row.override < bandLow || row.override > bandHigh;
            // VALIDATION CONVENTION (FK-13 / INS-8) — DELIBERATE, do not "fix":
            // a per-criterion override outside the grade band is a SOFT WARNING,
            // not an error. It is surfaced visually via the `.out-of-band` class
            // only; aria-invalid stays 'false' because the value is still
            // accepted and scored. Contrast the overall #grade-override, which is
            // a HARD INVALID (aria-invalid='true' when off-scale) in
            // _renderOverrideStatus — that input rejects out-of-scale values.
            overInp.className = 'override-input' + (oob ? ' out-of-band' : '');
            overInp.setAttribute('aria-invalid', 'false');
          } else {
            overInp.className = 'override-input';
            overInp.setAttribute('aria-invalid', 'false');
          }
        } else {
          el('midpoint-' + i).textContent  = '—';
          el('final-score-' + i).textContent = '—';
          el('weighted-' + i).textContent  = '—';
          el('tier-' + i).textContent      = '';
          el('tier-' + i).className        = 'tier-pill';
        }
      });

      // Weight check
      const wOk = Math.round(weightSum) === 100 || weightSum === 0;
      const displayWeightSum = Number.isInteger(weightSum) ? weightSum : parseFloat(weightSum.toFixed(2));
      el('weight-check-cell').innerHTML = weightSum === 0
        ? '<span class="text-slate-600">No grades selected yet</span>'
        : `<span class="${Math.round(weightSum) === 100 ? 'text-green-600' : 'text-amber-600'}">${Math.round(weightSum) === 100 ? '✓' : '⚠'} Graded criteria: ${displayWeightSum}%</span>`;

      const hasGrades = scoreResult.rows.some(r => r.grade);
      el('weighted-total-cell').textContent = hasGrades ? SA.formatScore(weightedTotal, _displayRounding) + ' / 100' : '';

      // Grade display
      el('penalised-score-display').textContent = isFail ? '0' : (hasGrades ? SA.formatScore(penalisedScore, _displayRounding) : '–');
      const gradeBadge = el('grade-display');
      const _prevGradeText = gradeBadge.textContent; // FK-38: capture before reassignment for grade-change-only pop
      gradeBadge.textContent = (hasGrades || isFail) ? suggestedGrade : '–';

      const tierColourMap = {
        excellent: 'bg-green-100 text-green-800',
        proficient: 'bg-blue-100 text-blue-800',
        developing: 'bg-yellow-100 text-yellow-800',
        satisfactory: 'bg-orange-100 text-orange-800',
        unsatisfactory: 'bg-red-100 text-red-800'
      };
      const gradeColours = {};
      (config.gradeScale || []).forEach(g => {
        gradeColours[g.grade] = tierColourMap[g.tier] || 'bg-slate-100 text-slate-600';
      });
      // Fallback static map for configs without gradeScale
      if (!config.gradeScale) Object.assign(gradeColours, {
        'A+': 'bg-green-100 text-green-800', 'A': 'bg-green-100 text-green-800',
        'A-': 'bg-green-100 text-green-800', 'B+': 'bg-blue-100 text-blue-800',
        'B':  'bg-blue-100 text-blue-800',   'B-': 'bg-blue-100 text-blue-800',
        'C+': 'bg-yellow-100 text-yellow-800','C': 'bg-yellow-100 text-yellow-800',
        'C-': 'bg-yellow-100 text-yellow-800','D':  'bg-red-100 text-red-800'
      });
      gradeBadge.className = 'grade-badge text-2xl px-4 py-1 ' + (gradeColours[suggestedGrade] || 'bg-slate-100 text-slate-600');
      // FK-38: the className reassignment above wipes any prior `.updated`, so a
      // wholesale reset on every recompute can't accumulate. Re-add it only when
      // the displayed grade letter actually changed (not on same-grade keystrokes),
      // and remove it once the one-shot animation ends.
      const _newGradeText = gradeBadge.textContent;
      if (_newGradeText !== _prevGradeText && _newGradeText !== '–') {
        gradeBadge.classList.add('updated');
        gradeBadge.addEventListener('animationend', function _clearPop() {
          gradeBadge.classList.remove('updated');
          gradeBadge.removeEventListener('animationend', _clearPop);
        });
      }

      // FK-13: announce the recomputed result to assistive tech (4.1.3).
      if (hasGrades || isFail) {
        const _resultBand = (config.gradeScale || []).find(g => g.grade === suggestedGrade);
        const _bandLabel  = _resultBand ? SA.getTierLabel(config, _resultBand.tier) : '';
        let _msg = isFail
          ? 'Result: fail. Score 0 out of 100. Grade ' + suggestedGrade + '.'
          : 'Score ' + SA.formatScore(penalisedScore, _displayRounding) + ' out of 100. Grade ' +
            suggestedGrade + (_bandLabel ? ' (' + _bandLabel + ')' : '') + '.';
        if (latePenalty && latePenalty.deduction > 0 && !isFail) _msg += ' Late penalty applied.';
        if (effective.override) _msg += ' Marker override in effect.';
        _announceScoreResult(_msg);
      } else {
        _announceScoreResult('');
      }

      // FK-21: debounced draft autosave (grade / penalty / override edits all
      // flow through recalculate(); free-text fields wire their own listeners).
      _scheduleDraftSave();

      // Override + non-fail penalty info note
      const infoNote = el('penalty-override-info');
      if (infoNote) {
        const hasOverride = !!(effective.override);
        const hasPenalty  = !!(latePenalty && latePenalty.deduction > 0 && !isFail);
        if (hasOverride && hasPenalty) infoNote.classList.remove('hidden');
        else infoNote.classList.add('hidden');
      }

      // Override audit badge
      const auditBox  = el('override-audit');
      const auditText = el('override-audit-text');
      if (effective.override && effective.override.snapped) {
        const o = effective.override;
        auditText.textContent = 'You set the grade to ' + o.newGrade
          + ' (was ' + o.originalGrade + ' at ' + SA.formatScore(o.originalTotal, _displayRounding) + '). '
          + 'Feedback Kitchen lifted the score to ' + SA.formatScore(o.newTotal, _displayRounding)
          + ' — the band minimum for ' + o.newGrade + '. Just letting you know.';
        auditBox.classList.remove('hidden');
      } else if (effective.override) {
        // Letter-only override (already at or above band min — no snap needed)
        const o = effective.override;
        auditText.textContent = 'You set the grade to ' + o.newGrade
          + ' (was ' + o.originalGrade + '). Feedback Kitchen kept your score — just letting you know.';
        auditBox.classList.remove('hidden');
      } else {
        auditBox.classList.add('hidden');
      }

      // Print cells
      el('print-penalty-label').textContent   = latePenalty ? latePenalty.label : 'None';
      el('print-weighted-score').textContent  = hasGrades ? SA.formatScore(weightedTotal, _displayRounding) : '–';
      el('print-penalised-score').textContent = isFail ? '0' : (hasGrades ? SA.formatScore(penalisedScore, _displayRounding) : '–');
      el('print-grade').textContent           = (hasGrades || isFail) ? suggestedGrade : '–';

      updateFeedback();
      refreshStatusChips();
      refreshAIInputChips();

      // Keep the focus card in sync with changes that originate elsewhere
      // (bulk-fill, section-C grade override, new student, draft resume).
      // Skip when a focus text-entry field is active so we don't fight the caret —
      // those paths refresh their own readouts.
      if (focusMode) {
        const a = document.activeElement;
        const id = a && a.id;
        if (id !== 'focus-override' && id !== 'focus-body') focusRenderCard();
        // FK-14: an override edit regenerates the draft's score lines without a
        // card re-render — keep the pane's counts/mirror current even on the
        // caret-preserving skip path (focus-body writes refresh it themselves).
        else if (id === 'focus-override') focusRefreshDraftPane();
      }
    }

    /* ── Feedback generation ─────────────────────────────── */
    function updateFeedback() {
      if (!scoreResult || !scoreResult.rows.some(r => r.grade)) {
        el('feedback-text').value = '';
        lastGeneratedText = '';
        lastScoreResult = null;
        refreshStickySummary();
        return;
      }

      // Check for grade override — snaps total to band min of new grade.
      const overrideRaw  = normaliseGradeInput(el('grade-override').value);
      const effectiveRes = SA.applyGradeOverride(config, scoreResult, overrideRaw);

      const name  = el('student-name').value.trim();
      const header = name ? `Hi ${name},\n\n` : '';
      const newGeneratedText = header + SA.generateFeedbackText(config, effectiveRes, {
        studentName:    name,
        audienceMode:   getAudienceMode(),
        groupName:      getGroupName(),
        introOverride:  getIntroOverride(),
        outroOverride:  getOutroOverride()
      });

      const ta = el('feedback-text');
      const currentText = ta.value;

      // If no previous state, or text is untouched, or text is empty
      if (!lastScoreResult || currentText === lastGeneratedText || currentText.trim() === "") {
        ta.value = newGeneratedText;
        lastGeneratedText = newGeneratedText;
        lastScoreResult = effectiveRes;
        lastConfig = JSON.parse(JSON.stringify(config));
        refreshStickySummary();
        return;
      }

      // --- MERGE LOGIC ---
      // The user has manually edited the textarea. We attempt to safely replace only the parts that changed.
      let mergedText = currentText;
      const rounding = config.scoreRounding || 'none';
      const oldRounding = lastConfig.scoreRounding || 'none';

      // 1. Update Intro/Outro based on overall grade
      const oldGrade = lastScoreResult.suggestedGrade;
      const newGrade = effectiveRes.suggestedGrade;
      if (oldGrade !== newGrade) {
        const oldEntry = lastConfig.gradeFeedback.find(gf => gf.grade === oldGrade);
        const newEntry = config.gradeFeedback.find(gf => gf.grade === newGrade);
        if (oldEntry && newEntry) {
          if (oldEntry.intro && mergedText.includes(oldEntry.intro)) {
            mergedText = mergedText.replace(oldEntry.intro, newEntry.intro);
          }
          if (oldEntry.outro && mergedText.includes(oldEntry.outro)) {
            mergedText = mergedText.replace(oldEntry.outro, newEntry.outro);
          }
        }
      }

      // 2. Update Criteria
      for (let i = 0; i < effectiveRes.rows.length; i++) {
        const newRow = effectiveRes.rows[i];
        const oldRow = lastScoreResult.rows[i];

        if (!newRow.grade && !oldRow.grade) continue;

        const newWs = SA.formatScore(newRow.weightedScore, rounding);
        const newHeader = `${newRow.criterion.name} – ${newWs} / ${newRow.criterion.weight}`;

        if (!oldRow.grade && newRow.grade) {
          // Newly graded criterion
          const newBlock = `${newHeader}\n${newRow.descriptor || ''}\n\n`;
          const totalIdx = mergedText.indexOf('TOTAL SCORE:');
          if (totalIdx !== -1) {
            mergedText = mergedText.slice(0, totalIdx) + newBlock + mergedText.slice(totalIdx);
          } else {
            mergedText += '\n' + newBlock;
          }
        } else if (oldRow.grade && newRow.grade) {
          // Update header
          const oldWs = SA.formatScore(oldRow.weightedScore, oldRounding);
          const oldHeader = `${oldRow.criterion.name} – ${oldWs} / ${oldRow.criterion.weight}`;
          if (mergedText.includes(oldHeader)) {
            mergedText = mergedText.replace(oldHeader, newHeader);
          }

          // Update descriptor
          if (oldRow.descriptor !== newRow.descriptor) {
            if (oldRow.descriptor && mergedText.includes(oldRow.descriptor)) {
              mergedText = mergedText.replace(oldRow.descriptor, newRow.descriptor || '');
            }
          }
        } else if (oldRow.grade && !newRow.grade) {
          // Grade removed
          const oldWs = SA.formatScore(oldRow.weightedScore, oldRounding);
          const oldHeader = `${oldRow.criterion.name} – ${oldWs} / ${oldRow.criterion.weight}`;
          if (mergedText.includes(oldHeader)) {
            mergedText = mergedText.replace(oldHeader + '\n', '');
          }
          if (oldRow.descriptor && mergedText.includes(oldRow.descriptor)) {
            mergedText = mergedText.replace(oldRow.descriptor + '\n\n', '');
          }
        }
      }

      // 3. Update Total Score
      const oldTotalStr = `TOTAL SCORE: ${SA.formatScore(lastScoreResult.weightedTotal, oldRounding)} / 100`;
      const newTotalStr = `TOTAL SCORE: ${SA.formatScore(effectiveRes.weightedTotal, rounding)} / 100`;
      if (mergedText.includes(oldTotalStr)) {
        mergedText = mergedText.replace(oldTotalStr, newTotalStr);
      }

      // 4. Update Penalty
      let oldPenaltyStr = '';
      if (lastScoreResult.latePenalty && (lastScoreResult.deduction > 0 || lastScoreResult.isFail)) {
          const item = lastConfig.assessmentTitle || 'submission';
          if (lastScoreResult.isFail) {
            const failGrade = lastConfig.gradeScale ? lastConfig.gradeScale[lastConfig.gradeScale.length - 1].grade : 'D';
            oldPenaltyStr = `LATE SUBMISSION NOTICE: This ${item} was submitted more than 3 days late and receives a grade of ${failGrade} as per university policy.\nFINAL SCORE (after late penalty): 0 / 100`;
          } else {
            oldPenaltyStr = `LATE SUBMISSION NOTICE: As your ${item} was submitted ${lastScoreResult.latePenalty.label.toLowerCase()}, a further ${lastScoreResult.deduction}% (out of 100%) has been deducted from the total above.\nFINAL SCORE (after late penalty): ${SA.formatScore(lastScoreResult.penalisedScore, oldRounding)} / 100`;
          }
      }

      let newPenaltyStr = '';
      if (effectiveRes.latePenalty && (effectiveRes.deduction > 0 || effectiveRes.isFail)) {
          const item = config.assessmentTitle || 'submission';
          if (effectiveRes.isFail) {
            const failGrade = config.gradeScale ? config.gradeScale[config.gradeScale.length - 1].grade : 'D';
            newPenaltyStr = `LATE SUBMISSION NOTICE: This ${item} was submitted more than 3 days late and receives a grade of ${failGrade} as per university policy.\nFINAL SCORE (after late penalty): 0 / 100`;
          } else {
            newPenaltyStr = `LATE SUBMISSION NOTICE: As your ${item} was submitted ${effectiveRes.latePenalty.label.toLowerCase()}, a further ${effectiveRes.deduction}% (out of 100%) has been deducted from the total above.\nFINAL SCORE (after late penalty): ${SA.formatScore(effectiveRes.penalisedScore, rounding)} / 100`;
          }
      }

      if (oldPenaltyStr !== newPenaltyStr) {
          if (oldPenaltyStr && mergedText.includes(oldPenaltyStr)) {
              mergedText = mergedText.replace(oldPenaltyStr, newPenaltyStr);
          } else if (newPenaltyStr && !oldPenaltyStr) {
              mergedText += '\n\n' + newPenaltyStr;
          }
      }

      ta.value = mergedText;
      lastGeneratedText = newGeneratedText;
      lastScoreResult = effectiveRes;
      lastConfig = JSON.parse(JSON.stringify(config));
      refreshStickySummary();
    }

    /* ── Focus mode ──────────────────────────────────────────
       A criterion-by-criterion workspace that pairs the grade controls and the
       matching feedback block for ONE criterion, so markers stop scrolling between
       the rubric table (B) and the feedback draft (D). It is a pure view layer:
       grade/override edits delegate to the hidden table inputs and the existing
       recalculate()/updateFeedback() pipeline; feedback edits are spliced back into
       the single #feedback-text draft (the one source of truth). No parallel model. */

    function toggleFocusMode() { applyFocusMode(!focusMode); }

    function applyFocusMode(on) {
      focusMode = !!on;
      const app = document.getElementById('app');
      if (app) app.classList.toggle('fk-focus-on', focusMode);
      const btn = document.getElementById('focus-toggle');
      if (btn) {
        btn.classList.toggle('is-on', focusMode);
        btn.setAttribute('aria-pressed', focusMode ? 'true' : 'false');
      }
      try { localStorage.setItem(FK_FOCUS_KEY, focusMode ? '1' : '0'); } catch (e) { /* private mode */ }
      // Penalty & grade override: collapse on enter only when no penalty controls need
      // to stay accessible. When late penalties are enabled the section stays open so the
      // marker can adjust without leaving focus mode. Always restore on exit.
      const secAdj = document.getElementById('sec-adjust');
      const hasPenalties = config && config.enableLatePenalties;
      if (focusMode) {
        _focusSavedAdjOpen = secAdj ? secAdj.open : false;
        if (secAdj && !hasPenalties) secAdj.open = false;
        // Clamp index in case the criteria count changed.
        const n = (config && config.criteria) ? config.criteria.length : 0;
        if (focusIdx >= n) focusIdx = Math.max(0, n - 1);
        focusRenderCard();
        const ws = document.getElementById('focus-workspace');
        if (ws && ws.scrollIntoView) ws.scrollIntoView({ block: 'start', behavior: 'auto' });
      } else {
        if (secAdj) secAdj.open = !!_focusSavedAdjOpen;
        // FK-14: re-collapse the draft pane so every focus-mode entry starts
        // from the low-noise default (the pane being open is a per-look choice,
        // not a persisted preference — see BOARD.md FK-14 risk note).
        const pane = document.getElementById('focus-draft-pane');
        if (pane) pane.open = false;
      }
    }

    // Read-only mirror of the section-A student name in the focus header.
    // Focus mode never writes student data — it only reads it (no second edit surface).
    function focusRefreshStudentName() {
      const out = el('focus-student');
      if (!out) return;
      const name = (el('student-name').value || '').trim();
      out.textContent = name || '(no name)';
    }

    function focusGoto(i) {
      const n = (config && config.criteria) ? config.criteria.length : 0;
      if (n === 0) return;
      focusIdx = Math.max(0, Math.min(n - 1, i));
      focusRenderCard();
    }
    // Set only when the user actively steps; consumed (and cleared) by the next render
    // so the live region can say which way they moved. Plain re-renders announce position only.
    let _focusNavDir = '';
    function focusPrev() { _focusNavDir = 'Previous'; focusGoto(focusIdx - 1); }
    function focusNext() { _focusNavDir = 'Next'; focusGoto(focusIdx + 1); }

    // Populate the focus card for the current criterion from live state.
    function focusRenderCard() {
      if (!config || !config.criteria || !config.criteria.length) return;
      const i = focusIdx;
      const c = config.criteria[i];
      const n = config.criteria.length;
      const row = scoreResult && scoreResult.rows ? scoreResult.rows[i] : null;
      const sg  = studentGrades[i] || {};

      const nameEl = el('focus-criterion-name');
      if (nameEl) nameEl.textContent = c.name;
      const wtEl = el('focus-criterion-weight');
      if (wtEl) wtEl.textContent = 'Weight ' + c.weight + '%';
      const progEl = el('focus-progress');
      if (progEl) progEl.textContent = 'Criterion ' + (i + 1) + ' of ' + n;
      focusRefreshStudentName();
      // Announce the criterion change to screen readers, including direction when stepping.
      const liveEl = el('focus-live');
      if (liveEl) {
        const dir = _focusNavDir ? _focusNavDir + ' — ' : '';
        liveEl.textContent = dir + 'Criterion ' + (i + 1) + ' of ' + n + ': ' + c.name + '.';
      }
      _focusNavDir = '';

      // Grade options mirror the rubric scale.
      const gradeOptions = config.gradeScale ? config.gradeScale.map(g => g.grade) : SA.GRADES;
      const gsel = el('focus-grade');
      if (gsel) {
        gsel.innerHTML = '<option value="">— Select —</option>'
          + gradeOptions.map(g => `<option value="${escHtml(g)}">${escHtml(g)}</option>`).join('');
        gsel.value = sg.grade || '';
      }
      const ov = el('focus-override');
      if (ov) ov.value = (sg.override == null ? '' : sg.override);

      // Score / tier readouts.
      const graded = !!(row && row.grade);
      setText('focus-score',    graded ? SA.formatScore(row.finalScore, _displayRounding) : '—');
      setText('focus-weighted', graded ? SA.formatScore(row.weightedScore, _displayRounding) : '—');
      const tierEl = el('focus-tier');
      if (tierEl) {
        tierEl.textContent = graded && row.tier ? SA.getTierLabel(config, row.tier) : '';
        tierEl.className = 'tier-pill';
      }

      // Feedback body for this criterion, pulled from the single source of truth.
      const body = el('focus-body');
      if (body) {
        if (graded) {
          body.disabled = false;
          body.value = focusGetBody(i);
          body.placeholder = 'Edit this criterion’s feedback.';
        } else {
          body.disabled = true;
          body.value = '';
          body.placeholder = 'Grade this criterion to generate its feedback, then edit here.';
        }
      }
      focusSetSaveChip('idle');

      // Nav button states.
      const prev = el('focus-prev'); if (prev) prev.disabled = (i === 0);
      const next = el('focus-next');
      if (next) {
        next.disabled = false;
        if (i === n - 1) {
          next.textContent = 'Copy feedback';
          next.title = 'Copy feedback to clipboard and save to cohort — end of rubric.';
          next.onclick = function () { S.copyFeedback(); };
        } else {
          next.textContent = 'Next →';
          next.title = 'Next criterion (Page Down)';
          next.onclick = function () { S.focusNext(); };
        }
      }

      // Keep the persistent draft pane (FK-14) in sync.
      focusRefreshDraftPane();
    }

    // Delegate a grade change to the hidden rubric row, then refresh the card.
    function focusOnGrade() {
      const gsel = el('focus-grade');
      if (!gsel) return;
      const tableSel = document.getElementById('grade-sel-' + focusIdx);
      if (tableSel) tableSel.value = gsel.value;
      onGradeRowReviewed(focusIdx);
      onGradeChange(focusIdx);   // → recalculate() → updateFeedback()
      focusRenderCard();
    }

    function focusOnOverride() {
      const ov = el('focus-override');
      if (!ov) return;
      const tableOv = document.getElementById('override-' + focusIdx);
      if (tableOv) tableOv.value = ov.value;
      onGradeRowReviewed(focusIdx);
      onOverrideChange(focusIdx);   // → recalculate() → updateFeedback()
      // Refresh score readouts but preserve the override field's caret (it is focused).
      const row = scoreResult && scoreResult.rows ? scoreResult.rows[focusIdx] : null;
      const graded = !!(row && row.grade);
      setText('focus-score',    graded ? SA.formatScore(row.finalScore, _displayRounding) : '—');
      setText('focus-weighted', graded ? SA.formatScore(row.weightedScore, _displayRounding) : '—');
    }

    // Mirror the normal-mode override priming behaviour: seed the visible focus-override
    // input with the grade-band midpoint before the spinner or arrow-key increments it,
    // so the starting point matches what the rubric table would show (not 0).
    function focusOnOverridePrime() {
      if (_primeOverrideFromMidpoint(focusIdx)) {
        const ov = el('focus-override');
        if (ov && ov.value === '') ov.value = studentGrades[focusIdx].override;
      }
    }

    function focusOnOverrideKeydown(ev) {
      if (ev && (ev.key === 'ArrowUp' || ev.key === 'ArrowDown')) {
        focusOnOverridePrime();
      }
    }

    // Write the edited body for criterion i back into the assembled draft.
    function focusOnBodyInput() {
      const body = el('focus-body');
      if (!body || body.disabled) return;
      focusWriteBody(focusIdx, body.value);
      focusSetSaveChip('saved');
    }

    function focusSetSaveChip(state) {
      const chip = el('focus-save-chip');
      if (!chip) return;
      if (state === 'saved') {
        chip.textContent = '✓ Saved to draft';
        chip.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700';
        chip.style.opacity = '1';
        clearTimeout(focusSetSaveChip._t);
        focusSetSaveChip._t = setTimeout(function () { chip.style.opacity = '0.45'; }, 1500);
      } else {
        chip.textContent = 'Idle';
        chip.className = 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600';
        chip.style.opacity = '1';
      }
    }

    // The assembled draft formats each graded criterion as:
    //   <name> – <weighted> / <weight>\n<descriptor lines...>\n\n
    // A header line ends with " / <number>". Requiring that trailing score (rather
    // than just an en-dash followed by a digit) stops an ordinary feedback line such
    // as "Provides 8 – 10 examples" from being mistaken for a header.
    function focusIsHeaderLine(line) {
      return / – -?\d[\d.]* \/ \d[\d.]*\s*$/.test(line);
    }

    // Locate criterion i's feedback block by POSITION among the graded criteria,
    // not by name — so duplicate criterion names can't collide on the wrong block.
    // The draft emits one block per graded row, in criteria order, so we count
    // header lines and take the one matching criterion i's graded position.
    function focusFindBlock(full, i) {
      const rows = scoreResult && scoreResult.rows;
      if (!rows || !rows[i] || !rows[i].grade) return null;   // ungraded → no block emitted
      let pos = 0;                                            // i's index among graded rows
      for (let k = 0; k < i; k++) { if (rows[k] && rows[k].grade) pos++; }

      const lines = full.split('\n');
      let seen = -1, headerIdx = -1;
      for (let k = 0; k < lines.length; k++) {
        if (lines[k].startsWith('TOTAL SCORE:')) break;      // blocks live above the total
        if (focusIsHeaderLine(lines[k])) {
          seen++;
          if (seen === pos) { headerIdx = k; break; }
        }
      }
      if (headerIdx === -1) return null;

      let endIdx = lines.length;
      for (let k = headerIdx + 1; k < lines.length; k++) {
        if (lines[k].startsWith('TOTAL SCORE:') || focusIsHeaderLine(lines[k])) { endIdx = k; break; }
      }
      return { lines, headerIdx, endIdx };
    }

    function focusGetBody(i) {
      const full = el('feedback-text').value || '';
      const blk = focusFindBlock(full, i);
      if (!blk) return '';
      return blk.lines.slice(blk.headerIdx + 1, blk.endIdx).join('\n').replace(/^\n+|\n+$/g, '');
    }

    function focusWriteBody(i, text) {
      const ta = el('feedback-text');
      const full = ta.value || '';
      const blk = focusFindBlock(full, i);
      if (!blk) return;   // criterion not yet in the draft (ungraded) — nothing to write
      const before = blk.lines.slice(0, blk.headerIdx + 1);
      const after  = blk.lines.slice(blk.endIdx);
      const bodyLines = (text || '').replace(/^\n+|\n+$/g, '').split('\n');
      // Preserve the single blank-line separator the generator puts before the next block.
      const rebuilt = before.concat(bodyLines, [''], after).join('\n');
      ta.value = rebuilt;
      lastGeneratedText = rebuilt;   // keep merge logic from clobbering this manual edit
      refreshStickySummary();
      refreshStatusChips();
      // Live-update the persistent draft pane (FK-14) as the marker types.
      focusRefreshDraftPane(rebuilt);
    }

    // FK-14: refresh the persistent draft pane — live line/word counts in the
    // collapsed strip, tail preview of the criterion-blocks region, and the
    // read-only mirror. The tail is taken from above "TOTAL SCORE:" because the
    // lines below it (total + outro) are static once generated — the accumulating
    // part the marker should glance at is the last criterion block written.
    // Cheap (string split on a few-KB draft), so it runs on every draft write.
    function focusRefreshDraftPane(fullText) {
      const pane = el('focus-draft-pane');
      if (!pane) return;
      const full = (fullText != null) ? fullText : (el('feedback-text').value || '');
      const trimmed = full.trim();
      const statsEl = el('focus-draft-stats');
      const tailEl = el('focus-draft-tail');
      if (!trimmed) {
        if (statsEl) statsEl.textContent = 'empty';
        if (tailEl) tailEl.textContent = 'Nothing drafted yet — grade a criterion to start.';
      } else {
        const lines = trimmed.split('\n');
        const nonEmpty = lines.filter(function (l) { return l.trim(); });
        if (statsEl) {
          statsEl.textContent = nonEmpty.length + (nonEmpty.length === 1 ? ' line · ' : ' lines · ')
            + trimmed.split(/\s+/).length + ' words';
        }
        if (tailEl) {
          let cut = lines.length;
          for (let k = 0; k < lines.length; k++) {
            if (lines[k].startsWith('TOTAL SCORE:')) { cut = k; break; }
          }
          let tail = '';
          for (let k = cut - 1; k >= 0; k--) {
            if (lines[k].trim()) { tail = lines[k].trim(); break; }
          }
          tailEl.textContent = tail ? '…' + tail : '';
        }
      }
      // Mirror unconditionally (not just when open) so expanding the pane never
      // shows stale text and needs no toggle handler.
      const mirror = el('focus-full-draft-text');
      if (mirror) mirror.value = full;
    }

    function regenerateFeedback() {
      if (!scoreResult || !scoreResult.rows.some(r => r.grade)) return;
      if (confirm('This will discard any manual edits you have made to the feedback text. Are you sure?')) {
        lastGeneratedText = '';
        lastScoreResult = null; // Force full-replace path in updateFeedback()
        updateFeedback();
      }
    }

    /* ── Copy feedback ───────────────────────────────────── */
    function copyFeedback() {
      const ta = el('feedback-text');
      if (!ta.value.trim()) { alert('No feedback to copy — please grade at least one criterion first.'); return; }
      navigator.clipboard.writeText(ta.value).then(() => {
        const btn = document.querySelector('[onclick="S.copyFeedback()"]');
        if (btn) { const orig = btn.textContent; btn.textContent = '✓ Copied!'; setTimeout(() => btn.textContent = orig, 2000); }
      }).catch(() => {
        ta.select(); document.execCommand('copy');
      });
      // Auto-add to cohort — check name/ID first so only one toast fires
      const _cpName = (el('student-name').value || '').trim();
      const _cpId   = (el('student-id').value   || '').trim();
      // Usage telemetry: one event per copy, flagged by whether the draft also
      // landed in the cohort — a copy with no name/ID is a different action
      // from a copy that completes a student. Counts only; the feedback text
      // and the student's name never leave the page.
      if (typeof gtag === 'function') {
        gtag('event', 'feedback_copied', {
          event_category: 'workflow',
          saved_to_cohort: !!(_cpName || _cpId)
        });
      }
      if (!_cpName && !_cpId) {
        showCohortToast('Feedback copied to clipboard · not saved to cohort — add a student name or ID', 'amber');
        return;
      }
      saveCurrentStudentToCohort({ silent: true });
      showCohortToast('Feedback copied to clipboard · added to cohort', 'green');
    }

    /* ── SheetJS lazy loader ─────────────────────────────── */
    function loadSheetJS(onReady) {
      if (window.XLSX) { onReady(); return; }
      const btns = document.querySelectorAll('.btn-finalise');
      const origLabels = Array.from(btns).map(function (b) { return b.innerHTML; });
      btns.forEach(function (b) { b.disabled = true; b.innerHTML = 'Loading…'; });
      if (sheetJSPromise) {
        sheetJSPromise
          .then(function () {
            btns.forEach(function (b, i) { b.disabled = false; b.innerHTML = origLabels[i]; });
            onReady();
          })
          .catch(function () {
            btns.forEach(function (b, i) { b.disabled = false; b.innerHTML = origLabels[i]; });
          });
        return;
      }
      sheetJSPromise = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = '/js/xlsx.full.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
      sheetJSPromise
        .then(function () {
          btns.forEach(function (b, i) { b.disabled = false; b.innerHTML = origLabels[i]; });
          onReady();
        })
        .catch(function (err) {
          sheetJSPromise = null;
          btns.forEach(function (b, i) { b.disabled = false; b.innerHTML = origLabels[i]; });
          console.warn('SheetJS failed to load:', err);
          alert('Could not load the Excel export library. Please check your connection and try again.');
        });
    }

    /* ── Excel download (single student) ─────────────────── */
    function downloadExcel() {
      if (!scoreResult || !scoreResult.rows.some(r => r.grade)) {
        alert('Please grade at least one criterion before downloading.'); return;
      }
      const student = {
        name:  el('student-name').value,
        id:    el('student-id').value,
        tutor: el('student-tutor').value
      };
      const feedbackText = el('feedback-text').value;
      const comments     = el('additional-comments').value;
      loadSheetJS(async function () {
        await SAExcel.exportToExcel(config, student, scoreResult, feedbackText, comments);
        // Also auto-add to cohort
        saveCurrentStudentToCohort({ silent: false });
      });
    }

    /* ── Cohort management ───────────────────────────────── */
    const COHORT_VERSION = '2.0';

    function ensureCohortInitialised(onReady) {
      if (!config || !config.id) { onReady && onReady(null); return; }
      let cohort = SA.getCohort(config.id);
      if (cohort) { onReady && onReady(cohort); return; }
      // Show first-use prompt
      showCohortSetupModal(function (label, multiMarker) {
        cohort = SA.initCohort(config.id, label, multiMarker);
        refreshCohortUI();
        onReady && onReady(cohort);
      });
    }

    function saveCurrentStudentToCohort(opts) {
      opts = opts || {};
      if (!scoreResult || !scoreResult.rows.some(r => r.grade)) return;
      const studentName = (el('student-name').value || '').trim();
      const studentId   = (el('student-id').value   || '').trim();
      if (!studentName && !studentId) {
        showCohortToast('Enter a student name or ID before saving to the cohort.', 'amber');
        return;
      }
      // Silent auto-save (Copy / Download): if the marker dismissed cohort setup
      // this session and no cohort exists yet, skip rather than re-popping the modal.
      if (opts.silent && !SA.getCohort(config.id) && _cohortSetupDismissedThisSession) {
        return;
      }
      ensureCohortInitialised(function (cohort) {
        if (!cohort) return;  // dismissed during silent save — no-op
        // Persist the overridden scoreResult so Excel exports reflect the marker bump.
        // FK-09: inputs come from the single boundary adapter, not ad-hoc DOM reads.
        const overrideRaw = readScoringInputs().overrideGrade;
        const effectiveForSave = SA.applyGradeOverride(config, scoreResult, overrideRaw);
        const record = {
          name:         studentName,
          studentId:    studentId,
          tutor:        (el('student-tutor').value || '').trim(),
          date:         (el('student-date').value || ''),
          grades:       JSON.parse(JSON.stringify(studentGrades || [])),
          penaltyIdx:   parseInt(el('late-penalty-select').value, 10) || 0,
          scoreResult:  cloneScoreResultForStorage(effectiveForSave),
          // FK-11: stamp the rubric version in force at save time, so the
          // moderation export can report per-record rubric provenance even if
          // the rubric is edited mid-cohort. Re-saving re-stamps (correct).
          rubricVersionHash: SA.rubricVersionHash(config),
          feedbackText: el('feedback-text').value || '',
          markerNotes:  el('additional-comments').value || '',
          overrideGrade: (el('grade-override').value || '').trim()
        };
        const result = SA.addToCohort(config.id, record);
        if (!result.saved) {
          // FK-24: distinguish a storage quota/write failure (data at risk)
          // from the benign "needs an identifier" case.
          const msg = (result.reason === 'quota' || result.reason === 'write-error')
            ? (result.message || 'Could not save — this browser’s storage is full. Export your cohort, then try again.')
            : 'Could not save — please add a name or student ID.';
          showCohortToast(msg, 'amber');
          return;
        }
        refreshCohortUI();
        _markSessionClean();
        clearDraft();   // FK-21: saved to cohort → in-progress draft no longer needed
        if (!opts.silent) {
          showCohortToast(
            (result.replaced ? 'Updated ' : 'Added ') + (studentName || studentId) +
            ' · ' + result.count + ' in cohort',
            'green'
          );
        }
        // FK-53: the only success signal this function has. It bails early three ways
        // (nothing graded, no name or ID, cohort setup dismissed) and the write itself
        // lands asynchronously inside ensureCohortInitialised, so a caller that needs to
        // know the record was actually stored — rather than that the call returned —
        // cannot use the return value. Reached only after result.saved.
        if (typeof opts.onSaved === 'function') opts.onSaved(result, record);
      });
    }

    /* ── Save & next student (FK-53) ─────────────────────────────
       Persisting a marked student is otherwise a side effect of two actions named
       for something else: copyFeedback() and downloadExcel(). The Moodle worksheet
       export reads the saved cohort record, never the clipboard, and silently skips
       any record with no marking (buildExportWorksheet, js/moodle-worksheet.js), so
       a marker who grades a student and moves on without pressing "Copy to
       clipboard" ships that student's row blank — invisible when it happens,
       invisible at export, visible only in Moodle after upload, if ever.

       This names the persistence step and supplies the missing progression in one
       control. It adds no persistence, navigation or export logic: the save is the
       existing saveCurrentStudentToCohort, the advance is the FK-27 pattern
       (loadCohortRecordIntoSession + scroll to top).

       Relabelling "Copy to clipboard" to something Moodle-shaped was considered and
       rejected: the clipboard write is the one part of copyFeedback() with no bearing
       on the exported file, so that name would teach a model which breaks the moment
       a marker uses the sticky-bar copy, the Excel path, or neither.

       Advance runs inside onSaved, never after the call returns. The save bails early
       three ways and completes asynchronously, so advancing on the straight-line
       return would move on from a student who was never stored — the very defect this
       closes. Saving first is also why there is no _sessionHasUnsavedWork() gate: by
       the time we advance, nothing is unsaved. */
    function saveAndNextStudent() {
      saveCurrentStudentToCohort({
        // Silent so the marker gets one combined message below, not "Added Ada" followed
        // immediately by "now marking Alan". The button only renders when a cohort with
        // unmarked records is open, so silent's dismissed-cohort skip path is unreachable here.
        silent: true,
        onSaved: function (result, record) {
          const savedName = (record && (record.name || record.studentId)) || 'this student';
          const M = window.FKMoodle;
          let nextKey = null;
          try {
            const cohort   = SA.getCohort(config && config.id);
            const students = (cohort && cohort.students) || [];
            const savedKey = (M && M.storeKey) ? M.storeKey(record.studentId, record.name) : null;
            if (M && M.nextUnmarkedKey) nextKey = M.nextUnmarkedKey(students, savedKey);
          } catch (e) { nextKey = null; }

          // Roster exhausted: end the run cleanly rather than advancing to nothing.
          if (!nextKey) {
            showCohortToast('Saved ' + savedName + ' · everyone in this cohort is now marked', 'green');
            refreshSaveNextVisibility();
            return;
          }

          let openedName = '';
          try {
            if (loadCohortRecordIntoSession(nextKey) !== false) {
              openedName = (el('student-name').value || '').trim();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          } catch (e) { /* leave the marker on the current pane */ }
          showCohortToast('Saved ' + savedName +
            (openedName ? ' · now marking ' + openedName : ''), 'green');
          refreshSaveNextVisibility();
        }
      });
    }

    /* Rendered only while the open cohort still holds someone to mark, so a marker with no
       cohort, or one who has finished the roster, never sees it. Inline display, not the
       `hidden` utility class: `.btn { display: inline-flex }` outranks `.hidden`, so toggling
       the class would apply it and hide nothing — the FK-49 defect, which shipped to
       production on three controls for exactly this reason. */
    function refreshSaveNextVisibility() {
      const btn = el('save-next-student');
      if (!btn) return;
      let show = false;
      try {
        const M = window.FKMoodle;
        const cohort   = SA.getCohort(config && config.id);
        const students = (cohort && cohort.students) || [];
        show = !!(M && M.nextUnmarkedKey && M.nextUnmarkedKey(students, null));
      } catch (e) { show = false; }
      // FK-55: one instance, in the sticky bar, which no mode hides — so this needs no
      // knowledge of the current mode and there is no second element to keep in step.
      btn.style.display = show ? '' : 'none';
    }

    // Strip functions / circular refs for safe localStorage storage
    function cloneScoreResultForStorage(sr) {
      if (!sr) return null;
      return {
        weightedTotal:   sr.weightedTotal,
        penalisedScore:  sr.penalisedScore,
        deduction:       sr.deduction,
        isFail:          !!sr.isFail,
        suggestedGrade:  sr.suggestedGrade,
        rawTotal:        sr.rawTotal,
        latePenalty:     sr.latePenalty ? {
          label: sr.latePenalty.label, deduction: sr.latePenalty.deduction, fail: !!sr.latePenalty.fail
        } : null,
        override:        sr.override ? {
          originalGrade:    sr.override.originalGrade,
          originalTotal:    sr.override.originalTotal,
          originalPenalised:sr.override.originalPenalised,
          newGrade:         sr.override.newGrade,
          newTotal:         sr.override.newTotal,
          newPenalised:     sr.override.newPenalised,
          bandMin:          sr.override.bandMin,
          snapped:          !!sr.override.snapped
        } : null,
        rows: (sr.rows || []).map(function (r) {
          return {
            criterion: r.criterion ? { name: r.criterion.name, weight: r.criterion.weight } : null,
            grade: r.grade, midpoint: r.midpoint, override: r.override,
            finalScore: r.finalScore, weightedScore: r.weightedScore,
            tier: r.tier, descriptor: r.descriptor
          };
        })
      };
    }

    function exportCohort() {
      const cohort = SA.getCohort(config.id);
      if (!cohort || !cohort.students.length) {
        alert('No students in the cohort yet. Grade at least one student and click Copy Feedback or Marker\'s Record to add them.');
        return;
      }
      loadSheetJS(async function () {
        const filename = await SAExcel.exportCohortToExcel(config, cohort);
        if (filename) showPostExportWipeModal(cohort.students.length, filename);
      });
    }

    function renameCohort() {
      const cohort = SA.getCohort(config.id);
      if (!cohort) { ensureCohortInitialised(function(){ refreshCohortUI(); }); return; }
      const next = prompt('Rename cohort label:', cohort.label || '');
      if (next === null) return;
      cohort.label = next.trim() || cohort.label;
      try {
        SA.saveCohort(cohort);
      } catch (e) {
        showCohortToast(e && e.message ? e.message : 'Could not rename — this browser’s storage may be full.', 'amber');
        return;
      }
      refreshCohortUI();
    }

    function confirmClearCohort() {
      const cohort = SA.getCohort(config.id);
      if (!cohort || !cohort.students.length) {
        SA.clearCohort(config.id);
        refreshCohortUI();
        return;
      }
      if (!confirm('Delete all ' + cohort.students.length + ' students from this cohort?\n\nThis cannot be undone. Make sure you have exported the cohort workbook first.')) return;
      if (!confirm('Final check — permanently delete ' + cohort.students.length + ' student record(s)?')) return;
      SA.clearCohort(config.id);
      refreshCohortUI();
      showCohortToast('Cohort cleared.', 'slate');
    }

    function viewCohortList() {
      const cohort = SA.getCohort(config.id);
      const body = el('cohort-list-body');
      const modal = el('cohort-list-modal');
      if (!body || !modal) return;
      if (!cohort || !cohort.students.length) {
        body.innerHTML = '<p class="text-sm text-slate-500 italic">No students saved yet.</p>';
      } else {
        body.innerHTML = '<div class="text-xs text-slate-600 mb-2">' + cohort.students.length + ' students · cohort "' + (cohort.label || '—') + '"</div>' +
          '<ul class="divide-y divide-slate-100">' +
          cohort.students.map(function (s, i) {
            const sr = s.scoreResult || {};
            const score = sr.penalisedScore != null ? SA.formatScore(sr.penalisedScore, config.scoreRounding || 'none') : '—';
            return '<li class="py-2 flex items-center justify-between gap-2 text-sm">' +
              '<div class="min-w-0 flex-1">' +
                '<div class="font-medium text-slate-700 truncate">' + (i + 1) + '. ' + escHtml(s.name || '(no name)') + (s.studentId ? ' <span class="text-slate-600">· ' + escHtml(s.studentId) + '</span>' : '') + '</div>' +
                '<div class="text-xs text-slate-600">' + escHtml(sr.suggestedGrade || '—') + ' · ' + score + '/100 · saved ' + (s.savedAt ? new Date(s.savedAt).toLocaleString('en-NZ') : '—') + '</div>' +
              '</div>' +
              '<button class="text-xs font-semibold text-indigo-600 hover:text-indigo-800" onclick="S.openCohortRecord(\'' + s.key.replace(/'/g, "\\'") + '\')" title="Load this record back into the marking session to review or edit. Re-saving updates it in place.">Open</button>' +
              '<button class="text-xs text-red-500 hover:text-red-700" onclick="S.removeCohortStudent(\'' + s.key.replace(/'/g, "\\'") + '\')">Remove</button>' +
            '</li>';
          }).join('') + '</ul>';
      }
      openModal('cohort-list-modal');
    }

    function removeCohortStudent(key) {
      if (!confirm('Remove this student from the cohort?')) return;
      SA.removeFromCohort(config.id, key);
      refreshCohortUI();
      viewCohortList();
    }

    /* ── Record re-entry (FK-07) ─────────────────────────────
       loadCohortRecordIntoSession is the inverse of
       saveCurrentStudentToCohort: it restores every field that function
       persists, then recalculates and cross-checks the recomputed totals
       against the stored scoreResult snapshot. Re-saving an opened record
       updates it in place via the same studentMatchKey upsert. */

    // Fingerprint of marker-entered session state. Used only to decide
    // whether opening a record needs an "unsaved work" confirmation.
    let _sessionCleanFingerprint = '';

    function _sessionFingerprint() {
      const v = id => { const x = el(id); return x ? x.value : ''; };
      return JSON.stringify({
        g: studentGrades,
        p: v('late-penalty-select') || '0',
        o: v('grade-override'),
        n: v('student-name'),
        i: v('student-id'),
        f: v('feedback-text'),
        m: v('additional-comments')
      });
    }

    function _markSessionClean() {
      _sessionCleanFingerprint = _sessionFingerprint();
    }

    // Unsaved work = at least one criterion graded AND something changed
    // since the last save / load / new-student reset.
    function _sessionHasUnsavedWork() {
      if (!(studentGrades || []).some(g => g && g.grade)) return false;
      return _sessionFingerprint() !== _sessionCleanFingerprint;
    }

    function loadCohortRecordIntoSession(key) {
      const cohort = SA.getCohort(config.id);
      const rec = cohort && (cohort.students || []).find(s => s.key === key);
      if (!rec) {
        showCohortToast('Could not find that record — it may have been removed.', 'amber');
        return false;
      }

      // Student fields (date restored as saved; tutor may differ from session)
      el('student-name').value  = rec.name || '';
      el('student-id').value    = rec.studentId || '';
      el('student-tutor').value = rec.tutor || '';
      updateMarkingAs();   // FK-33: reflect the opened record's tutor in the topbar readout
      if (rec.date) el('student-date').value = rec.date;

      // Grades: rebuild state array against the CURRENT criteria list, then
      // mirror into the table selects/override inputs. Extra saved rows are
      // dropped; missing rows stay ungraded (config may have changed).
      const savedGrades = rec.grades || [];
      studentGrades = config.criteria.map((_, i) => {
        const g = savedGrades[i] || {};
        return {
          grade: g.grade || '',
          override: (g.override == null ? null : g.override),
          overrideManual: !!g.overrideManual,
          autoFilled: !!g.autoFilled
        };
      });
      config.criteria.forEach((_, i) => {
        const sel = el('grade-sel-' + i);
        if (sel) sel.value = studentGrades[i].grade || '';
        const ovr = el('override-' + i);
        if (ovr) ovr.value = (studentGrades[i].override == null ? '' : studentGrades[i].override);
      });
      // FK-54: only warn about rubric drift for a record that was actually marked.
      // A Moodle-imported placeholder is seeded with identity only — buildCohortImport
      // deliberately writes no scoreResult and no grades — so savedGrades.length is 0
      // against N criteria and the bare length test fired every single time. Nothing had
      // changed and the record was never saved *from* marking, so the message was untrue,
      // and once FK-53/FK-55 let a marker advance through a roster it fired once per
      // student in every mode. A warning that cries wolf on every student trains markers
      // to dismiss the one case where the rubric genuinely did change mid-cohort, which is
      // the FK-11 / FK-25 signal this toast exists to carry.
      //
      // recordHasMarks, not `savedGrades.length &&`: it is the codebase's one definition of
      // marked-ness, already shared by the worksheet export and FK-53's nextUnmarkedKey, so
      // "was this marked?" cannot drift between them. It is also stricter where the two
      // disagree — a grades array holding no grade values reads as unmarked, where a length
      // test would see rows and fire. Fallback keeps the weaker length check rather than
      // the old unconditional fire, so a missing module degrades, never regresses.
      const _M = window.FKMoodle;
      const wasMarked = (_M && _M.recordHasMarks) ? _M.recordHasMarks(rec) : savedGrades.length > 0;
      if (wasMarked && savedGrades.length !== config.criteria.length) {
        showCohortToast('Rubric has changed since this record was saved — review each row.', 'amber');
      }
      _bulkFillSnapshot = null;
      const bulkSel = el('bulk-fill-grade');
      if (bulkSel) bulkSel.value = '';
      _refreshAllAutoPills();

      // Late penalty (positional index — clamp if the penalty list changed)
      let penaltyIdx = parseInt(rec.penaltyIdx, 10) || 0;
      if (penaltyIdx && !(config.latePenalties && config.latePenalties[penaltyIdx])) {
        showCohortToast('Saved late-penalty option no longer exists — penalty cleared. Re-apply if needed.', 'amber');
        penaltyIdx = 0;
      }
      el('late-penalty-select').value = String(penaltyIdx);

      // Overall letter override
      el('grade-override').value = rec.overrideGrade || '';
      _renderOverrideStatus();

      // Recalculate with the feedback-merge state reset and the textarea
      // empty: updateFeedback() takes its full-replace path and leaves
      // lastGeneratedText = the generated baseline for this score state.
      lastScoreResult = null;
      lastGeneratedText = '';
      const fbEl = el('feedback-text');
      if (fbEl) fbEl.value = '';
      if (focusMode) focusIdx = 0;
      recalculate();

      // Restore the SAVED feedback over the generated baseline. Because
      // lastGeneratedText still holds the generated text, any manual edits
      // in the saved draft survive future grade changes via the merge path.
      if (fbEl) {
        fbEl.value = rec.feedbackText || '';
        fbEl.dispatchEvent(new Event('input'));
      }
      const notesEl = el('additional-comments');
      if (notesEl) {
        notesEl.value = rec.markerNotes || '';
        notesEl.dispatchEvent(new Event('input'));
      }

      // AI assistant panel state is not part of the record — clear it.
      const aiIn  = el('ai-manual-suggestion');
      const aiOut = el('ai-suggestion');
      if (aiIn)  { aiIn.value  = ''; aiIn.dispatchEvent(new Event('input')); }
      if (aiOut) { aiOut.value = ''; aiOut.dispatchEvent(new Event('input')); }
      const aiDiff = el('ai-diff-box');
      if (aiDiff) { aiDiff.innerHTML = ''; aiDiff.classList.add('hidden'); }
      const aiPrompt = el('ai-prompt-preview');
      if (aiPrompt) { aiPrompt.textContent = ''; aiPrompt.classList.add('hidden'); }
      setAIState('idle');

      // Integrity cross-check: recomputed effective totals vs the stored
      // snapshot. A mismatch means config (rubric/penalties/scale) changed
      // since save — surface it, don't block.
      const saved = rec.scoreResult || {};
      if (saved.penalisedScore != null && scoreResult) {
        const eff = SA.applyGradeOverride(config, scoreResult, readScoringInputs().overrideGrade);
        const drift = Math.abs((eff.penalisedScore || 0) - saved.penalisedScore) >= 0.005
                   || eff.suggestedGrade !== saved.suggestedGrade;
        if (drift) {
          showCohortToast(
            'Recalculated score (' + SA.formatScore(eff.penalisedScore, _displayRounding) + ' ' + eff.suggestedGrade +
            ') differs from the saved record (' + SA.formatScore(saved.penalisedScore, _displayRounding) + ' ' + (saved.suggestedGrade || '—') +
            '). The rubric or penalties may have changed since this student was saved.', 'amber');
        }
      }

      refreshStatusChips();
      _markSessionClean();
      return true;
    }

    function openCohortRecord(key) {
      if (_sessionHasUnsavedWork()
          && !confirm('You have unsaved marking in the current session.\n\nOpening a saved record will replace everything on screen. Save the current student to the cohort first if you want to keep it.\n\nOpen anyway?')) {
        return;
      }
      if (!loadCohortRecordIntoSession(key)) return;
      closeModal('cohort-list-modal');
      const who = el('student-name').value || el('student-id').value || 'record';
      showCohortToast('Opened ' + who + ' — re-saving updates this record in place.', 'green');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideCohortListModal() { closeModal('cohort-list-modal'); }

    function refreshCohortUI() {
      const cohort = SA.getCohort(config && config.id);
      const count  = cohort ? cohort.students.length : 0;
      const label  = cohort ? (cohort.label || '—') : '—';
      setText('cohort-label', label);
      setText('cohort-count', String(count));
      setText('cohort-banner-count', String(count));
      const banner = el('cohort-privacy-banner');
      if (banner) banner.classList.toggle('hidden', count === 0);
      // Keep moderation-export visibility in lockstep with cohort changes.
      try { refreshModExportUI(); } catch (e) { /* module may not be loaded in tests */ }
      // FK-25: ambient rubric-drift signal stays in lockstep with the cohort too.
      try { refreshRubricDriftUI(cohort); } catch (e) { /* SA.detectRubricDrift may be absent in tests */ }
      // FK-48: the Moodle export control stays visible while the cohort holds imported records, so
      // its visibility has to be re-evaluated whenever the cohort changes (import, clear, re-open).
      try { applyMoodleVisibility(); } catch (e) { /* no-op before the config is loaded */ }
      // FK-12: ambient cohort scale-use consistency signal (default-off; opt-in).
      try { refreshCohortConsistencyUI(cohort); } catch (e) { /* CohortInsights may be absent in tests */ }
      // FK-53: Save & next appears only while someone in the cohort is still unmarked, so it
      // has to be re-evaluated on every cohort change (import, save, open, remove, clear).
      try { refreshSaveNextVisibility(); } catch (e) { /* FKMoodle may be absent in tests */ }
      refreshStatusChips();
    }

    /* ── Rubric drift indicator (FK-12) ──────────────────────────
       Ambient signal: when the open cohort holds records stamped (FK-11)
       against a rubric version that differs from the one currently loaded,
       tint the cohort section and show an amber badge with a plain-English
       tooltip. Reads SA.detectRubricDrift, which mirrors the moderation
       export's per-record fallback, so this badge and the exported
       90_manifest can never disagree. Silent when there is no drift. */
    function refreshRubricDriftUI(cohort) {
      const badge   = el('cohort-drift-badge');
      const section = el('sec-cohort');
      if (!badge && !section) return;
      cohort = cohort || (config && SA.getCohort(config.id));

      const d = (SA && typeof SA.detectRubricDrift === 'function')
        ? SA.detectRubricDrift(config, cohort) : null;
      const drift = !!(d && d.drift);

      if (section) section.classList.toggle('fk-cohort-drift', drift);
      if (!badge) return;
      badge.classList.toggle('hidden', !drift);
      if (!drift) { badge.title = ''; return; }

      const driftedWord = d.driftedCount === 1 ? 'record was' : 'records were';
      badge.textContent = d.mixed ? '⚠ Mixed rubric' : '⚠ Rubric drift';
      badge.title = d.mixed
        ? d.driftedCount + ' of ' + d.total + ' cohort ' + driftedWord +
          ' marked against a different rubric version than the one loaded now ('
          + d.versions.length + ' versions present). The moderation export will report this cohort as "mixed".'
        : 'All ' + d.total + ' records in this cohort were marked against an earlier rubric version (' +
          (d.versions[0] || '—') + '); the rubric loaded now is ' + d.currentHash +
          '. Re-saving a record re-stamps it with the current rubric.';
    }

    /* ── Cohort consistency indicator (FK-12) ────────────────────
       Ambient, opt-in (default OFF), saved-cohort-only signal: shows
       how much of the score range the open cohort spans, reusing
       CohortInsights.scaleUseSignal (which wraps cohortMetrics — no
       duplicate computation, same thresholds as the Insights panel).
       Deliberately a consistency signal, not a running mean, and it
       excludes the in-progress student, to minimise anchoring. Hidden
       unless the marker enables it in Scorer settings and the cohort
       is large enough (n >= 12) to read scale use meaningfully. */
    function refreshCohortConsistencyUI(cohort) {
      const badge = el('cohort-consistency-badge');
      if (!badge) return;
      const enabled = !!getSetting('showCohortConsistency', false);
      cohort = cohort || (config && SA.getCohort(config.id));
      const students = (cohort && cohort.students) || [];
      let sig = null;
      if (enabled && window.CohortInsights && typeof CohortInsights.scaleUseSignal === 'function') {
        try { sig = CohortInsights.scaleUseSignal(config, students); } catch (e) { sig = null; }
      }
      if (!enabled || !sig) {
        badge.classList.add('hidden');
        badge.setAttribute('data-state', '');
        badge.title = '';
        return;
      }
      badge.classList.remove('hidden');
      badge.setAttribute('data-state', sig.state);
      badge.textContent = '⚖ Scale use ' + sig.pct;
      badge.title = sig.note + ' (Cohort of ' + sig.n + '. Shown because you enabled the consistency indicator in Scorer settings.)';
    }
    function applyCohortConsistencyVisibility() {
      const cb = el('setting-show-cohort-consistency');
      if (cb) cb.checked = !!getSetting('showCohortConsistency', false);
      try { refreshCohortConsistencyUI(); } catch (e) {}
    }
    function setShowCohortConsistency(on) {
      setSetting('showCohortConsistency', !!on);
      if (on) usageTrack('cohort_consistency_enabled');
      applyCohortConsistencyVisibility();
    }

    /* ── FK-48: per-scorer Moodle declaration ─────────────────────
       A scorer declares whether its assessment is marked in Moodle. When it is not, the Moodle
       entry points are hidden rather than disabled: nothing the marker does in-session can change
       the answer, so a permanently greyed control would be noise that invites a click and explains
       itself only on hover. (Disabled-with-tooltip is right for moderation export, where marking
       15 students genuinely unlocks it.)

       The flag lives on the config, not in SA_SCORER_SETTINGS_V1, because that blob is device-global
       and would switch Moodle off for every scorer on the machine. On the config it is per-scorer
       and travels with the JSON export to the marking team.

       Absent reads as enabled, so scorers built before this existed are untouched. */
    function moodleDeclared() {
      return !config || config.moodleEnabled !== false;
    }

    /* True when the open cohort holds records imported from a Moodle worksheet. buildCohortImport
       stamps source:'moodle-worksheet' on every imported record, so this is a read of existing data. */
    function cohortHasMoodleRecords() {
      try {
        if (!config || !config.id || !window.SA || !SA.getCohort) return false;
        const cohort = SA.getCohort(config.id);
        const students = (cohort && cohort.students) || [];
        return students.some(function (s) { return s && s.source === 'moodle-worksheet'; });
      } catch (e) { return false; }
    }

    /* Hides entry + import when the scorer says it is not marked in Moodle. Export is kept visible
       whenever the open cohort holds Moodle-imported records, so a marker who imported a worksheet
       and marked half the cohort cannot be stranded with no way to finish the round trip. The flag
       therefore governs entry to the workflow, not exit from it. */
    function applyMoodleVisibility() {
      const declared = moodleDeclared();
      const stranded = !declared && cohortHasMoodleRecords();
      document.querySelectorAll('[data-fk-moodle]').forEach(function (node) {
        const kind = node.getAttribute('data-fk-moodle');
        const show = declared || (kind === 'export' && stranded);
        // Inline display, not the `hidden` utility class. Two of the three targets are `.btn`
        // elements, and `.btn { display: inline-flex }` beats `.hidden { display: none }` in the
        // cascade, so toggling the class applies it without hiding anything (the FK-06 / FK-16
        // hazard). Runtime-confirmed here: class present, computed display still flex.
        // Empty string restores whatever the stylesheet says, so showing again needs no bookkeeping.
        node.style.display = show ? '' : 'none';
      });
    }

    function applyMoodleSetting() {
      const cb = el('setting-moodle-enabled');
      if (cb) cb.checked = moodleDeclared();
      applyMoodleVisibility();
    }

    function setMoodleEnabled(on) {
      if (!config) return;
      config.moodleEnabled = !!on;
      try {
        SA.saveConfig(config);
      } catch (e) {
        alert(e && e.message ? e.message : 'Could not save the Moodle setting — this browser’s storage may be full.');
      }
      applyMoodleVisibility();
    }

    /* ── FK-19: Moodle worksheet import controller ───────────────
       State machine: idle → validating → {invalid | previewing} →
       importing → done. Consumes the pure FKMoodle contract
       (validateWorksheet → planImport → buildCohortImport); this
       layer only reads the file, renders, and persists via addToCohort.
       The guarded commit (skip-if-marked) lives in buildCohortImport. */
    const _mw = { state: 'idle', plan: null, fileName: '', onlyAttention: false, error: '' };

    function _mwCohortStudents() { const c = config && SA.getCohort(config.id); return (c && c.students) || []; }
    function _mwEntry(row) { return _mw.plan && _mw.plan.entries.find(e => e.row === row); }
    function _mwUnresolvedVerify() { return !!(_mw.plan && _mw.plan.entries.some(e => e.disposition === 'verify')); }
    function _mwSay(msg) { const l = el('mw-live'); if (l) l.textContent = msg; }
    function _mwRecount() {
      const s = { total: 0, import: 0, verify: 0, skip: 0, nonMarkable: 0 };
      _mw.plan.entries.forEach(e => { s.total++; s[e.disposition === 'non-markable' ? 'nonMarkable' : e.disposition]++; });
      _mw.plan.summary = s;
    }

    function openMoodleImport() {
      if (!window.FKMoodle) { alert('Moodle import is unavailable — the worksheet module did not load.'); return; }
      const input = el('moodle-file-input');
      if (input) { input.value = ''; input.click(); }
    }

    function onMoodleFileChosen(input) {
      const file = input && input.files && input.files[0];
      if (!file) return;
      _mw.state = 'validating'; _mw.fileName = file.name; _mw.plan = null; _mw.onlyAttention = false; _mw.error = '';
      openModal('moodle-import-modal');
      renderMoodleImport();
      const reader = new FileReader();
      reader.onload = function () {
        try {
          _mw.plan = window.FKMoodle.planImport(String(reader.result || ''));
          _mw.state = _mw.plan.isValid ? 'previewing' : 'invalid';
        } catch (e) { _mw.plan = null; _mw.state = 'error'; _mw.error = String((e && e.message) || e); }
        renderMoodleImport();
      };
      reader.onerror = function () { _mw.state = 'error'; _mw.error = 'Could not read the file.'; renderMoodleImport(); };
      reader.readAsText(file);
    }

    function _mwBadge(d) {
      const map = { 'import': ['mw-import', 'Ready'], 'verify': ['mw-verify', 'Verify'], 'skip': ['mw-skip', 'Skip'], 'non-markable': ['mw-nonmarkable', 'No submission'] };
      const m = map[d] || ['mw-nonmarkable', d];
      return '<span class="mw-badge ' + m[0] + '">' + m[1] + '</span>';
    }
    function _mwCancelBtn() { return '<button onclick="S.mwCancel()" class="bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 font-semibold px-4 py-2 rounded-lg">Cancel</button>'; }

    function renderMoodleImport() {
      const body = el('mw-body'), footer = el('mw-footer');
      if (!body || !footer) return;
      if (_mw.state === 'validating') { body.innerHTML = '<p class="text-slate-600">Reading <strong>' + escHtml(_mw.fileName) + '</strong>…</p>'; footer.innerHTML = ''; _mwSay('Validating worksheet'); return; }
      if (_mw.state === 'importing')  { body.innerHTML = '<p class="text-slate-600">Importing…</p>'; footer.innerHTML = ''; return; }
      if (_mw.state === 'error')      { body.innerHTML = '<p class="text-red-700">' + escHtml(_mw.error || 'Unexpected error.') + '</p>'; footer.innerHTML = _mwCancelBtn(); return; }

      if (_mw.state === 'invalid') {
        const errs = _mw.plan.validation.errors;
        body.innerHTML =
          '<p class="text-red-700 font-semibold mb-1">This file can’t be imported.</p>' +
          '<p class="text-sm text-slate-600 mb-3">Re-export the worksheet from Moodle without renaming, moving, adding, or removing columns — then try again.</p>' +
          '<ul class="text-sm space-y-1">' + errs.map(function (e) {
            return '<li class="text-red-700">• ' + escHtml(e.message) +
              (e.column != null ? ' <span class="text-slate-400">(column ' + (e.column + 1) + ')</span>' : '') +
              (e.row != null ? ' <span class="text-slate-400">(row ' + e.row + ')</span>' : '') + '</li>';
          }).join('') + '</ul>';
        footer.innerHTML = _mwCancelBtn();
        _mwSay('File invalid; ' + errs.length + ' error' + (errs.length === 1 ? '' : 's'));
        return;
      }

      // previewing
      const s = _mw.plan.summary;
      const list = _mw.onlyAttention ? _mw.plan.entries.filter(function (e) { return e.disposition === 'verify' || e.disposition === 'skip'; }) : _mw.plan.entries;
      const rows = list.map(function (e) {
        const action = e.disposition === 'verify'
          ? '<button onclick="S.mwAssignId(' + e.row + ')" class="text-xs text-emerald-700 underline mr-2">Assign ID</button><button onclick="S.mwIgnore(' + e.row + ')" class="text-xs text-slate-500 underline">Ignore</button>'
          : (e.reason ? '<span class="text-xs text-slate-400">' + escHtml(e.reason) + '</span>' : '');
        return '<tr class="' + (e.disposition === 'skip' ? 'mw-row-skip' : '') + '">' +
          '<td class="py-1 pr-2 text-slate-400 text-xs">' + e.row + '</td>' +
          '<td class="py-1 pr-2">' + escHtml(e.name || '—') + '</td>' +
          '<td class="py-1 pr-2 font-mono text-xs">' + escHtml(e.identifier || '—') + '</td>' +
          '<td class="py-1 pr-2">' + _mwBadge(e.disposition) + '</td>' +
          '<td class="py-1">' + action + '</td></tr>';
      }).join('');
      body.innerHTML =
        '<div class="mb-3 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">' +
          '<strong>' + s.total + ' rows:</strong> ' + s.import + ' ready · ' + s.verify + ' verify needed · ' + s.nonMarkable + ' non-markable · ' + s.skip + ' skipped' +
          (s.verify ? ' <span class="text-amber-700">— resolve the verify rows to continue.</span>' : '') +
        '</div>' +
        '<label class="text-xs text-slate-600 flex items-center gap-1 mb-2"><input type="checkbox" ' + (_mw.onlyAttention ? 'checked' : '') + ' onchange="S.mwToggleFilter()"> Show only rows needing attention</label>' +
        '<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="text-left text-xs text-slate-400 border-b border-slate-100">' +
        '<th class="py-1 pr-2">Row</th><th class="py-1 pr-2">Name</th><th class="py-1 pr-2">ID number</th><th class="py-1 pr-2">Status</th><th class="py-1">Action</th></tr></thead><tbody>' +
        rows + '</tbody></table></div>';
      const blocked = _mwUnresolvedVerify();
      footer.innerHTML = _mwCancelBtn() +
        '<button onclick="S.mwCommit()" ' +
        (blocked ? 'disabled title="Resolve every verify row first" class="bg-slate-200 text-slate-400 font-semibold px-4 py-2 rounded-lg cursor-not-allowed"'
                 : 'class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg"') +
        '>Import ' + s.import + ' student' + (s.import === 1 ? '' : 's') + '</button>';
      _mwSay(s.total + ' rows; ' + s.import + ' ready, ' + s.verify + ' need verification');
    }

    function mwAssignId(row) {
      const e = _mwEntry(row); if (!e) return;
      const input = prompt('Enter the Moodle ID number for "' + (e.name || 'this row') + '":', '');
      if (input == null) return;
      const sid = String(input).trim();
      if (!sid) return;
      // Gemini guard: re-check the assigned ID against other rows + the cohort.
      const conflict = window.FKMoodle.sidCollision(sid, _mw.plan.entries, _mwCohortStudents(), row);
      if (conflict) {
        alert(conflict.scope === 'cohort'
          ? 'That ID number already belongs to "' + (conflict.name || 'a student') + '" in this cohort.'
          : 'That ID number is already used by row ' + conflict.row + ' in this worksheet.');
        return; // stays in verify → Commit remains blocked
      }
      e.identifier = sid; e.keyType = 'sid'; e.key = 'sid:' + sid; e.disposition = 'import'; e.reason = null;
      _mwRecount(); renderMoodleImport();
    }

    function mwIgnore(row) { const e = _mwEntry(row); if (!e) return; e.disposition = 'skip'; e.reason = 'Ignored.'; _mwRecount(); renderMoodleImport(); }
    function mwToggleFilter() { _mw.onlyAttention = !_mw.onlyAttention; renderMoodleImport(); }
    function mwCancel() { _mw.state = 'idle'; _mw.plan = null; closeModal('moodle-import-modal'); }

    function mwCommit() {
      if (!_mw.plan || _mwUnresolvedVerify()) return;
      const decision = window.FKMoodle.buildCohortImport(_mw.plan.entries, _mwCohortStudents());
      if (!decision.toAdd.length) {
        showCohortToast('Nothing to import — every row was skipped or already in the cohort.', 'amber');
        return;
      }
      _mw.state = 'importing'; renderMoodleImport();
      ensureCohortInitialised(function (cohort) {
        if (!cohort) { _mw.state = 'previewing'; renderMoodleImport(); return; } // setup dismissed
        let added = 0, failed = 0, firstKey = null;
        decision.toAdd.forEach(function (rec) {
          const r = SA.addToCohort(config.id, rec);   // addToCohort stamps rec.key
          if (r && r.saved) { added++; if (!firstKey) firstKey = rec.key; }
          else failed++;
        });
        refreshCohortUI();
        closeModal('moodle-import-modal');
        _mw.state = 'idle';
        const sk = decision.summary.skippedExisting;
        // FK-27: finalise selection — land the marker ready-to-mark on the first
        // imported student. Without this the cohort updates but the marking pane
        // stays on the empty "(no name)" student (and, if focus mode is on, the
        // marker sees only the focus workspace with nothing loaded). Guarded on
        // no-unsaved-work so importing more mid-marking doesn't discard the
        // student currently being marked.
        let openedName = '';
        if (firstKey && !_sessionHasUnsavedWork()) {
          try {
            if (loadCohortRecordIntoSession(firstKey) !== false) {
              openedName = (el('student-name').value || '').trim();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          } catch (e) { /* leave the marker on the current pane */ }
        }
        showCohortToast('Imported ' + added + ' student' + (added === 1 ? '' : 's') +
          (sk ? ' · ' + sk + ' already marked (kept)' : '') +
          (failed ? ' · ' + failed + ' failed' : '') +
          (openedName ? ' · now marking ' + openedName : ''), failed ? 'amber' : 'green');
      });
    }

    /* ── FK-19: Moodle worksheet EXPORT (the round-trip's other half) ──
       Smallest UI slice: re-supply the original worksheet → fill Grade +
       Feedback via FKMoodle.buildExportWorksheet (feedbackText only, never
       markerNotes) → download the filled file under the same name. */
    function openMoodleExport() {
      if (!window.FKMoodle) { alert('Moodle export is unavailable — the worksheet module did not load.'); return; }
      const msg = el('me-msg'); if (msg) { msg.classList.add('hidden'); msg.textContent = ''; }
      openModal('moodle-export-modal');
    }
    function mwExportChoose() {
      const input = el('moodle-export-file-input'); if (input) { input.value = ''; input.click(); }
    }
    function _meError(m) { const x = el('me-msg'); if (x) { x.textContent = m; x.classList.remove('hidden'); } }
    function _downloadText(filename, text) {
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      return FKSave.saveFile(blob, filename || 'FK_worksheet.csv');
    }
    function onMoodleExportFileChosen(input) {
      const file = input && input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function () {
        const cohort = config && SA.getCohort(config.id);
        const students = (cohort && cohort.students) || [];
        let res;
        try { res = window.FKMoodle.buildExportWorksheet(String(reader.result || ''), students); }
        catch (e) { _meError('Could not process the file: ' + ((e && e.message) || e)); return; }
        if (!res.ok) {
          _meError(((res.errors && res.errors[0] && res.errors[0].message) || 'That file is not a valid Moodle worksheet.') +
            ' Re-export it from Moodle and try again.');
          return;
        }
        // A cancelled Save-As means nothing was written — leave the modal
        // open and stay silent, same as any other no-op cancel.
        const outcome = await _downloadText(file.name, res.text);
        if (outcome === 'cancelled') return;
        closeModal('moodle-export-modal');
        showCohortToast('Exported ' + res.summary.filled + ' grade' + (res.summary.filled === 1 ? '' : 's') +
          ' to ' + file.name +
          (res.summary.unmatched ? ' · ' + res.summary.unmatched + ' row(s) left unchanged' : '') +
          '. Upload it back to Moodle.', res.summary.filled ? 'green' : 'amber');
      };
      reader.onerror = function () { _meError('Could not read the file.'); };
      reader.readAsText(file);
    }

    /* ── Status chips (live UI state) ─────────────────────── */
    let _aiState = 'idle';   // replaces the old _aiApplied boolean
    let _aiLastEdits = 0;    // number of lines different from the main textarea on last apply

    function setAIState(state, edits) {
      _aiState = state;
      if (typeof edits === 'number') _aiLastEdits = edits;
      refreshStatusChips();
    }

    function refreshStatusChips() {
      // Rubric chip: X of Y graded
      const rChip = el('rubric-status-chip');
      if (rChip && config && config.criteria) {
        const total  = config.criteria.length;
        const graded = (studentGrades || []).filter(g => g && g.grade).length;
        const auto   = (studentGrades || []).filter(g => g && g.grade && g.autoFilled).length;
        rChip.textContent = graded + ' of ' + total + ' graded' + (auto ? ' \u00b7 ' + auto + ' not yet reviewed' : '');
        rChip.className = 'ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full align-middle '
          + (graded === 0 ? 'bg-slate-200 text-slate-600'
            : graded < total ? 'bg-amber-100 text-amber-800'
            : 'bg-green-100 text-green-800');
      }
      // Feedback chip
      const fChip = el('feedback-status-chip');
      if (fChip) {
        const ta = el('feedback-text');
        const hasText = ta && ta.value && ta.value.trim().length > 0;
        fChip.textContent = hasText ? 'Draft ready' : 'Draft pending';
        fChip.className = 'ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full align-middle '
          + (hasText ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600');
      }
      // AI chip
      const aChip = el('ai-status-chip');
      if (aChip) {
        const labels = {
          idle:     'Idle',
          drafting: 'Drafting…',
          applied:  'Applied' + (_aiLastEdits ? ' — ' + _aiLastEdits + ' edits' : ''),
          error:    'Error'
        };
        const colors = {
          idle:     'bg-slate-200 text-slate-600',
          drafting: 'bg-amber-100 text-amber-800 animate-pulse',
          applied:  'bg-green-100 text-green-800',
          error:    'bg-red-100 text-red-800'
        };
        aChip.textContent = labels[_aiState];
        aChip.className = 'ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full align-middle ' + colors[_aiState];
      }
      // Cohort chip + rail badge (progressive state)
      const cChip = el('cohort-status-chip');
      const cohortForChip = SA.getCohort(config && config.id);
      const cohortCount   = cohortForChip ? cohortForChip.students.length : 0;
      if (cChip) {
        cChip.textContent = cohortCount === 0 ? 'Ready' : cohortCount + ' saved';
        cChip.className = 'ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full align-middle '
          + (cohortCount === 0 ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-800');
      }
      // Rail badge for Cohort
      const railLbl = el('rail-cohort-label');
      if (railLbl) {
        railLbl.textContent = cohortCount === 0 ? 'Cohort' : 'Cohort (' + cohortCount + ')';
      }
      // Auto-expand Cohort once the first student is saved (only the first time per session, not during focus mode)
      const hSec = document.getElementById('sec-cohort');
      if (hSec && cohortCount > 0 && !hSec.dataset.userToggled && !hSec.open && !focusMode) {
        hSec.open = true;
      }
      // Insights button: show when cohort has ≥ 1 student; update NEW pill from open count
      const insightsBtn = el('btn-insights');
      if (insightsBtn) insightsBtn.classList.toggle('hidden', cohortCount === 0);
      const newPillBtn = el('btn-insights-new');
      if (newPillBtn) {
        const opensKey = CI_OPENS_PREFIX + (config ? config.id : '');
        const opens    = parseInt(localStorage.getItem(opensKey) || '0', 10);
        newPillBtn.classList.toggle('hidden', cohortCount === 0 || opens >= 3);
      }
      refreshStickySummary();
      refreshAIInputChips();
    }

    function refreshStickySummary() {
      const elBar = document.getElementById('sticky-summary');
      if (!elBar) return;
      const name   = (document.getElementById('student-name').value || '').trim();
      const grades = (studentGrades || []).filter(g => g && g.grade).length;
      const total  = (config && config.criteria) ? config.criteria.length : 0;
      const sr     = scoreResult;
      const grade  = sr && sr.rows && sr.rows.some(r => r.grade) ? sr.suggestedGrade : '—';
      const fbReady = (document.getElementById('feedback-text').value || '').trim().length > 0;
      elBar.textContent =
        (name || '(no name)') +
        ' · ' + grade +
        ' · ' + grades + ' of ' + total + ' graded' +
        ' · ' + (fbReady ? 'Draft ready' : 'Draft pending');
    }

    function setText(id, v) { const e = el(id); if (e) e.textContent = v; }

    function showCohortToast(msg, color) {
      const t = document.createElement('div');
      const bg = color === 'amber' ? 'bg-amber-600' : color === 'slate' ? 'bg-slate-700' : 'bg-green-600';
      t.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 ' + bg + ' text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg z-50';
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(function () { t.remove(); }, 400); }, 2800);
    }

    /* ── Cohort setup modal (first-use prompt) ───────────── */
    // Session-level dismiss flag so Cancel/backdrop click doesn't re-pop on every silent
    // auto-save (Copy / Download). Resets on page reload or successful Start cohort.
    let _cohortSetupDismissedThisSession = false;

    function showCohortSetupModal(onConfirm) {
      const modal = el('cohort-setup-modal');
      if (!modal) { onConfirm && onConfirm('Cohort', false); return; }
      const suggested = (config.assessmentTitle || config.name || 'Cohort') + ' \u2014 ' + SA.formatDate();
      const labelInput = el('cohort-setup-label');
      if (labelInput) labelInput.value = suggested;
      openModal('cohort-setup-modal');
      const confirmBtn = el('cohort-setup-confirm');
      confirmBtn.onclick = function () {
        const multi = el('cohort-setup-multi-yes').checked;
        // Null-safe: label input is optional in the modal HTML.
        let label = (labelInput && (labelInput.value || '').trim()) || suggested;
        if (multi) {
          const tutor = (el('student-tutor').value || '').trim();
          if (tutor && label.toLowerCase().indexOf(tutor.toLowerCase()) === -1) {
            label = tutor + ' \u2014 ' + label;
          }
        }
        closeModal('cohort-setup-modal');
        _cohortSetupDismissedThisSession = false;
        onConfirm && onConfirm(label, multi);
      };
    }

    function hideCohortSetupModal() {
      closeModal('cohort-setup-modal');
      // Treat Cancel / backdrop click as a session-level dismiss.
      _cohortSetupDismissedThisSession = true;
    }

    function showPostExportWipeModal(count, filename) {
      setText('cohort-wipe-count', String(count));
      setText('cohort-wipe-filename', filename || 'Cohort.xlsx');
      openModal('cohort-wipe-modal');
    }
    function hideCohortWipeModal() { closeModal('cohort-wipe-modal'); }
    function wipeCohortAfterExport() {
      SA.clearCohort(config.id);
      refreshCohortUI();
      hideCohortWipeModal();
      showCohortToast('Cohort saved to Excel and cleared locally.', 'green');
    }

    /* ── Moderation Export — opt-in & gating (issue #2) ────────
       The export engine itself ships in issue #3. This block only
       handles the lecturer/coordinator opt-in record, the gated
       button visibility, the tutor notice banner, and the n<15
       blocking dialog. No network calls, no XHR. */

    function _modSlug(s) {
      return String(s == null ? '' : s).trim()
        .replace(/[^A-Za-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toUpperCase();
    }

    // Best-effort prefill values for the modal. The user can edit
    // any of these before confirming. We never persist the prefill
    // by itself — only the confirmed values are written.
    function _modPrefill() {
      const cohort = SA.getCohort(config && config.id);
      const cohortLabel = (cohort && cohort.label) || '';
      return {
        paper_code:     _modSlug(config && config.courseName) || '',
        cohort_id:      _modSlug(cohortLabel) || '',
        assessment_id:  _modSlug(config && config.assessmentTitle) || '',
        lecturer_name:  (config && config.name) || ''
      };
    }

    // The active opt-in identifiers come from the most recently
    // saved opt-in record for this cohort.label/courseName/assessmentTitle
    // tuple. If the user changes any of those, no opt-in matches
    // and the moderation UI returns to its hidden default.
    function _activeOptInRecord() {
      if (!window.FKModOptIn) return null;
      const all = window.FKModOptIn.getAllModerationOptIns();
      const pf = _modPrefill();
      // First try an exact match against the prefill.
      const tryGet = window.FKModOptIn.getModerationOptIn(
        pf.paper_code, pf.cohort_id, pf.assessment_id);
      if (tryGet && tryGet.enabled && tryGet.opt_in_recorded) return tryGet;

      // Fall back to any enabled record whose cohort_id matches the
      // current cohort label slug — this handles the case where the
      // lecturer typed slightly different paper/assessment codes.
      for (const k in all) {
        if (!Object.prototype.hasOwnProperty.call(all, k)) continue;
        const r = all[k];
        if (r && r.enabled === true && r.opt_in_recorded === true
            && r.cohort_id === pf.cohort_id && pf.cohort_id) {
          return r;
        }
      }
      return null;
    }

    function refreshModExportUI() {
      const banner   = el('modexport-tutor-banner');
      const runBtn   = el('btn-modexport-run');
      const optBtn   = el('btn-modexport-optin');
      const offBtn   = el('btn-modexport-disable');
      const rec      = _activeOptInRecord();
      const enabled  = !!rec;

      if (banner) banner.classList.toggle('hidden', !enabled);
      if (runBtn) runBtn.classList.toggle('hidden', !enabled);
      if (offBtn) offBtn.classList.toggle('hidden', !enabled);
      // Opt-in entry button is always visible — lecturer can re-open
      // it to view current state or update identifiers.
      if (optBtn) optBtn.textContent = enabled
        ? 'Moderation Export settings…'
        : 'Moderation Export…';
    }

    function showModExportOptIn() {
      const modal = el('modexport-optin-modal');
      if (!modal) return;
      const pf = _modPrefill();
      const existing = _activeOptInRecord();

      const setVal = (id, v) => { const x = el(id); if (x) x.value = v || ''; };
      setVal('modexport-paper-code',     (existing && existing.paper_code)    || pf.paper_code);
      setVal('modexport-cohort-id',      (existing && existing.cohort_id)     || pf.cohort_id);
      setVal('modexport-assessment-id',  (existing && existing.assessment_id) || pf.assessment_id);
      setVal('modexport-lecturer-name',  (existing && existing.lecturer_name) || pf.lecturer_name);
      setVal('modexport-lecturer-role',  (existing && existing.lecturer_role) || '');

      const cb = el('modexport-confirm-checkbox');
      if (cb) cb.checked = false;
      const err = el('modexport-optin-error');
      if (err) { err.classList.add('hidden'); err.textContent = ''; }

      openModal('modexport-optin-modal');
    }

    function hideModExportOptIn() {
      closeModal('modexport-optin-modal');
    }

    function _modShowOptInError(msg) {
      const err = el('modexport-optin-error');
      if (!err) return;
      err.textContent = msg || 'Please complete the required fields.';
      err.classList.remove('hidden');
    }

    function confirmModExportOptIn() {
      if (!window.FKModOptIn) {
        _modShowOptInError('Moderation Export module not loaded.');
        return;
      }
      const valOf = (id) => { const x = el(id); return x ? (x.value || '').trim() : ''; };
      const cb = el('modexport-confirm-checkbox');

      const input = {
        paper_code:      valOf('modexport-paper-code'),
        cohort_id:       valOf('modexport-cohort-id'),
        assessment_id:   valOf('modexport-assessment-id'),
        lecturer_name:   valOf('modexport-lecturer-name'),
        lecturer_role:   valOf('modexport-lecturer-role'),
        opt_in_recorded: !!(cb && cb.checked)
      };

      if (!input.paper_code || !input.cohort_id || !input.assessment_id) {
        _modShowOptInError('Paper code, Cohort ID and Assessment ID are all required.');
        return;
      }
      if (!input.lecturer_name) {
        _modShowOptInError('Please enter the lecturer / coordinator name.');
        return;
      }
      if (!input.opt_in_recorded) {
        _modShowOptInError('Please tick the confirmation checkbox to continue.');
        return;
      }

      const result = window.FKModOptIn.setModerationOptIn(input);
      if (!result || !result.ok) {
        _modShowOptInError('Could not save opt-in: ' + ((result && result.reason) || 'unknown error'));
        return;
      }

      hideModExportOptIn();
      refreshModExportUI();
      showCohortToast('Moderation Export enabled for this paper.', 'green');
    }

    function disableModExport() {
      const rec = _activeOptInRecord();
      if (!rec) { refreshModExportUI(); return; }
      if (!confirm('Disable Moderation Export for ' + rec.paper_code + ' / ' + rec.cohort_id + ' / ' + rec.assessment_id + '?\n\nFuture exports will be blocked. Files you have already generated are unaffected.')) return;
      if (window.FKModOptIn) {
        window.FKModOptIn.clearModerationOptIn(rec.paper_code, rec.cohort_id, rec.assessment_id);
      }
      refreshModExportUI();
      showCohortToast('Moderation Export disabled for this paper.', 'slate');
    }

    function showModExportBlock(n) {
      setText('modexport-block-count', String(n || 0));
      openModal('modexport-block-modal');
    }
    function hideModExportBlock() {
      closeModal('modexport-block-modal');
    }

    function runModExport() {
      const rec = _activeOptInRecord();
      if (!rec) {
        showCohortToast('Moderation Export is not enabled for this paper.', 'amber');
        refreshModExportUI();
        return;
      }
      const cohort = SA.getCohort(config && config.id);
      const n = (cohort && cohort.students) ? cohort.students.length : 0;
      const minN = (window.FKModSchema && window.FKModSchema.COHORT_MIN_N) || 15;
      if (n < minN) {
        showModExportBlock(n);
        return;  // No file produced.
      }
      if (!window.FKModExport) {
        showCohortToast('Moderation Export module not loaded. Please refresh and try again.', 'amber');
        return;
      }
      const filename = window.FKModExport.buildAndDownloadModExport({ config: config, cohort: cohort, optInRecord: rec });
      if (filename) showCohortToast('Moderation Export downloaded: ' + filename, 'green');
    }

    /* ── Cohort Insights panel ───────────────────────────── */
    const CI_OPENS_PREFIX = 'SA_CI_OPENS_';

    function showCohortInsights() {
      const modal  = el('cohort-insights-modal');
      if (!modal) return;
      const cohort = SA.getCohort(config && config.id);
      if (!cohort || !cohort.students.length) {
        showCohortToast('Add students to the cohort first.', 'amber');
        return;
      }
      openModal('cohort-insights-modal');
      modal.scrollTop = 0;

      // NEW pill: increment open count; hide after 3 opens
      const opensKey = CI_OPENS_PREFIX + (config ? config.id : '');
      const opens    = parseInt(localStorage.getItem(opensKey) || '0', 10) + 1;
      localStorage.setItem(opensKey, String(opens));
      const newPillBtn = el('btn-insights-new');
      if (newPillBtn) newPillBtn.classList.toggle('hidden', opens >= 3);

      _renderCohortInsights(cohort);
    }

    function _renderCohortInsights(cohort) {
      const body = el('cohort-insights-body');
      if (!body || !cohort) return;
      if (typeof CohortInsights !== 'undefined') {
        CohortInsights.renderInsights(body, config, cohort, '');
      } else {
        body.innerHTML = '<p class="ci-note text-red-600">Cohort Insights module not loaded.</p>';
      }
    }

    function hideCohortInsights() {
      closeModal('cohort-insights-modal');
    }

    function copyCohortInsights() {
      const body = el('cohort-insights-body');
      if (!body) return;
      const btn = el('ci-copy-btn');
      navigator.clipboard.writeText(body.innerText).then(function () {
        if (btn) { btn.textContent = 'Copied!'; setTimeout(function () { btn.textContent = 'Copy insights'; }, 2000); }
      }).catch(function () {
        if (btn) { btn.textContent = 'Copy failed'; setTimeout(function () { btn.textContent = 'Copy insights'; }, 2000); }
      });
    }

    /* ── New student ─────────────────────────────────────── */
    function newStudent() {
      showNewStudentModal();
    }

    function confirmNewStudent() {
      el('student-name').value   = '';
      el('student-id').value     = '';
      // Tutor name kept by default (same marker for the whole batch) — but the
      // FK-33 shared-machine opt-in clears it on every New student.
      if (getSetting('clearTutorBetweenStudents', false)) el('student-tutor').value = '';
      el('grade-override').value = '';
      const commentsEl = el('additional-comments');
      if (commentsEl) { commentsEl.value = ''; commentsEl.dispatchEvent(new Event('input')); }
      el('late-penalty-select').value = 0;
      studentGrades = config.criteria.map(() => ({ grade: '', override: null, overrideManual: false, autoFilled: false }));
      config.criteria.forEach((_, i) => {
        const sel = el('grade-sel-' + i); if (sel) sel.value = '';
        const ovr = el('override-' + i);  if (ovr) ovr.value = '';
      });
      _bulkFillSnapshot = null;
      _refreshAllAutoPills();
      const bulkSel = el('bulk-fill-grade'); if (bulkSel) bulkSel.value = '';
      lastGeneratedText = '';
      lastScoreResult = null;

      // Clear Cooked Feedback textarea
      const fbEl = el('feedback-text');
      if (fbEl) { fbEl.value = ''; fbEl.dispatchEvent(new Event('input')); }

      // Clear AI Garnish panel inputs/outputs
      const aiIn  = el('ai-manual-suggestion');
      const aiOut = el('ai-suggestion');
      if (aiIn)  { aiIn.value  = ''; aiIn.dispatchEvent(new Event('input')); }
      if (aiOut) { aiOut.value = ''; aiOut.dispatchEvent(new Event('input')); }

      const aiDiff = el('ai-diff-box');
      if (aiDiff) { aiDiff.innerHTML = ''; aiDiff.classList.add('hidden'); }

      const aiPrompt = el('ai-prompt-preview');
      if (aiPrompt) { aiPrompt.textContent = ''; aiPrompt.classList.add('hidden'); }

      // Clear assistant run log from this browser
      if (SA && typeof SA.clearAssistantLog === 'function') {
        SA.clearAssistantLog();
      }

      setAIState('idle');
      if (focusMode) focusIdx = 0;
      recalculate();
      refreshStatusChips();
      _markSessionClean();
      clearDraft();   // FK-21: New student → discard the previous student's draft
      updateMarkingAs();   // FK-33: reflect any tutor clear in the topbar readout
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ── Helpers ─────────────────────────────────────────── */
    function el(id) { return document.getElementById(id); }
    function escHtml(s) {
      return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function highlightRoundingBtn(val) {
      // Update button active state
      var btnClasses = {
        none: 'px-2 py-1 rounded-l text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap',
        half: 'px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap border-l border-slate-200',
        whole: 'px-2 py-1 rounded-r text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap border-l border-slate-200'
      };
      ['none','half','whole'].forEach(function(k) {
        var btn = document.getElementById('rnd-' + k);
        if (!btn) return;
        if (k === val) {
          // Active state — keep border classes for position consistency
          var borderClass = (k !== 'none' && k !== 'whole') ? ' border-l border-slate-200' : '';
          btn.className = 'px-2 py-1 text-xs font-semibold bg-slate-800 text-white ring-2 ring-slate-400 whitespace-nowrap' + borderClass;
        } else {
          // Inactive state
          btn.className = btnClasses[k];
        }
      });

      // Update the "Display:" label chip
      var lbl = document.getElementById('score-rounding-label');
      if (lbl) {
        var labels = { none: 'Display: exact', half: 'Display: half marks', whole: 'Display: whole marks' };
        lbl.textContent = labels[val] || 'Display: exact';
      }

      // Update the dynamic helper text with computed rounded values
      var ex = document.getElementById('rounding-example');
      if (ex) {
        // Get the current penalised score
        var raw = null;
        try { raw = (typeof penalisedScore !== 'undefined' && penalisedScore != null) ? penalisedScore : null; } catch(e) {}

        if (raw != null && !isNaN(raw) && raw >= 0) {
          var nStr = raw.toFixed(1);
          var exactVal = nStr;
          var halfVal = (Math.round(raw * 2) / 2).toFixed(1);
          var wholeVal = Math.round(raw).toString();
          ex.textContent = 'Examples for ' + nStr + ': Exact ' + exactVal + ' · Half ' + halfVal + ' · Whole ' + wholeVal;
          ex.classList.remove('italic');
        } else {
          // No valid score yet
          ex.textContent = 'Examples appear once a score is calculated';
          ex.classList.add('italic');
        }
      }
    }

    function setRounding(val) {
      _displayRounding = val;
      if (config) {
        config.scoreRounding = val;
        try {
          SA.saveConfig(config);
        } catch (e) {
          alert(e && e.message ? e.message : 'Could not save the rounding setting — this browser’s storage may be full.');
        }
      }
      highlightRoundingBtn(val);
      recalculate();
    }

    /* ── Snippets ────────────────────────────────────────── */
    function loadSnippets() {
      try {
        const stored = localStorage.getItem(SNIPPETS_KEY);
        if (stored) {
          snippets = JSON.parse(stored);
        } else {
          snippets = [
            { id: SA.uid(), label: 'Great use of sources', text: 'Great use of academic sources to support your argument.' },
            { id: SA.uid(), label: 'Proofreading needed', text: 'Please ensure you proofread carefully for grammatical errors before submitting.' },
            { id: SA.uid(), label: 'APA formatting', text: 'Your formatting does not follow the required APA guidelines.' }
          ];
          saveSnippets();
        }
      } catch (e) { snippets = []; }
      renderSnippetsDropdown();
    }

    function saveSnippets() {
      // FK-24: surface quota/write failures instead of throwing silently.
      try {
        if (SA && SA.safeSetItem) SA.safeSetItem(SNIPPETS_KEY, JSON.stringify(snippets));
        else localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
      } catch (e) {
        alert(e && e.message ? e.message : 'Could not save snippets — this browser’s storage may be full.');
        return false;
      }
      renderSnippetsDropdown();
      renderSnippetsList();
      return true;
    }

    function renderSnippetsDropdown() {
      const sel = el('snippet-select');
      if (!sel) return;
      sel.innerHTML = '<option value="">Insert snippet…</option>';
      snippets.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.text;
        opt.textContent = s.label;
        sel.appendChild(opt);
      });
      sel.innerHTML += '<option disabled>──────────</option><option value="__manage__">⚙️ Manage snippets...</option>';
    }

    function insertSnippet(val) {
      if (!val) return;
      if (val === '__manage__') {
        showSnippetModal();
        return;
      }

      const ta = el('feedback-text');
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const text = ta.value;

      const before = text.substring(0, start);
      const after = text.substring(end);

      const insertText = (before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n')) ? ' ' + val : val;

      ta.value = before + insertText + after;

      ta.selectionStart = ta.selectionEnd = start + insertText.length;
      ta.focus();
      refreshAIInputChips();
    }

    function showSnippetModal() {
      renderSnippetsList();
      openModal('snippets-modal');
    }

    function hideSnippetModal() {
      el('snippet-select').value = '';
      closeModal('snippets-modal');
    }

    function renderSnippetsList() {
      const list = el('snippets-list');
      if (!list) return;
      list.innerHTML = '';
      if (snippets.length === 0) {
        list.innerHTML = '<p class="text-sm text-slate-600 italic">No snippets yet.</p>';
        return;
      }
      snippets.forEach(s => {
        const div = document.createElement('div');
        div.className = 'bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-start gap-3';
        div.innerHTML = `
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm text-slate-700 truncate">${escHtml(s.label)}</div>
            <div class="text-xs text-slate-500 mt-1 line-clamp-2">${escHtml(s.text)}</div>
          </div>
          <button onclick="S.deleteSnippet('${s.id}')" class="text-slate-600 hover:text-red-500 shrink-0" title="Delete snippet">&times;</button>
        `;
        list.appendChild(div);
      });
    }

    function addSnippet() {
      const labelInp = el('new-snippet-label');
      const textInp = el('new-snippet-text');
      const label = labelInp.value.trim();
      const text = textInp.value.trim();

      if (!label || !text) {
        alert('Please provide both a label and the snippet text.');
        return;
      }

      snippets.push({ id: SA.uid(), label, text });
      saveSnippets();

      labelInp.value = '';
      textInp.value = '';
    }

    function deleteSnippet(id) {
      if (confirm('Delete this snippet?')) {
        snippets = snippets.filter(s => s.id !== id);
        saveSnippets();
      }
    }

    /* ── Snippets CSV import / export ────────────────────── */
    function parseCsvFile(text) {
      var rows = [];
      var i = 0;
      var len = text.length;
      if (text.charCodeAt(0) === 0xFEFF) { i = 1; } // strip BOM
      while (i < len) {
        var fields = [];
        while (true) {
          var field = '';
          if (i < len && text[i] === '"') {
            i++;
            while (i < len) {
              if (text[i] === '"') {
                if (i + 1 < len && text[i + 1] === '"') { field += '"'; i += 2; }
                else { i++; break; }
              } else { field += text[i++]; }
            }
          } else {
            while (i < len && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') {
              field += text[i++];
            }
          }
          fields.push(field);
          if (i < len && text[i] === ',') { i++; continue; }
          if (i < len && text[i] === '\r') { i++; }
          if (i < len && text[i] === '\n') { i++; }
          break;
        }
        rows.push(fields);
      }
      var result = [];
      for (var r = 1; r < rows.length; r++) {
        var lbl = (rows[r][0] || '').trim();
        var txt = (rows[r][1] || '').trim();
        result.push({ label: lbl, text: txt });
      }
      return result;
    }

    async function exportSnippetsCsv() {
      function csvField(val) {
        var s = String(val);
        if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) {
          return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
      }
      var lines = ['label,text'];
      snippets.forEach(function (s) {
        lines.push(csvField(s.label) + ',' + csvField(s.text));
      });
      var csv = lines.join('\r\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      var today = new Date();
      var dd = String(today.getFullYear()) + '-' +
               String(today.getMonth() + 1).padStart(2, '0') + '-' +
               String(today.getDate()).padStart(2, '0');
      await FKSave.saveFile(blob, 'feedback-kitchen-snippets-' + dd + '.csv');
    }

    function importSnippetsCsv() {
      var inp = el('snippet-csv-input');
      inp.value = '';
      inp.click();
    }

    function onSnippetCsvChosen(input) {
      var file = input.files[0];
      if (!file) { return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        var rows = parseCsvFile(e.target.result);
        var seenLabels = {};
        snippets.forEach(function (s) { seenLabels[s.label.toLowerCase()] = true; });
        var countImported = 0;
        var countEmpty = 0;
        var countDupe = 0;
        rows.forEach(function (row) {
          if (!row.label || !row.text) { countEmpty++; return; }
          var key = row.label.toLowerCase();
          if (seenLabels[key]) { countDupe++; return; }
          seenLabels[key] = true;
          snippets.push({ id: SA.uid(), label: row.label, text: row.text });
          countImported++;
        });
        saveSnippets();
        alert('Imported: ' + countImported + ' · Skipped (empty): ' + countEmpty + ' · Skipped (duplicate labels): ' + countDupe);
      };
      reader.readAsText(file);
    }

    /* ── AI Garnish (beta) — Stage 0 ─────────────────────── */
    function _aiGuards() {
      if (!scoreResult || !scoreResult.rows.some(r => r.grade)) {
        alert('Grade at least one criterion before using the wording assistant.');
        return false;
      }
      const weightSum = scoreResult.rows
        .filter(function (r) { return r.grade; })
        .reduce(function (s, r) { return s + r.criterion.weight; }, 0);
      const displayWeightSum = Number.isInteger(weightSum) ? weightSum : parseFloat(weightSum.toFixed(2));
      // Over-100% is a real configuration error — keep as a hard block.
      if (Math.round(weightSum) > 100) {
        alert('Graded criteria weight ' + displayWeightSum + '% — exceeds 100%. Check your weights before using the assistant.');
        return false;
      }
      // Under-100% is a legitimate partial-mark scenario — soft confirm instead.
      if (Math.round(weightSum) < 100) {
        const proceed = confirm(
          'Only ' + displayWeightSum + '% of criteria are graded.\n\n' +
          'The assistant will generate feedback only for the criteria you have graded. The TOTAL SCORE line will reflect ' + displayWeightSum + ' out of 100, not a full 100-point mark.\n\n' +
          'Continue?'
        );
        if (!proceed) return false;
      }
      return true;
    }

    function aiBuildPrompt() {
      if (!_aiGuards()) return;
      const notes = (el('additional-comments').value || '').trim();
      let prompt = SA.buildAIGarnishPrompt(config, scoreResult, {
        markerNotes: notes,
        snippets: SA.loadSnippets()
      });
      if (typeof SA.scrubPII === 'function') {
        prompt = SA.scrubPII(prompt);
      } else {
        console.error('[PII] SA.scrubPII missing — refusing to send. Hard-refresh the page (Ctrl+Shift+R).');
        alert('Privacy guard unavailable (cached shared.js). Please hard-refresh the page (Ctrl+Shift+R) and try again.');
        throw new Error('scrubPII unavailable');
      }
      navigator.clipboard.writeText(prompt).then(function () {
        const btn = document.querySelector('[onclick="S.aiBuildPrompt()"]');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = '✓ Prompt copied!';
          setTimeout(function () { btn.textContent = orig; }, 2000);
        }
        SA.logAssistantRun({ stage: 'prompt_built', prompt: prompt, notesLen: notes.length });
      }).catch(function () {
        // Fallback: show the prompt in the AI reply box so the user can copy manually
        el('ai-prompt-builder').value = prompt;
        alert('Clipboard blocked — prompt placed in the paste box instead. Copy manually, then clear and paste the AI reply.');
      });
    }

    function aiAssembleFinal() {
      if (!_aiGuards()) return;
      const body = (el('ai-manual-suggestion').value || '').trim();
      if (!body) { alert('Paste the AI reply into the box above first.'); return; }

      const overrideRaw  = normaliseGradeInput(el('grade-override').value);
      const effectiveRes = SA.applyGradeOverride(config, scoreResult, overrideRaw);

      const final = SA.assembleFinalFeedback(config, effectiveRes, body, {
        studentName: el('student-name').value,
        lengthMode: getLengthMode()
      });
      el('ai-suggestion').value = final;

      // Same deterministic, model-independent post-check as the aiAssist
      // flow above — non-blocking, marker decides whether to act on it.
      const v = (typeof SA.getLastValidationResult === 'function')
        ? SA.getLastValidationResult()
        : null;
      if (v && !v.ok) {
        usageTrack('validation_flagged');
        showValidationBadge(v);
      } else {
        hideValidationBadge();
      }

      SA.logAssistantRun({
        stage: 'assembled', bodyLen: body.length, finalLen: final.length,
        flagged: !!(v && !v.ok), issueCount: (v && v.issues) ? v.issues.length : 0
      });
      setAIState('applied');
    }

    function aiCopyFinal() {
      const ta = el('ai-suggestion');
      if (!ta.value.trim()) { alert('Nothing to copy — generate or assemble a suggestion first.'); return; }
      navigator.clipboard.writeText(ta.value).then(function () {
        const btn = document.querySelector('[onclick="S.aiCopyFinal()"]');
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = '✓ Copied!';
          setTimeout(function () { btn.textContent = orig; }, 2000);
        }
      }).catch(function () { ta.select(); document.execCommand('copy'); });
    }

    function aiResetPanel() {
      const aiIn = el('ai-manual-suggestion');
      const aiOut = el('ai-suggestion');
      if (aiIn) { aiIn.value = ''; aiIn.dispatchEvent(new Event('input')); }
      if (aiOut) { aiOut.value = ''; aiOut.dispatchEvent(new Event('input')); }

      // Also clear the visible refine panel mirror textarea (bug fix: Clear suggestion was unresponsive)
      const aiMirror = el('refine-suggestion-mirror');
      if (aiMirror) { aiMirror.value = ''; aiMirror.dispatchEvent(new Event('input')); }

      const aiDiff = el('ai-diff-box');
      if (aiDiff) { aiDiff.innerHTML = ''; aiDiff.classList.add('hidden'); }

      const aiPrompt = el('ai-prompt-preview');
      if (aiPrompt) { aiPrompt.textContent = ''; aiPrompt.classList.add('hidden'); }

      setAIState('idle');
    }

    function aiViewLog() {
      try {
        const log = JSON.parse(localStorage.getItem('SA_AI_LOG') || '[]');
        if (!log.length) { alert('No runs logged yet.'); return; }
        const lines = log.map(function (e, i) {
          const when = e.ts ? new Date(e.ts).toLocaleString() : '—';
          return (i + 1) + '. ' + when + ' | ' + (e.stage || e.via || '?') + (e.model ? ' | ' + e.model : '') + (e.replyChars ? ' | ' + e.replyChars + ' chars' : '') + (e.flagged ? ' | ⚠ ' + e.issueCount + ' flag' + (e.issueCount === 1 ? '' : 's') : '');
        });
        alert('Last ' + log.length + ' run(s):\n\n' + lines.join('\n'));
      } catch (e) { alert('Could not read log.'); }
    }

    function aiClearLog() {
      if (!confirm('Clear the local assistant log from this browser?')) return;
      SA.clearAssistantLog();
      alert('Assistant log cleared from this browser.');
    }

    /* ── Stage 2: AI Garnish via Vercel proxy ────────────── */
    const FK_USER_KEY = 'SA_FK_USER';
    const FK_PASS_KEY = 'SA_FK_PASS';
    const FK_PROXY_ENDPOINT = '/api/garnish';

    // Sonnet is reserved for the flagship Improve feedback action
    // (improve_criterion_body and its legacy mode aliases), and only once
    // the marker already has wording-assistant credentials — the same
    // Ko-fi supporter-unlock check used by upload.html's PDF import.
    // Everything else (the manual/direct paste flow, all other modes)
    // stays on Haiku. api/garnish.js enforces this same mode check
    // server-side, so a forged request cannot get Sonnet either.
    const SONNET_MODEL_ID = 'claude-sonnet-4-6';
    const HAIKU_MODEL_ID  = 'claude-haiku-4-5-20251001';
    function isImproveFeedbackMode(mode) {
      return mode === 'improve_criterion_body' || mode === 'draft' || mode === 'improve' || mode === 'shorten';
    }

    function showAISettings() {
      const u = localStorage.getItem(FK_USER_KEY) || '';
      const p = localStorage.getItem(FK_PASS_KEY) || '';
      const uIn = el('fk-user-input'); if (uIn) uIn.value = u;
      const pIn = el('fk-pass-input'); if (pIn) pIn.value = p;
      const status = el('ai-settings-status');
      if (status) status.textContent = u ? '✓ Saved credentials detected on this browser.' : 'No credentials saved yet.';
      openModal('ai-settings-modal');
    }
    function hideAISettings() {
      closeModal('ai-settings-modal');
    }
    function saveAICreds() {
      const u = (el('fk-user-input').value || '').trim();
      const p = (el('fk-pass-input').value || '').trim();
      if (!u || !p) { alert('Please enter both username and password.'); return; }
      localStorage.setItem(FK_USER_KEY, u);
      localStorage.setItem(FK_PASS_KEY, p);
      updateAILoginBadge();
      hideAISettings();
    }
    function clearAICreds() {
      if (!confirm('Clear saved wording assistant credentials from this browser?')) return;
      localStorage.removeItem(FK_USER_KEY);
      localStorage.removeItem(FK_PASS_KEY);
      const uIn = el('fk-user-input'); if (uIn) uIn.value = '';
      const pIn = el('fk-pass-input'); if (pIn) pIn.value = '';
      const status = el('ai-settings-status');
      if (status) status.textContent = 'Credentials cleared.';
      updateAILoginBadge();
    }
    function hasAICreds() {
      return !!(localStorage.getItem(FK_USER_KEY) && localStorage.getItem(FK_PASS_KEY));
    }
    function updateAILoginBadge() {
      const icon = el('ai-settings-icon');
      const btn  = el('ai-settings-btn');
      if (!icon) return;
      const creds = hasAICreds();
      icon.textContent = creds ? '🔓' : '🔐';
      if (btn) btn.title = creds
        ? 'Wording assistant credentials saved — click to manage'
        : 'Wording assistant — add credentials to enable direct AI rewrite';
    }

    async function aiAssist(mode) {
      if (!_aiGuards()) return;
      if (!hasAICreds()) { showAISettings(); return; }

      const existingBody = extractExistingBody(el('feedback-text').value || '');
      let prompt = SA.buildAIAssistPrompt(mode, config, scoreResult, {
        markerNotes:  (el('additional-comments').value || '').trim(),
        snippets:     snippets,
        existingBody: existingBody,
        audienceMode: getAudienceMode(),
        groupName:    getGroupName(),
        lengthMode:   getLengthMode()
      });
      // Belt-and-braces: re-scrub whole prompt before sending, in case any
      // identifier slipped through via rubric descriptors or snippets.
      if (typeof SA.scrubPII === 'function') {
        prompt = SA.scrubPII(prompt);
      } else {
        console.error('[PII] SA.scrubPII missing — refusing to send. Hard-refresh the page (Ctrl+Shift+R).');
        alert('Privacy guard unavailable (cached shared.js). Please hard-refresh the page (Ctrl+Shift+R) and try again.');
        throw new Error('scrubPII unavailable');
      }

      el('ai-prompt-preview').textContent = prompt;
      refreshAIInputChips();

      setAIState('drafting');
      const buttons = ['ai-draft-from-rubric','ai-mechanical-cleanup']
        .map(id => el(id)).filter(Boolean);
      buttons.forEach(b => b.disabled = true);

      try {
        const res = await fetch(FK_PROXY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: localStorage.getItem(FK_USER_KEY),
            password: localStorage.getItem(FK_PASS_KEY),
            prompt: prompt,
            mode: mode,
            model: (hasAICreds() && isImproveFeedbackMode(mode)) ? SONNET_MODEL_ID : HAIKU_MODEL_ID
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setAIState('error'); alert(data.error || ('HTTP ' + res.status)); return; }
        const body = (data.body || '').trim();
        if (!body) { setAIState('error'); alert('Empty AI response.'); return; }

        const overrideRaw  = normaliseGradeInput(el('grade-override').value);
        const effectiveRes = SA.applyGradeOverride(config, scoreResult, overrideRaw);

        const final = SA.assembleFinalFeedback(config, effectiveRes, body, {
          studentName:   el('student-name').value,
          audienceMode:  getAudienceMode(),
          groupName:     getGroupName(),
          introOverride: getIntroOverride(),
          outroOverride: getOutroOverride(),
          lengthMode:    getLengthMode()
          // inlineValidationFlags omitted — student-facing path stays clean.
        });
        // Defensive strip in case any [VALIDATION: ...] marker leaked through.
        const cleanFinal = (typeof SA.stripValidationMarkers === 'function')
          ? SA.stripValidationMarkers(final)
          : final;
        el('ai-suggestion').value = cleanFinal;

        // Surface validation result to the marker (not the student) via
        // a small badge + telemetry. Read from the side channel.
        const v = (typeof SA.getLastValidationResult === 'function')
          ? SA.getLastValidationResult()
          : null;
        if (v && !v.ok) {
          usageTrack('validation_flagged');
          showValidationBadge(v);
        } else {
          hideValidationBadge();
        }

        const editCount = approxLineEdits(el('feedback-text').value, final);
        setAIState('applied', editCount);

        SA.logAssistantRun({
          stage: 'assistant', mode, bodyLen: body.length,
          flagged: !!(v && !v.ok), issueCount: (v && v.issues) ? v.issues.length : 0
        });
      } catch (err) {
        setAIState('error');
        alert('Network error: ' + (err && err.message ? err.message : err));
      } finally {
        buttons.forEach(b => b.disabled = false);
      }
    }

    function approxLineEdits(a, b) {
      const al = (a || '').split('\n');
      const bl = (b || '').split('\n');
      let diff = Math.abs(al.length - bl.length);
      const min = Math.min(al.length, bl.length);
      for (let i = 0; i < min; i++) if (al[i] !== bl[i]) diff++;
      return diff;
    }

    // Best-effort extraction of just the criterion body from the current feedback.
    function extractExistingBody(full) {
      if (!full) return '';
      const lines = full.split('\n');
      const totalIdx = lines.findIndex(l => l.startsWith('TOTAL SCORE:'));
      // body starts after intro paragraph(s); intro ends at the first line that matches "<text> – <num> / <num>"
      let startIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        if (/ – \d/.test(lines[i])) { startIdx = i; break; }
      }
      const endIdx = totalIdx === -1 ? lines.length : totalIdx;
      return lines.slice(startIdx, endIdx).join('\n').trim();
    }

    function aiReplaceDraft() {
      const raw = el('ai-suggestion').value;
      const out = (typeof SA.stripValidationMarkers === 'function')
        ? SA.stripValidationMarkers(raw)
        : raw;
      if (!out.trim()) { alert('Nothing to apply yet.'); return; }
      if (!confirm('Replace the main feedback textarea with this suggestion? The current text will be overwritten.')) return;
      el('feedback-text').value = out;
      lastGeneratedText = out;           // prevent merge logic from clobbering
      showCohortToast('Assistant suggestion applied to main feedback', 'green');
    }

    function aiInsertBelow() {
      // Renamed: "Merge into draft". Smart-replaces ONLY the criterion-by-criterion block,
      // preserving the marker's intro, TOTAL SCORE line, and outro from the existing draft.
      const raw = el('ai-suggestion').value;
      const out = (typeof SA.stripValidationMarkers === 'function')
        ? SA.stripValidationMarkers(raw)
        : raw;
      if (!out.trim()) { alert('Nothing to merge yet.'); return; }
      const ta = el('feedback-text');
      const current = ta.value || '';

      // If current draft is empty, just drop the whole suggestion in.
      if (!current.trim()) {
        ta.value = out;
        lastGeneratedText = out;
        showCohortToast('Suggestion merged into draft', 'green');
        return;
      }

      // Extract the criteria block from the new suggestion (between intro and TOTAL SCORE).
      const newBody = extractExistingBody(out);
      if (!newBody) {
        // Fallback: if we can't isolate a criteria block, treat as full replace.
        if (!confirm('Could not isolate the new criteria block. Replace the whole draft with the suggestion?')) return;
        ta.value = out;
        lastGeneratedText = out;
        showCohortToast('Suggestion merged into draft (full replace)', 'green');
        return;
      }

      // Splice: keep current's intro, swap criteria block, keep current's TOTAL SCORE + outro.
      const lines = current.split('\n');
      const totalIdx = lines.findIndex(l => l.startsWith('TOTAL SCORE:'));
      let startIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/ – \d/.test(lines[i])) { startIdx = i; break; }
      }

      if (startIdx === -1) {
        // No existing criteria block detected — insert above TOTAL SCORE if present, else append.
        if (totalIdx === -1) {
          ta.value = (current.trimEnd() + '\n\n' + newBody).trimStart();
        } else {
          const before = lines.slice(0, totalIdx).join('\n').trimEnd();
          const after  = lines.slice(totalIdx).join('\n');
          ta.value = (before + '\n\n' + newBody + '\n\n' + after).trimStart();
        }
      } else {
        const before = lines.slice(0, startIdx).join('\n').trimEnd();
        const endIdx = totalIdx === -1 ? lines.length : totalIdx;
        const after  = lines.slice(endIdx).join('\n');
        ta.value = (
          (before ? before + '\n\n' : '') +
          newBody +
          (after  ? '\n\n' + after : '')
        );
      }
      lastGeneratedText = ta.value;
      showCohortToast('Suggestion merged into draft', 'green');
    }

    function aiShowDiff() {
      const main  = el('feedback-text').value || '';
      const sugg  = el('ai-suggestion').value || '';
      const box   = el('ai-diff-box');
      if (!sugg.trim()) { alert('Generate a suggestion first.'); return; }
      box.classList.remove('hidden');
      box.innerHTML = renderLineDiff(main, sugg);
    }

    function renderLineDiff(a, b) {
      const al = a.split('\n'), bl = b.split('\n');
      const out = [];
      const max = Math.max(al.length, bl.length);
      for (let i = 0; i < max; i++) {
        const la = al[i] ?? '';
        const lb = bl[i] ?? '';
        if (la === lb) { out.push(escHtml(la)); }
        else {
          if (la) out.push('<span class="fk-diff-del">− ' + escHtml(la) + '</span>');
          if (lb) out.push('<span class="fk-diff-add">+ ' + escHtml(lb) + '</span>');
        }
      }
      return out.join('\n');
    }

    function aiTogglePrompt() {
      const box = el('ai-prompt-preview');
      if (!box) return;
      box.classList.toggle('hidden');
    }

    function refreshAIInputChips() {
      const box = el('ai-input-chips');
      if (!box) return;
      const graded  = (studentGrades || []).filter(g => g && g.grade).length;
      const total   = config && config.criteria ? config.criteria.length : 0;
      const notesText = (el('additional-comments').value || '').trim();
      const fbText = (el('feedback-text').value || '').trim();
      const combinedText = notesText + '\n' + fbText;
      const notesLen = notesText.length;
      const snipCount = (snippets || []).filter(s => s.text && combinedText.includes(s.text)).length;
      const penaltyOn = parseInt(el('late-penalty-select').value || '0', 10) > 0;

      const chip = (label, ok) =>
        `<span class="px-2 py-0.5 rounded-full border text-[10px] font-semibold ${ok ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'}">${label}</span>`;

      box.innerHTML = [
        chip(graded + '/' + total + ' grades', graded > 0),
        chip('Rubric descriptors', graded > 0),
        chip(notesLen ? notesLen + ' chars notes' : 'No notes', notesLen > 0),
        chip(snipCount === 1 ? '1 snippet' : snipCount + ' snippets', snipCount > 0),
        chip(penaltyOn ? 'Penalty context' : 'No penalty', penaltyOn)
      ].join(' ');
    }

    async function aiGarnishDirect() {
      const guard = _aiGuards();
      if (!guard) return;
      if (!hasAICreds()) {
        alert('No credentials saved. Click "Wording key" in the nav bar to enter them.');
        showAISettings();
        return;
      }

      let prompt = SA.buildAIGarnishPrompt(lastConfig, lastScoreResult, {
        markerNotes: (el('additional-comments').value || '').trim(),
        snippets: snippets
      });
      if (typeof SA.scrubPII === 'function') {
        prompt = SA.scrubPII(prompt);
      } else {
        console.error('[PII] SA.scrubPII missing — refusing to send. Hard-refresh the page (Ctrl+Shift+R).');
        alert('Privacy guard unavailable (cached shared.js). Please hard-refresh the page (Ctrl+Shift+R) and try again.');
        throw new Error('scrubPII unavailable');
      }

      const btn = el('ai-garnish-direct-btn');
      const originalLabel = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Calling Claude…'; }

      try {
        const res = await fetch(FK_PROXY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: localStorage.getItem(FK_USER_KEY),
            password: localStorage.getItem(FK_PASS_KEY),
            prompt: prompt,
            // This is the general manual/direct-paste flow — no mode, so it
            // stays on Haiku; Sonnet is reserved for improve_criterion_body
            // in aiAssist above.
            model: HAIKU_MODEL_ID
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 401) {
            alert('Invalid username or password. Click "Wording key" to update.');
            showAISettings();
          } else if (res.status === 429) {
            alert('Rate limit hit — wait a moment and try again.\n\n' + (data.error || ''));
          } else {
            alert('Assistant error:\n\n' + (data.error || 'HTTP ' + res.status));
          }
          return;
        }
        const body = (data.body || '').trim();
        if (!body) { alert('Empty response from AI. Try again, or use the copy-paste workflow.'); return; }

        el('ai-manual-suggestion').value = body;

        // Usage telemetry: fires only on a successful, non-empty rewrite — not
        // on auth failures, rate limits or empty responses, so the count means
        // "the assistant produced usable wording". Model and prompt size only;
        // no prompt or response text is sent.
        if (typeof gtag === 'function') {
          gtag('event', 'wording_assistant_used', {
            event_category: 'workflow',
            model: data.model || HAIKU_MODEL_ID,
            prompt_chars: prompt.length
          });
        }

        // Log the run (same store used by the copy-paste flow)
        SA.logAssistantRun({
          when: new Date().toISOString(),
          student: (lastConfig && lastScoreResult) ? (el('student-name').value || '') : '',
          model: data.model || HAIKU_MODEL_ID,
          promptChars: prompt.length,
          replyChars: body.length,
          via: 'direct'
        });

        // Auto-assemble final so the user sees the stitched result immediately
        aiAssembleFinal();
        const aiPanel = document.getElementById('sec-ai');
        if (aiPanel && !aiPanel.open) aiPanel.open = true;
      } catch (err) {
        alert('Network error contacting the proxy:\n\n' + (err && err.message ? err.message : err));
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = originalLabel; }
      }
    }

    function bindKeyboardShortcuts() {
      function isEditing() {
        const t = document.activeElement;
        if (!t) return false;
        const tag = t.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
      }

      function closeAnyOpenModal() {
        ['new-student-modal', 'cohort-setup-modal', 'cohort-list-modal',
         'cohort-wipe-modal', 'modexport-optin-modal', 'modexport-block-modal',
         'cohort-insights-modal', 'bulk-fill-threshold-modal', 'snippets-modal',
         'ai-settings-modal', 'shortcuts-modal', 'scorer-settings-modal']
          .forEach(function (id) { closeModal(id); });
      }

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          const active = document.activeElement;
          const tag = active && active.tagName;
          const editing = active && (tag === 'INPUT' || tag === 'TEXTAREA' || active.isContentEditable);
          if (!editing) {
            closeAnyOpenModal();
          }
          return;
        }

        // Focus mode: PageDown / PageUp step between criteria.
        // Skip when the caret is in the feedback body so the textarea pages normally.
        if (focusMode && (e.key === 'PageDown' || e.key === 'PageUp')) {
          const a = document.activeElement;
          if (a && a.id === 'focus-body') return;
          e.preventDefault();
          if (e.key === 'PageDown') focusNext(); else focusPrev();
          return;
        }

        // ? — open shortcuts modal (only if not editing)
        if (e.key === '?' && !e.ctrlKey && !e.metaKey && !isEditing()) {
          e.preventDefault();
          const m = document.getElementById('shortcuts-modal');
          if (m) openModal ? openModal('shortcuts-modal', document.activeElement) : m.classList.remove('hidden');
          return;
        }

        // Ctrl/Cmd + Shift + <letter>
        const mod = (e.ctrlKey || e.metaKey) && e.shiftKey;
        if (!mod) return;
        const key = e.key.toLowerCase();

        if (key === 'c') { e.preventDefault(); copyFeedback(); return; }
        if (key === 'e') { e.preventDefault(); downloadExcel(); return; }
        if (key === 'x') { e.preventDefault(); exportCohort(); return; }
        if (key === 'n') { e.preventDefault(); newStudent(); return; }
      });
    }

    function setAllDetails(open) {
      document.querySelectorAll('main details').forEach(function (d) {
        if (d.id === 'focus-draft-pane') return;   // FK-14: per-look toggle, not a section
        d.open = !!open;
      });
      persistSectionState();
    }

    const SECTION_STATE_KEY = 'SA_SECTION_STATE_V1';

    function persistSectionState() {
      const state = {};
      document.querySelectorAll('main details').forEach(function (d) {
        if (!d.id || d.id === 'focus-draft-pane') return;   // FK-14: never persist the pane
        state[d.id] = !!d.open;
      });
      try { localStorage.setItem(SECTION_STATE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function restoreSectionState() {
      let state = null;
      try { 
        const raw = localStorage.getItem(SECTION_STATE_KEY);
        if (raw) state = JSON.parse(raw);
      } catch (e) {}
      
      if (!state || Object.keys(state).length === 0) return;

      document.querySelectorAll('main details').forEach(function (d) {
        if (!d.id || d.id === 'focus-draft-pane') return;   // FK-14: always starts collapsed
        if (d.id in state) d.open = !!state[d.id];
      });
    }

    function wireSectionStatePersistence() {
      document.querySelectorAll('main details').forEach(function (d) {
        if (!d.id) return;
        d.addEventListener('toggle', persistSectionState);
      });
    }

    /* ── Wording-assistant explainer panels: individual collapse state ── */
    const AI_EXPLAINER_KEY = 'SA_AI_EXPLAINER_STATE_V1';

    function persistExplainerState() {
      const state = {};
      document.querySelectorAll('.ai-explainer[data-explainer]').forEach(function (d) {
        state[d.dataset.explainer] = !!d.open;
      });
      try { localStorage.setItem(AI_EXPLAINER_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function restoreExplainerState() {
      let state = null;
      try {
        const raw = localStorage.getItem(AI_EXPLAINER_KEY);
        if (raw) state = JSON.parse(raw);
      } catch (e) {}
      if (!state) return;
      document.querySelectorAll('.ai-explainer[data-explainer]').forEach(function (d) {
        const key = d.dataset.explainer;
        if (key in state) d.open = !!state[key];
      });
      refreshExplainerToggleLabel();
    }

    function wireExplainerPersistence() {
      document.querySelectorAll('.ai-explainer[data-explainer]').forEach(function (d) {
        d.addEventListener('toggle', function () {
          persistExplainerState();
          refreshExplainerToggleLabel();
        });
      });
    }

    function aiToggleAllExplainers() {
      const panels = document.querySelectorAll('.ai-explainer[data-explainer]');
      const anyOpen = Array.from(panels).some(function (d) { return d.open; });
      panels.forEach(function (d) { d.open = !anyOpen; });
      persistExplainerState();
      refreshExplainerToggleLabel();
    }

    function refreshExplainerToggleLabel() {
      const btn = document.getElementById('ai-explainer-toggle-all');
      if (!btn) return;
      const panels = document.querySelectorAll('.ai-explainer[data-explainer]');
      const anyOpen = Array.from(panels).some(function (d) { return d.open; });
      btn.textContent = anyOpen ? 'Collapse all explainers' : 'Expand all explainers';
    }

    /* ============================================================
       Wording refinement (folded F → D) + settings + usage instrumentation
       ============================================================ */

    /* ── Settings (scorer-level prefs) ──────────────────────── */
    const SCORER_SETTINGS_KEY = 'SA_SCORER_SETTINGS_V1';
    function getSetting(key, fallback) {
      try {
        const raw = localStorage.getItem(SCORER_SETTINGS_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        return (key in obj) ? obj[key] : fallback;
      } catch (e) { return fallback; }
    }
    function setSetting(key, value) {
      try {
        const raw = localStorage.getItem(SCORER_SETTINGS_KEY);
        const obj = raw ? JSON.parse(raw) : {};
        obj[key] = value;
        localStorage.setItem(SCORER_SETTINGS_KEY, JSON.stringify(obj));
      } catch (e) {}
    }

    /* ── Usage instrumentation (privacy-respecting, local-only) ── */
    const USAGE_KEY = 'scorer.usage.v1';
    const USAGE_EVENTS = [
      'wording_panel_opened',
      'used_improve_feedback',
      'used_mechanical_cleanup',
      'validation_flagged',
      // Legacy counters retained for historical data; new events route to the two above.
      'used_clarity_tone',
      'used_concise',
      'used_draft_from_rubric',
      'advanced_setting_enabled',
      'advanced_disclosure_opened',
      'used_manual_fallback',
      'used_build_prompt',
      'viewed_local_run_log',
      'used_bulk_fill',
      'bulk_fill_threshold_warned'
    ];
    function usageInit() {
      try {
        const raw = localStorage.getItem(USAGE_KEY);
        if (raw) return;
        const seed = {
          version: 1,
          installedAt: new Date().toISOString(),
          events: {},
          session: { studentsMarkedTotal: 0 }
        };
        USAGE_EVENTS.forEach(function (n) {
          seed.events[n] = { count: 0, lastUsed: null };
        });
        localStorage.setItem(USAGE_KEY, JSON.stringify(seed));
      } catch (e) {}
    }
    function usageTrack(eventName) {
      try {
        const raw = localStorage.getItem(USAGE_KEY);
        const data = raw ? JSON.parse(raw) : null;
        if (!data || !data.events || !data.events[eventName]) return;
        data.events[eventName].count = (data.events[eventName].count || 0) + 1;
        data.events[eventName].lastUsed = new Date().toISOString();
        localStorage.setItem(USAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    }

    /* ── Refine wording panel (mirrors legacy F controls into D) ── */
    function toggleRefinePanel() {
      const panel  = document.getElementById('refine-wording-panel');
      const btn    = document.getElementById('refine-wording-toggle');
      if (!panel || !btn) return;
      const opening = panel.classList.contains('hidden');
      panel.classList.toggle('hidden');
      btn.setAttribute('aria-expanded', opening ? 'true' : 'false');
      if (opening) {
        usageTrack('wording_panel_opened');
        // Sync mirror from canonical ai-suggestion textarea on open
        const mirror = document.getElementById('refine-suggestion-mirror');
        const canon  = document.getElementById('ai-suggestion');
        if (mirror && canon) mirror.value = canon.value || '';
        // Render advanced shell based on setting
        applyAdvancedToolsVisibility();
      }
    }

    function refineAction(mode) {
      // Delegate to existing aiAssist logic; track which control was used.
      // Legacy mode names ('draft', 'improve', 'shorten') map to the unified
      // mode in shared.js; track them under a single counter for telemetry.
      if (mode === 'improve_criterion_body' || mode === 'draft' || mode === 'improve' || mode === 'shorten') {
        usageTrack('used_improve_feedback');
      }
      // After aiAssist resolves, sync the mirror textarea
      const promise = aiAssist(mode);
      const sync = function () {
        const mirror = document.getElementById('refine-suggestion-mirror');
        const canon  = document.getElementById('ai-suggestion');
        if (mirror && canon) mirror.value = canon.value || '';
      };
      if (promise && typeof promise.then === 'function') {
        promise.then(sync, sync);
      } else {
        setTimeout(sync, 600);
      }
    }

    /* ── Validation badge (marker-only) ───────────────────────
       Surfaces validateAIBody() issues to the marker without
       leaking technical text into student-facing output. The
       suggestion textarea always shows clean text; the badge
       is a separate visual element above it.

       FK-13 pattern (WCAG 2.1 AA 4.1.3 Status Messages): the badge
       carries role="status" + aria-live="polite" in markup so screen
       readers hear the flag when it appears, not just see it.
       _lastValidationAnnouncement de-dupes so an unrelated re-render
       with the identical message doesn't announce twice, but a
       genuine re-trigger from a hidden state (hideValidationBadge
       resets it) still gets a fresh announcement — same convention
       as _announceScoreResult's clear-then-set, adapted for a
       click-triggered (not chatty/per-keystroke) element, so no
       debounce timer is needed here.
    ─────────────────────────────────────────────────────────── */
    let _lastValidationAnnouncement = '';
    function showValidationBadge(result) {
      const badge = document.getElementById('validation-badge');
      const text  = document.getElementById('validation-badge-text');
      const det   = document.getElementById('validation-badge-details');
      if (!badge || !text || !det) return;
      const flagCount = (result.issues || []).length;
      const overuse   = (result.overusedVerbs || []).length;
      const summary = [];
      if (flagCount) summary.push(flagCount + ' criterion ' + (flagCount === 1 ? 'flag' : 'flags'));
      if (overuse)   summary.push((result.overusedVerbs || []).join('/') + ' overused');
      const msg = ' Suggestion has ' + (summary.join(', ') || 'minor issues') + '. Review before sending.';
      // De-dupe: an identical message already live gets cleared first so a
      // genuine repeat still re-announces instead of being silently dropped.
      if (msg === _lastValidationAnnouncement) text.textContent = '';
      _lastValidationAnnouncement = msg;
      text.textContent = msg;
      det.textContent = (result.issues || []).map(function (i) {
        return '• ' + i.criterion + ': ' + (i.messages || []).join('; ');
      }).join('\n') + (overuse ? '\n• verb overuse: ' + result.overusedVerbs.join(', ') : '');
      det.classList.add('hidden');
      badge.classList.remove('hidden');
    }
    function hideValidationBadge() {
      const badge = document.getElementById('validation-badge');
      if (badge) badge.classList.add('hidden');
      _lastValidationAnnouncement = '';
    }
    function toggleValidationDetails() {
      const det = document.getElementById('validation-badge-details');
      if (det) det.classList.toggle('hidden');
    }

    /* ── Mechanical clean-up (no AI) ──────────────────────────
       Runs the deterministic post-processor over the marker's
       existing draft. No Haiku call, no cost, no latency.
       Used when a marker has hand-written comments and just
       wants punctuation, decimals, and AU/NZ spelling tidied.
       Telemetry: counts each invocation so we can decide later
       whether the affordance is worth keeping (target: >=10%
       of marker sessions).
    ─────────────────────────────────────────────────────────── */
    function mechanicalCleanup() {
      usageTrack('used_mechanical_cleanup');
      const draftEl = document.getElementById('feedback-text');
      const suggestionEl = document.getElementById('ai-suggestion');
      const mirrorEl = document.getElementById('refine-suggestion-mirror');
      const draft = (draftEl && draftEl.value || '').trim();
      if (!draft) {
        alert('No draft to clean up. Generate or paste feedback into the editable draft first.');
        return;
      }
      // Extract just the criterion body (between intro and TOTAL SCORE) so we
      // don't disturb scorer-managed sections.
      const body = (typeof extractExistingBody === 'function')
        ? extractExistingBody(draft)
        : draft;
      const cleanedBody = SA.postProcessAIBody(body, config);
      // Run validator and surface via the marker-only badge — never inline.
      let validation = null;
      if (typeof SA.validateAIBody === 'function') {
        validation = SA.validateAIBody(cleanedBody, { lengthMode: getLengthMode() });
      }
      // Defensive strip in case the draft contained legacy [VALIDATION: ...] text.
      const display = (typeof SA.stripValidationMarkers === 'function')
        ? SA.stripValidationMarkers(cleanedBody)
        : cleanedBody;
      if (suggestionEl) suggestionEl.value = display;
      if (mirrorEl) mirrorEl.value = display;
      if (validation && !validation.ok) {
        usageTrack('validation_flagged');
        showValidationBadge(validation);
      } else {
        hideValidationBadge();
      }
      setAIState && setAIState('ready');
    }

    function refineMirrorInput() {
      // Keep canonical hidden ai-suggestion in sync with the visible mirror
      const mirror = document.getElementById('refine-suggestion-mirror');
      const canon  = document.getElementById('ai-suggestion');
      if (mirror && canon) canon.value = mirror.value;
    }

    /* ── Advanced tools visibility (gated by setting) ───────── */
    function applyAdvancedToolsVisibility() {
      const enabled = !!getSetting('showAdvancedWordingTools', false);
      // Inline shell inside D
      const shell = document.getElementById('refine-advanced-shell');
      if (shell) shell.classList.toggle('hidden', !enabled);
      // Legacy F section
      const legacy = document.getElementById('sec-ai');
      if (legacy) legacy.style.display = enabled ? '' : 'none';
      // Settings checkbox (if present in modal)
      const cb = document.getElementById('setting-show-advanced-wording');
      if (cb) cb.checked = enabled;
    }
    function setShowAdvancedWordingTools(on) {
      setSetting('showAdvancedWordingTools', !!on);
      if (on) usageTrack('advanced_setting_enabled');
      applyAdvancedToolsVisibility();
    }

    /* ── Phase 3 + 5: Audience & Length (per-browser) ───────── */
    const AUDIENCE_KEY = 'SA_AUDIENCE_MODE';
    const LENGTH_KEY   = 'SA_LENGTH_MODE';
    const GROUP_NAME_KEY = 'SA_GROUP_NAME';

    function getAudienceMode() {
      const v = localStorage.getItem(AUDIENCE_KEY);
      if (v === 'group' || v === 'group-named') return v;
      return 'individual';
    }
    function setAudienceMode(mode) {
      const m = (mode === 'group' || mode === 'group-named') ? mode : 'individual';
      localStorage.setItem(AUDIENCE_KEY, m);
      const wrap = el('group-name-wrap');
      // Group name input visible for both group modes; only used by 'group-named'.
      const showGroupField = (m === 'group' || m === 'group-named');
      if (wrap) wrap.classList.toggle('hidden', !showGroupField);
      // Re-render so audience swaps take effect immediately
      try { regenerateFeedback(); } catch (e) {}
    }
    function getLengthMode() {
      const v = localStorage.getItem(LENGTH_KEY);
      return (v === 'standard') ? 'standard' : 'brief';
    }
    function setLengthMode(mode) {
      const m = (mode === 'standard') ? 'standard' : 'brief';
      localStorage.setItem(LENGTH_KEY, m);
    }
    function getGroupName() {
      return localStorage.getItem(GROUP_NAME_KEY) || '';
    }
    function setGroupName(val) {
      localStorage.setItem(GROUP_NAME_KEY, (val || '').trim());
    }

    /* ── Phase 4: Intro/Outro overrides (per-scorer) ─────────── */
    function introOutroKey() {
      const id = (config && config.id) ? config.id : 'unknown';
      return 'SA_INTROOUTRO_' + id;
    }
    function readIntroOutro() {
      try {
        const raw = localStorage.getItem(introOutroKey());
        return raw ? JSON.parse(raw) : { intro: '', outro: '' };
      } catch (e) { return { intro: '', outro: '' }; }
    }
    function writeIntroOutro(obj) {
      try { localStorage.setItem(introOutroKey(), JSON.stringify(obj || {})); } catch (e) {}
    }
    function getIntroOverride() { return (readIntroOutro().intro || '').trim(); }
    function getOutroOverride() { return (readIntroOutro().outro || '').trim(); }
    function setIntroOverride(val) {
      const cur = readIntroOutro();
      cur.intro = val || '';
      writeIntroOutro(cur);
      flashIntroOutroStatus(val ? 'Intro override saved.' : 'Intro override cleared (using default).');
      try { regenerateFeedback(); } catch (e) {}
    }
    function setOutroOverride(val) {
      const cur = readIntroOutro();
      cur.outro = val || '';
      writeIntroOutro(cur);
      flashIntroOutroStatus(val ? 'Outro override saved.' : 'Outro override cleared (using default).');
      try { regenerateFeedback(); } catch (e) {}
    }
    function resetIntroOutroOverrides() {
      writeIntroOutro({ intro: '', outro: '' });
      const i = el('intro-override'); if (i) i.value = '';
      const o = el('outro-override'); if (o) o.value = '';
      flashIntroOutroStatus('Reverted to grade-band defaults.');
      try { regenerateFeedback(); } catch (e) {}
    }
    let _introOutroFlashT = null;
    function flashIntroOutroStatus(msg) {
      const s = el('intro-outro-status');
      if (!s) return;
      s.textContent = msg;
      if (_introOutroFlashT) clearTimeout(_introOutroFlashT);
      _introOutroFlashT = setTimeout(() => { s.textContent = ''; }, 2500);
    }

    function applyAudienceLengthIntroOutroToUI() {
      const aud = getAudienceMode();
      const len = getLengthMode();
      const audSel = el('audience-mode'); if (audSel) audSel.value = aud;
      const lenSel = el('length-mode');   if (lenSel) lenSel.value = len;
      const wrap = el('group-name-wrap'); if (wrap) wrap.classList.toggle('hidden', aud !== 'group');
      const gn = el('group-name'); if (gn) gn.value = getGroupName();
      const io = readIntroOutro();
      const i = el('intro-override'); if (i) i.value = io.intro || '';
      const o = el('outro-override'); if (o) o.value = io.outro || '';
    }

    /* ── Bulk-fill visibility (hidden by default; reveal via ?bulk=on) ───
       Default off — too tempting to skip detailed grading. Enable per-browser via:
         ?bulk=on   → persistently shows the bulk-fill bar
         ?bulk=off  → hides it again
       Flag is persisted in localStorage under SA_BULK_FILL_VISIBLE.
    */
    const BULK_FILL_VISIBLE_KEY = 'SA_BULK_FILL_VISIBLE';
    function applyBulkFillVisibility() {
      try {
        const params = new URLSearchParams(window.location.search);
        const flag = params.get('bulk');
        if (flag === 'on')  localStorage.setItem(BULK_FILL_VISIBLE_KEY, '1');
        if (flag === 'off') localStorage.removeItem(BULK_FILL_VISIBLE_KEY);
      } catch (e) {}
      const visible = localStorage.getItem(BULK_FILL_VISIBLE_KEY) === '1';
      const bar = el('bulk-fill-bar');
      if (!bar) return;
      if (visible) {
        // Restore the original Tailwind 'flex' display the bar was designed with
        bar.classList.remove('hidden');
        bar.classList.add('flex');
      } else {
        bar.classList.add('hidden');
        bar.classList.remove('flex');
      }
    }

    /* ── Local stats page (?view=local-stats; legacy ?diag=usage) ── */
    function maybeRenderDiagUsage() {
      try {
        const params = new URLSearchParams(window.location.search);
        const isLocalStats = params.get('view') === 'local-stats' || params.get('diag') === 'usage';
        if (!isLocalStats) return;
        const raw = localStorage.getItem(USAGE_KEY);
        const data = raw ? JSON.parse(raw) : { events: {} };
        let html = '<div style="font-family:system-ui,Segoe UI,sans-serif;max-width:760px;margin:32px auto;padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">';
        html += '<h1 style="font-size:18px;margin:0 0 12px;">Feature use (this device)</h1>';
        html += '<p style="font-size:12px;color:#475569;margin:0 0 16px;">Local feature counters stored in this browser only. Useful for support — never transmitted. Installed: ' + (data.installedAt || '—') + '</p>';
        html += '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:6px 4px;">Event</th><th style="text-align:right;border-bottom:1px solid #e5e7eb;padding:6px 4px;">Count</th><th style="text-align:left;border-bottom:1px solid #e5e7eb;padding:6px 4px;">Last used</th></tr></thead><tbody>';
        USAGE_EVENTS.forEach(function (k) {
          const ev = (data.events && data.events[k]) || { count: 0, lastUsed: null };
          html += '<tr><td style="padding:6px 4px;border-bottom:1px solid #f1f5f9;">' + k + '</td><td style="padding:6px 4px;border-bottom:1px solid #f1f5f9;text-align:right;">' + (ev.count || 0) + '</td><td style="padding:6px 4px;border-bottom:1px solid #f1f5f9;">' + (ev.lastUsed || '—') + '</td></tr>';
        });
        html += '</tbody></table>';
        html += '<div style="margin-top:16px;display:flex;gap:8px;">';
        html += '<button id="diag-copy" style="padding:6px 12px;border:1px solid #cbd5e1;background:#f8fafc;border-radius:6px;font-size:12px;cursor:pointer;">Copy usage JSON</button>';
        html += '<button id="diag-reset" style="padding:6px 12px;border:1px solid #fecaca;background:#fef2f2;color:#b91c1c;border-radius:6px;font-size:12px;cursor:pointer;">Reset counters</button>';
        html += '<a href="' + window.location.pathname + (window.location.search.replace(/[?&](diag=usage|view=local-stats)/g,'') || '') + '" style="padding:6px 12px;border:1px solid #cbd5e1;background:#fff;border-radius:6px;font-size:12px;text-decoration:none;color:#0f172a;">Back to scorer</a>';
        html += '</div></div>';
        document.body.innerHTML = html;
        document.getElementById('diag-copy').addEventListener('click', function () {
          navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(function () {
            this.textContent = 'Copied ✓';
          }.bind(this)).catch(function () {});
        });
        document.getElementById('diag-reset').addEventListener('click', function () {
          if (!confirm('Reset all usage counters? This cannot be undone.')) return;
          localStorage.removeItem(USAGE_KEY);
          usageInit();
          window.location.reload();
        });
      } catch (e) { /* no-op */ }
    }

    // Run diag check + usage init early
    usageInit();
    document.addEventListener('DOMContentLoaded', function () {
      maybeRenderDiagUsage();
      applyAdvancedToolsVisibility();
      try { applyCohortConsistencyVisibility(); } catch (e) {} // FK-12: sync settings checkbox + badge
      try { applyClearTutorSetting(); } catch (e) {}           // FK-33: sync the clear-tutor settings checkbox
      try { applyMoodleSetting(); } catch (e) {}               // FK-48: sync the Moodle checkbox + entry-point visibility
    });

    /* ── Wrap legacy advanced-tool calls so we instrument them ── */
    const _origAiBuildPrompt = aiBuildPrompt;
    aiBuildPrompt = function () { usageTrack('used_build_prompt'); return _origAiBuildPrompt.apply(this, arguments); };
    const _origAiAssembleFinal = aiAssembleFinal;
    aiAssembleFinal = function () { usageTrack('used_manual_fallback'); return _origAiAssembleFinal.apply(this, arguments); };
    const _origAiViewLog = aiViewLog;
    aiViewLog = function () { usageTrack('viewed_local_run_log'); return _origAiViewLog.apply(this, arguments); };

    return { init, onGradeChange, onGradeRowReviewed, bulkFillUngraded, undoBulkFill, hideBulkFillThresholdModal, onOverrideChange, onOverrideFocus, onOverridePrime, onOverrideKeydown, onStudentChange, onOverrideGrade, onPenaltyChange,
             recalculate, updateFeedback, regenerateFeedback, copyFeedback, downloadExcel, newStudent, confirmNewStudent, setRounding,
             resumeDraft, discardDraft,
             insertSnippet, showSnippetModal, hideSnippetModal, addSnippet, deleteSnippet,
             importSnippetsCsv, exportSnippetsCsv, onSnippetCsvChosen,
             aiBuildPrompt, aiAssembleFinal, aiCopyFinal, aiResetPanel, aiClearLog, aiViewLog,
             showAISettings, hideAISettings, saveAICreds, clearAICreds, aiGarnishDirect, updateAILoginBadge,
             aiAssist, aiReplaceDraft, aiInsertBelow, aiShowDiff, aiTogglePrompt,
             // Refine panel + settings + usage
             toggleRefinePanel, refineAction, refineMirrorInput, mechanicalCleanup,
             showValidationBadge, hideValidationBadge, toggleValidationDetails,
             setShowAdvancedWordingTools, applyAdvancedToolsVisibility,
             // Phase 3 + 5: audience / length / group name
             setAudienceMode, setLengthMode, setGroupName,
             // Phase 4: per-scorer intro/outro overrides
             setIntroOverride, setOutroOverride, resetIntroOutroOverrides,
             usageTrack,
             // Cohort API
             exportCohort, renameCohort, confirmClearCohort, viewCohortList, removeCohortStudent,
             openCohortRecord, loadCohortRecordIntoSession,
             // FK-53: save the current student and open the next one still to mark
             saveAndNextStudent, refreshSaveNextVisibility,
             hideCohortListModal, hideCohortSetupModal, hideCohortWipeModal, wipeCohortAfterExport,
             refreshCohortUI, refreshStickySummary, refreshAIInputChips,
             // FK-19: Moodle worksheet import
             openMoodleImport, onMoodleFileChosen, mwAssignId, mwIgnore, mwToggleFilter, mwCancel, mwCommit,
             setMoodleEnabled, applyMoodleVisibility,
             openMoodleExport, mwExportChoose, onMoodleExportFileChosen,
             // Moderation Export — opt-in & gating (issue #2)
             showModExportOptIn, hideModExportOptIn, confirmModExportOptIn,
             disableModExport, runModExport,
             showModExportBlock, hideModExportBlock,
             refreshModExportUI,
             // Rubric drift indicator (FK-25)
             refreshRubricDriftUI,
             // Cohort consistency indicator (FK-12)
             refreshCohortConsistencyUI, applyCohortConsistencyVisibility, setShowCohortConsistency,
             // FK-33: tutor shared-machine safety
             switchTutor, updateMarkingAs, setClearTutorBetweenStudents, applyClearTutorSetting,
             // Cohort Insights (Phase 1)
             showCohortInsights, hideCohortInsights, copyCohortInsights,
             setAllDetails, persistSectionState, restoreSectionState,
             aiToggleAllExplainers,
             // Focus mode (criterion-by-criterion workspace)
             toggleFocusMode, focusPrev, focusNext, focusOnGrade, focusOnOverride,
             focusOnOverridePrime, focusOnOverrideKeydown,
             focusOnBodyInput,
             // Modal accessibility (PR #14)
             openModal, closeModal };
  })();

  document.addEventListener('DOMContentLoaded', S.init);
  
