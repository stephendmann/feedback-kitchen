# Local Dev Server

Feedback Kitchen requires no complex build pipelines or database containers for local development. A built-in Node.js server (`dev-server.js`) handles static file serving and serverless API emulation.

### The two-terminal workflow

When developing locally, run two processes in separate terminal windows:

```bash
# Terminal 1: Local HTTP server
npm run dev

# Terminal 2: Incremental Tailwind CSS watcher
npm run watch:css
```

### Server capabilities (`dev-server.js`)

The development server runs on `http://localhost:3000/` and provides:

- **Zero-Dependency Static Serving:** Delivers HTML, JavaScript, stylesheets, and media assets using native Node.js HTTP modules.
- **Serverless API Mounting:** Mounts `/api/garnish` (`api/garnish.js`) and `/api/parse-manual` (`api/parse-manual.js`) directly, enabling local testing of the AI assistant and PDF parser without deploying to Vercel.
- **Environment Configuration:** Reads local API keys and proxy credentials from a `.env.local` file in the repository root.

### Tailwind CSS compilation

Feedback Kitchen uses Tailwind CSS CLI for styling.

| Command | Action |
|---|---|
| `npm run watch:css` | Watches HTML and JavaScript files for new Tailwind classes and compiles `css/tailwind.out.css` incrementally. |
| `npm run build:css` | Compiles and minifies `css/tailwind.out.css` for production deployment. |

### Styling development rules

- **Tailwind Utility Classes:** If you add a new Tailwind class to an HTML page, it will not render until `watch:css` compiles it into `tailwind.out.css`. Keep the watcher running during UI development.
- **Inline `<style>` Blocks:** Plain CSS rules written inside `<style>` blocks in individual HTML pages take effect immediately without requiring a CSS rebuild.
