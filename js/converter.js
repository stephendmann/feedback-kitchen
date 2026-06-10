/* ============================================================
   Feedback Kitchen — Manual-to-Scorer Converter (converter.js)
   Orchestrates the detect → select → extract → review → export flow.
   Depends on shared.js (SA global) being loaded first.
   ============================================================ */

(function () {
  'use strict';

  // ── State ────────────────────────────────────────────────────
  const state = {
    pdfBase64: null,
    fileName: null,
    assessments: [],        // from detect
    selectedAssessment: null,
    draft: null,
    warnings: [],
    confidence: null,
    credUser: '',
    credPass: ''
  };

  // ── Credential persistence (sessionStorage) ─────────────────
  function loadCreds() {
    state.credUser = sessionStorage.getItem('fk_conv_user') || '';
    state.credPass = sessionStorage.getItem('fk_conv_pass') || '';
    const u = document.getElementById('cred-user');
    const p = document.getElementById('cred-pass');
    if (u && state.credUser) u.value = state.credUser;
    if (p && state.credPass) p.value = state.credPass;
  }

  function saveCreds() {
    const u = document.getElementById('cred-user');
    const p = document.getElementById('cred-pass');
    if (u) { state.credUser = u.value.trim(); sessionStorage.setItem('fk_conv_user', state.credUser); }
    if (p) { state.credPass = p.value;       sessionStorage.setItem('fk_conv_pass', state.credPass); }
  }

  // ── UI helpers ───────────────────────────────────────────────
  function show(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }

  function hide(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function showGlobalError(msg) {
    const el = document.getElementById('global-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
  }

  function hideGlobalError() {
    const el = document.getElementById('global-error');
    if (el) el.classList.add('hidden');
  }

  // ── File upload handling ─────────────────────────────────────
  function handleDragOver(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.add('drag-over');
  }

  function handleDragLeave() {
    document.getElementById('drop-zone').classList.remove('drag-over');
  }

  function handleDrop(e) {
    e.preventDefault();
    document.getElementById('drop-zone').classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  function processFile(file) {
    hideGlobalError();
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showGlobalError('Please upload a PDF file. DOCX support is coming soon.');
      return;
    }
    const MB = file.size / (1024 * 1024);
    if (MB > 6) {
      showGlobalError(`File is ${MB.toFixed(1)} MB — please use a PDF under 6 MB for best results.`);
      return;
    }

    state.fileName = file.name;
    setText('file-name', file.name);
    setText('file-size', `${MB.toFixed(1)} MB`);
    show('file-info');
    document.getElementById('drop-zone').classList.add('has-file');

    const reader = new FileReader();
    reader.onload = function (e) {
      // Strip the data URL prefix to get raw base64
      const dataUrl = e.target.result;
      state.pdfBase64 = dataUrl.split(',')[1];
    };
    reader.readAsDataURL(file);
  }

  // ── API calls ────────────────────────────────────────────────
  async function apiCall(payload) {
    const res = await fetch('/api/parse-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Server error (${res.status})`);
    }
    return data;
  }

  // ── Detect ───────────────────────────────────────────────────
  async function runDetect() {
    saveCreds();
    hideGlobalError();

    if (!state.pdfBase64) {
      showGlobalError('Please select a PDF file first.');
      return;
    }
    if (!state.credUser || !state.credPass) {
      showGlobalError('Please enter your access credentials.');
      return;
    }

    setLoadingState('Scanning document for assessments…');

    try {
      const data = await apiCall({
        user: state.credUser,
        password: state.credPass,
        mode: 'detect',
        pdfBase64: state.pdfBase64,
        fileName: state.fileName
      });

      state.assessments = data.assessments || [];
      clearLoadingState();
      renderAssessmentList();

    } catch (err) {
      clearLoadingState();
      showGlobalError(err.message || 'Detection failed. Please try again.');
    }
  }

  // ── Extract ──────────────────────────────────────────────────
  async function runExtract(assessmentTitle) {
    state.selectedAssessment = assessmentTitle;
    hideGlobalError();
    hide('review-section');
    setLoadingState(`Extracting scorer for "${assessmentTitle}"…`);

    try {
      const data = await apiCall({
        user: state.credUser,
        password: state.credPass,
        mode: 'extract',
        pdfBase64: state.pdfBase64,
        fileName: state.fileName,
        assessmentTitle
      });

      state.draft = data.draft;
      state.warnings = data.warnings || [];
      state.confidence = data.confidence;

      clearLoadingState();
      renderReviewSection();

    } catch (err) {
      clearLoadingState();
      showGlobalError(err.message || 'Extraction failed. Please try again.');
    }
  }

  // ── Loading state ────────────────────────────────────────────
  function setLoadingState(msg) {
    setText('loading-msg', msg);
    show('loading-indicator');
    const btn = document.getElementById('btn-detect');
    if (btn) btn.disabled = true;
  }

  function clearLoadingState() {
    hide('loading-indicator');
    const btn = document.getElementById('btn-detect');
    if (btn) btn.disabled = false;
  }

  // ── Assessment list rendering ────────────────────────────────
  function renderAssessmentList() {
    const container = document.getElementById('assessment-list');
    if (!container) return;

    if (state.assessments.length === 0) {
      container.innerHTML = '<p class="text-slate-500 text-sm">No assessments detected. Try a different PDF.</p>';
      show('detect-results');
      return;
    }

    const cards = state.assessments.map(a => {
      const likelihoodPct = Math.round((a.rubricLikelihood || 0) * 100);
      const isExportable = a.exportable === true;

      const badge = isExportable
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Exportable</span>`
        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Manual confirmation required</span>`;

      const weightingText = a.weighting != null ? `${a.weighting}% of grade` : 'Weighting not found';

      const btnClass = isExportable
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-slate-200 hover:bg-slate-300 text-slate-700';

      return `
        <div class="assessment-card border rounded-xl p-4 bg-white ${state.selectedAssessment === a.title ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}" data-title="${escapeAttr(a.title)}">
          <div class="flex items-start justify-between gap-3 mb-2">
            <h3 class="font-semibold text-slate-800 text-sm leading-snug">${escapeHTML(a.title)}</h3>
            ${badge}
          </div>
          <p class="text-xs text-slate-500 mb-1">${escapeHTML(weightingText)}</p>
          <p class="text-xs text-slate-400 mb-3 italic">${escapeHTML(a.notes || '')}</p>
          <button onclick="CONV.extract(${JSON.stringify(a.title)})"
            class="${btnClass} text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            Extract scorer →
          </button>
        </div>`;
    }).join('');

    container.innerHTML = cards;
    show('detect-results');
    // Scroll to results
    document.getElementById('detect-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Review section rendering ─────────────────────────────────
  function renderReviewSection() {
    if (!state.draft) return;
    const d = state.draft;

    // Populate metadata fields
    setInputValue('rv-assessment-title', d.assessmentTitle || '');
    setInputValue('rv-name', d.name || '');
    setInputValue('rv-course-name', d.courseName || '');
    setInputValue('rv-university-name', d.universityName || '');
    setTextareaValue('rv-assignment-info', d.assignmentInfo || '');

    // Confidence bar
    if (state.confidence !== null) {
      const pct = Math.round(state.confidence * 100);
      const barEl = document.getElementById('confidence-bar');
      const labelEl = document.getElementById('confidence-label');
      if (barEl) { barEl.style.width = pct + '%'; barEl.className = 'h-2 rounded-full transition-all ' + confidenceColour(state.confidence); }
      if (labelEl) labelEl.textContent = `${pct}% extraction confidence`;
      show('confidence-section');
    }

    // Warnings
    renderWarnings();

    // Criteria table
    renderCriteriaTable();

    // Defaults checklist
    updateDefaultsDisplay();

    show('review-section');
    document.getElementById('review-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateExportButton();
  }

  function confidenceColour(c) {
    if (c >= 0.75) return 'bg-green-500';
    if (c >= 0.5)  return 'bg-amber-400';
    return 'bg-red-400';
  }

  function renderWarnings() {
    const container = document.getElementById('warnings-list');
    if (!container) return;
    if (!state.warnings || state.warnings.length === 0) {
      hide('warnings-section');
      return;
    }
    container.innerHTML = state.warnings.map(w =>
      `<li class="flex gap-2 items-start"><span class="text-amber-500 mt-0.5 shrink-0">⚠</span><span>${escapeHTML(w)}</span></li>`
    ).join('');
    show('warnings-section');
  }

  function renderCriteriaTable() {
    const tbody = document.getElementById('criteria-tbody');
    if (!tbody || !state.draft) return;

    const criteria = state.draft.criteria || [];
    if (criteria.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-3 text-slate-400 text-sm text-center">No criteria extracted</td></tr>';
      return;
    }

    tbody.innerHTML = criteria.map((c, i) => {
      const tiers = ['excellent', 'proficient', 'developing', 'unsatisfactory'];
      const tierCells = tiers.map(tier => {
        const val = (c.rubric && c.rubric[tier]) || '';
        const hasContent = val.trim().length > 0;
        return `<td class="px-3 py-2 align-top">
          <textarea data-crit="${i}" data-field="rubric.${tier}" rows="3"
            class="w-full text-xs border rounded px-2 py-1 resize-y min-w-[120px] ${hasContent ? 'border-slate-200' : 'border-red-300 bg-red-50'}"
            oninput="CONV.updateCriterion(${i}, 'rubric.${tier}', this.value)">${escapeHTML(val)}</textarea>
          ${!hasContent ? '<p class="text-red-500 text-xs mt-1">Required</p>' : ''}
        </td>`;
      }).join('');

      return `<tr class="border-b border-slate-100 hover:bg-slate-50 group">
        <td class="px-3 py-2 align-top">
          <input type="text" value="${escapeAttr(c.name || '')}" data-crit="${i}" data-field="name"
            class="w-full text-sm font-medium border border-slate-200 rounded px-2 py-1 min-w-[160px]"
            oninput="CONV.updateCriterion(${i}, 'name', this.value)" />
        </td>
        <td class="px-3 py-2 align-top w-20">
          <div class="flex items-center gap-1">
            <input type="number" value="${c.weight || ''}" min="0" max="100" step="0.5"
              data-crit="${i}" data-field="weight"
              class="w-16 text-sm border border-slate-200 rounded px-2 py-1 text-right"
              oninput="CONV.updateCriterion(${i}, 'weight', parseFloat(this.value) || 0)" />
            <span class="text-xs text-slate-400">%</span>
          </div>
        </td>
        ${tierCells}
        <td class="px-3 py-2 align-top w-10">
          <button onclick="CONV.removeCriterion(${i})"
            class="text-slate-300 hover:text-red-500 transition-colors text-lg leading-none"
            title="Remove criterion">×</button>
        </td>
      </tr>`;
    }).join('');

    updateWeightTotal();
  }

  function updateWeightTotal() {
    const criteria = (state.draft && state.draft.criteria) || [];
    const total = criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
    const el = document.getElementById('weight-total');
    if (!el) return;
    const ok = Math.abs(total - 100) <= 0.5;
    el.textContent = `Weights total: ${total}%`;
    el.className = 'text-sm font-medium ' + (ok ? 'text-green-700' : 'text-red-600');
    updateExportButton();
  }

  function updateDefaultsDisplay() {
    if (!state.draft) return;
    const el = document.getElementById('grade-scale-preview');
    if (el && state.draft.gradeScale) {
      el.textContent = state.draft.gradeScale.map(g => g.grade).join(', ');
    }
    const fbEl = document.getElementById('feedback-count');
    if (fbEl && state.draft.gradeFeedback) {
      fbEl.textContent = state.draft.gradeFeedback.length + ' grade bands';
    }
    const lpEl = document.getElementById('lp-count');
    if (lpEl && state.draft.latePenalties) {
      lpEl.textContent = state.draft.latePenalties.length + ' tiers';
    }
  }

  function updateExportButton() {
    const btn = document.getElementById('btn-export');
    if (!btn || !state.draft) return;
    const criteria = state.draft.criteria || [];
    const total = criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
    const weightsOk = Math.abs(total - 100) <= 0.5;
    const hasCriteria = criteria.length > 0;
    const hasTitle = (state.draft.assessmentTitle || '').trim().length > 0;
    const allBandsFilled = criteria.every(c =>
      c.rubric &&
      ['excellent', 'proficient', 'developing', 'unsatisfactory'].every(t => (c.rubric[t] || '').trim())
    );

    const rubricConfirmed = !!(document.getElementById('chk-rubric')?.checked);
    const enabled = weightsOk && hasCriteria && hasTitle && allBandsFilled && rubricConfirmed;
    btn.disabled = !enabled;
    btn.title = enabled ? '' : rubricConfirmed ? 'Fix validation errors before exporting' : 'Confirm the rubric is suitable for FK export';
    btn.className = enabled
      ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer'
      : 'bg-slate-300 text-slate-500 font-semibold px-6 py-2.5 rounded-lg cursor-not-allowed';
  }

  // ── Draft mutation handlers ──────────────────────────────────
  function updateMeta(field, value) {
    if (!state.draft) return;
    state.draft[field] = value;
    if (field === 'assessmentTitle' && !state.draft._nameEdited) {
      state.draft.name = value + ' Scorer';
      setInputValue('rv-name', state.draft.name);
    }
    if (field === 'name') state.draft._nameEdited = true;
    updateExportButton();
  }

  function updateCriterion(index, field, value) {
    if (!state.draft || !state.draft.criteria) return;
    const c = state.draft.criteria[index];
    if (!c) return;
    if (field.startsWith('rubric.')) {
      const tier = field.replace('rubric.', '');
      if (!c.rubric) c.rubric = {};
      c.rubric[tier] = value;
    } else if (field === 'weight') {
      c.weight = value;
      updateWeightTotal();
    } else {
      c[field] = value;
    }
    updateExportButton();
  }

  function removeCriterion(index) {
    if (!state.draft || !state.draft.criteria) return;
    state.draft.criteria.splice(index, 1);
    renderCriteriaTable();
    updateExportButton();
  }

  function addCriterion() {
    if (!state.draft) return;
    if (!state.draft.criteria) state.draft.criteria = [];
    state.draft.criteria.push({
      id: 'new_' + Date.now().toString(36),
      name: '',
      weight: 0,
      rubric: { excellent: '', proficient: '', developing: '', unsatisfactory: '' }
    });
    renderCriteriaTable();
    updateExportButton();
  }

  // ── Export ───────────────────────────────────────────────────
  function buildExportJSON() {
    if (!state.draft) return null;
    const d = state.draft;

    // Clean criterion IDs (replace temp new_ prefix IDs)
    const cleanCriteria = (d.criteria || []).map(c => ({
      id: c.id.startsWith('new_') ? (Date.now().toString(36) + Math.random().toString(36).substr(2, 6)) : c.id,
      name: c.name,
      weight: parseFloat(c.weight) || 0,
      rubric: {
        excellent:      c.rubric.excellent || '',
        proficient:     c.rubric.proficient || '',
        developing:     c.rubric.developing || '',
        unsatisfactory: c.rubric.unsatisfactory || ''
      }
    }));

    // Build the canonical FK export — exactly the 13 top-level fields, no extras
    return {
      id:              d.id,
      created:         d.created,
      name:            d.name || (d.assessmentTitle + ' Scorer'),
      assessmentTitle: d.assessmentTitle,
      courseName:      d.courseName || '',
      universityName:  d.universityName || '',
      assignmentInfo:  d.assignmentInfo || '',
      version:         d.version || '1.0',
      appVersion:      d.appVersion || '2.5.1',
      gradeScale:      d.gradeScale,
      criteria:        cleanCriteria,
      gradeFeedback:   d.gradeFeedback,
      latePenalties:   d.latePenalties,
      enableLatePenalties: d.enableLatePenalties !== false,
      scoreRounding:   d.scoreRounding || 'half'
    };
  }

  function downloadJSON() {
    const exportObj = buildExportJSON();
    if (!exportObj) return;

    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (exportObj.assessmentTitle || 'scorer')
      .replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').slice(0, 60);
    a.href = url;
    a.download = `${safeName}_Scorer.json`;
    a.click();
    URL.revokeObjectURL(url);

    show('export-success');
  }

  function importToFK() {
    if (typeof SA === 'undefined' || typeof SA.saveConfig !== 'function') {
      showGlobalError('Could not import directly — SA not available. Use "Download JSON" instead.');
      return;
    }
    const exportObj = buildExportJSON();
    if (!exportObj) return;

    const existing = SA.loadAllConfigs();
    const duplicate = existing.find(c => c.assessmentTitle === exportObj.assessmentTitle);
    if (duplicate) {
      if (!confirm(`A scorer for "${exportObj.assessmentTitle}" already exists. Replace it?`)) return;
      const updated = existing.filter(c => c.assessmentTitle !== exportObj.assessmentTitle);
      exportObj.id = SA.uid();
      updated.push(exportObj);
      SA.saveAllConfigs(updated);
    } else {
      SA.saveConfig(exportObj);
    }
    window.location.href = 'index.html?imported=1';
  }

  // ── Reset ────────────────────────────────────────────────────
  function resetAll() {
    state.pdfBase64 = null;
    state.fileName = null;
    state.assessments = [];
    state.selectedAssessment = null;
    state.draft = null;
    state.warnings = [];
    state.confidence = null;

    hide('detect-results');
    hide('review-section');
    hide('export-success');
    hide('global-error');
    hide('loading-indicator');
    hide('file-info');

    document.getElementById('drop-zone').classList.remove('has-file');
    const fi = document.getElementById('file-input');
    if (fi) fi.value = '';
  }

  // ── Helpers ──────────────────────────────────────────────────
  function escapeHTML(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function setInputValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function setTextareaValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  // ── Public API ───────────────────────────────────────────────
  window.CONV = {
    init:            function () { loadCreds(); },
    handleDragOver:  handleDragOver,
    handleDragLeave: handleDragLeave,
    handleDrop:      handleDrop,
    handleFileSelect:handleFileSelect,
    detect:          runDetect,
    extract:         runExtract,
    updateMeta:      updateMeta,
    updateCriterion: updateCriterion,
    removeCriterion: removeCriterion,
    addCriterion:    addCriterion,
    downloadJSON:    downloadJSON,
    importToFK:      importToFK,
    reset:           resetAll,
    onCheckboxChange: updateExportButton
  };

})();
