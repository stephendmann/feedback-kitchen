(function () {
  const el = document.getElementById('site-footer');
  if (!el) return;

  // FK-30: the scorer is a task-focused screen and already duplicates the
  // homepage's trust block. Pages opt into a compact one-line footer via
  // data-footer="compact"; everywhere else gets the full version (the homepage
  // is where users evaluate privacy/provenance, so it keeps the detail).
  const COMPACT = `
<footer class="site-footer site-footer--compact" aria-label="Privacy and support">
  <div class="site-footer__inner">
    <p><strong>Browser-only by default:</strong> student data stays on this device unless you export it; the wording assistant strips names &amp; IDs before any text leaves your browser.</p>
    <p>
      <a href="/index.html#acknowledgements">About, backups &amp; credits</a>
      <span aria-hidden="true">&middot;</span>
      <a class="site-footer__kofi-link" href="https://ko-fi.com/smann" target="_blank" rel="noopener noreferrer" aria-label="Support on Ko-fi (opens in a new tab)" onclick="if(typeof gtag==='function'){gtag('event','kofi_click',{event_category:'engagement',link_location:'footer'})}">Support (Ko-fi)</a>
    </p>
  </div>
</footer>`;

  const FULL = `
<footer class="site-footer" aria-labelledby="site-footer-title">
  <div class="site-footer__inner">
    <div class="site-footer__brand site-footer__brand--utility">
      <h2 id="site-footer-title" class="site-footer__utility-title">Privacy &amp; support</h2>
    </div>

    <div class="site-footer__grid">
      <section class="site-footer__column" aria-labelledby="footer-privacy">
        <h3 id="footer-privacy">Privacy</h3>
        <p>
          Browser-only by default. Scorers and snippets are stored locally on this device; student session data stays in memory unless you export it.
        </p>
      </section>

      <section class="site-footer__column" aria-labelledby="footer-wording">
        <h3 id="footer-wording">Wording assistant</h3>
        <p>
          If used, only scrubbed feedback text is sent to the language service; names and IDs are removed first.
        </p>
      </section>

      <section class="site-footer__column" aria-labelledby="footer-backup">
        <h3 id="footer-backup">Backups</h3>
        <p>
          Export JSON backups if you want to keep or move your Scorers and snippets.
        </p>
      </section>

      <section class="site-footer__column" aria-labelledby="footer-support">
        <h3 id="footer-support">Support</h3>
        <p>
          Support hosting and development, request wording-assistant access, or fund a custom course build via
          <a class="site-footer__kofi-link" href="https://ko-fi.com/smann" target="_blank" rel="noopener noreferrer" aria-label="Support Stephen on Ko-fi (opens in a new tab)" onclick="if(typeof gtag==='function'){gtag('event','kofi_click',{event_category:'engagement',link_location:'footer'})}">Ko-fi</a>.
        </p>
      </section>
    </div>

    <section id="acknowledgements" class="site-footer__acknowledgement" aria-label="Acknowledgements">
      <p>
        Adapted from the original <em>Feedback Kitchen</em> Excel workbook by
        <strong>Dr Michael Harker, University of Strathclyde</strong>; redesigned as a browser-based application for the
        <strong>University of Waikato</strong>.
        <span class="site-footer__muted">Built with AI coding assistance (Claude / Anthropic &middot; Perplexity &middot; Microsoft Copilot). The tool itself runs in your browser. The AI listed here assisted with development only. The development team has tested privacy handling, calculations, and site functionality in real-world marking.</span>
      </p>
    </section>
  </div>
</footer>`;

  el.innerHTML = el.dataset.footer === 'compact' ? COMPACT : FULL;
})();
