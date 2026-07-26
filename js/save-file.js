/* ============================================================
   Feedback Kitchen — saveFile shim (save-file.js)   [FK-45]

   One place that decides HOW a generated file reaches disk.

   On Chrome/Edge it opens the native Save-As dialog via the File
   System Access API, so the marker picks the folder and the browser
   remembers it. Everywhere else (Firefox/Safari, or the API absent)
   it falls back to the existing anchor-download path — the file
   lands in the browser's default download folder, exactly as before.

   A cancelled dialog is a silent no-op: nothing is written and no
   error is surfaced.

   saveFile(blob, filename) -> Promise<'picker' | 'anchor' | 'cancelled'>
   The outcome lets callers tailor any post-save message (e.g. not
   pointing the marker at their Downloads folder when they chose one).

   Must be called from within a user gesture (click handler) — the
   File System Access API requires it. All FK call sites already are.
   ============================================================ */

(function () {
  'use strict';

  function anchorDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on a delay, not immediately after click() — Firefox/Safari can
    // still be reading the blob URL asynchronously, and revoking it too soon
    // can cut the download off (the reason FK-19's Moodle CSV export used
    // this same delay before it was folded into this shared helper).
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return 'anchor';
  }

  async function saveFile(blob, filename) {
    if (typeof window === 'undefined' || typeof window.showSaveFilePicker !== 'function') {
      return anchorDownload(blob, filename);
    }

    let handle;
    try {
      handle = await window.showSaveFilePicker({ suggestedName: filename });
    } catch (err) {
      // User dismissed the dialog: leave everything untouched, say nothing.
      if (err && err.name === 'AbortError') return 'cancelled';
      // Any other picker failure: fall back so the marker still gets the file.
      return anchorDownload(blob, filename);
    }

    try {
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'picker';
    } catch (err) {
      // Write to the chosen handle failed (disk full, permission revoked,
      // sync-lock, etc.) — fall back so the marker still gets the file,
      // same treatment as any other picker failure above.
      return anchorDownload(blob, filename);
    }
  }

  const api = { saveFile };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.FKSave = api;
})();
