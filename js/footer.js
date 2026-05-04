document.getElementById('site-footer').innerHTML = `
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
          If used, only scrubbed feedback text is sent to the language service &mdash; names and IDs are removed first.
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
          <a class="site-footer__kofi-link" href="https://ko-fi.com/smann" target="_blank" rel="noopener noreferrer">Ko-fi</a>.
        </p>
      </section>
    </div>

    <section id="acknowledgements" class="site-footer__acknowledgement" aria-label="Acknowledgements">
      <p>
        Adapted from the original <em>Feedback Kitchen</em> Excel workbook by
        <strong>Dr Michael Harker, University of Strathclyde</strong>; redesigned as a browser-based application for the
        <strong>University of Waikato</strong>.
        <span class="site-footer__muted">Built with AI coding assistance (Claude / Anthropic &middot; Perplexity &middot; Microsoft Copilot).</span>
      </p>
    </section>
  </div>
</footer>
`;
