# Static Hosting and Deployments

Feedback Kitchen is architected as a static web application. It requires no persistent backend server, application container, or database service, allowing deployment to any static hosting provider or content delivery network.

![Deployment options diagram](images/ch46-deployment-options.png)

### Deploying to Vercel (Production Reference)

The official live instance at [marking.stephendmann.com](https://marking.stephendmann.com/) is deployed via Vercel.

To deploy your own fork to Vercel:

1. Connect your GitHub repository to the Vercel dashboard.
2. Set the build configuration:
   - **Build Command:** `npm run build:css`
   - **Output Directory:** `.` (root directory)
   - **Install Command:** `npm install`
3. Configure environment variables (optional, for AI features):
   - `ANTHROPIC_API_KEY`: Anthropic Claude API key
   - `FK_PROXY_USER` & `FK_PROXY_PASSWORD`: Proxy credentials

The repository's `vercel.json` configuration automatically provisions serverless routes for `/api/garnish.js` and sets immutable cache-control headers on static JavaScript and CSS assets.

### Deploying to GitHub Pages

You can host Feedback Kitchen directly from a GitHub repository for free:

1. Navigate to repository **Settings** → **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose the `main` branch and `/ (root)` folder, then click **Save**.
4. GitHub Pages publishes the static marking app within seconds.

*(Note: GitHub Pages provides the complete core marking tool, SheetJS Excel exports, and Moodle integrations. Serverless AI proxy routes require Node hosting such as Vercel or local dev servers).*

### Self-hosting with Caddy, Nginx, or Apache

To host on your institution's internal Linux server:

#### Caddy (`/etc/caddy/Caddyfile`)
```caddy
marking.example.ac.nz {
    root * /var/www/feedback-kitchen
    file_server
    encode gzip zstd
}
```

#### Nginx (`/etc/nginx/conf.d/fk.conf`)
```nginx
server {
    listen 80;
    server_name marking.example.ac.nz;
    root /var/www/feedback-kitchen;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```
