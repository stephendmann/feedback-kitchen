document.getElementById('site-footer').innerHTML = `
<footer class="site-footer" aria-labelledby="site-footer-title">
  <div class="site-footer__inner">
    <div class="site-footer__brand">
      <div class="site-footer__lockup">
        <span class="site-footer__logo" aria-hidden="true">
          <img src="favicon-32.png" alt="" width="32" height="32">
        </span>
        <p class="site-footer__eyebrow">Feedback Kitchen</p>
      </div>
      <h2 id="site-footer-title" class="site-footer__title">
        Built for educators. Free to use.
      </h2>
      <p class="site-footer__tagline">Fast, practical marking support. 100% local processing &mdash; student data never leaves your device.</p>
    </div>

    <div class="site-footer__grid">
      <section class="site-footer__column" aria-labelledby="footer-privacy">
        <h3 id="footer-privacy">Privacy</h3>
        <p>
          Feedback Kitchen is a static, browser-only tool. Scorers, snippets, and some preferences are stored locally in your browser on this device.
        </p>
        <p>
          Student marking session data stays in memory during use and is not saved by default.
        </p>
      </section>

      <section class="site-footer__column" aria-labelledby="footer-wording">
        <h3 id="footer-wording">Wording assistant</h3>
        <p>
          If you use the Feedback Wording Assistant, only PII-scrubbed feedback text is sent to our external language service. Names, IDs, and other direct identifiers are removed before sending.
        </p>
        <p>
          Don't have a key? <a href="https://ko-fi.com/smann" target="_blank" rel="noopener noreferrer">Get access via Ko-fi</a> &mdash; a small contribution covers your usage.
        </p>
      </section>

      <section class="site-footer__column" aria-labelledby="footer-backup">
        <h3 id="footer-backup">Backup</h3>
        <p>
          Clearing browser data may remove saved Scorers and snippets. Export JSON backups if you want to keep or move them.
        </p>
      </section>

      <section class="site-footer__column" aria-labelledby="footer-support">
        <h3 id="footer-support">Support</h3>
        <p>
          If my tools save you time, a tip helps cover hosting and language tool costs. Need this built or refined for your own course or a different digital tool developed? You can request custom work via Ko-fi.
        </p>
        <p>
          <a class="site-footer__kofi" href="https://ko-fi.com/smann" target="_blank" rel="noopener noreferrer" aria-label="Visit Stephen's Ko-fi page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 2.818.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
            </svg>
            Visit Ko-fi
          </a>
        </p>
      </section>
    </div>

    <section id="acknowledgements" class="site-footer__acknowledgement" aria-label="Acknowledgements">
      <p>
        <sup>&sup1;</sup> This tool is adapted from the original <em>Feedback Kitchen</em> Excel workbook developed and generously shared by
        <strong>Dr Michael Harker, University of Strathclyde</strong>.
        Redesigned as a browser-based application for use at the
        <strong>University of Waikato</strong>,
        reflecting UW grading policy but adaptable to any institutional context.
        Developed with AI assistance
        <span class="site-footer__muted">(Claude / Anthropic &middot; Perplexity &middot; Microsoft Copilot)</span>.
      </p>
    </section>
  </div>
</footer>
`;
