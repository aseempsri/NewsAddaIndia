/**
 * Post-build script to inject deployment timestamp into index.html
 * This ensures browsers always fetch the latest version after deployment
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../dist/news-adda-india/browser/index.html');

if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    process.exit(1);
}

// Read index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Generate deployment timestamp
const timestamp = new Date().toISOString();
const buildVersion = `v${Date.now()}`;

// Remove old version meta tag if exists
html = html.replace(/<meta\s+name="build-version"[^>]*>/gi, '');
html = html.replace(/<meta\s+name="deployment-timestamp"[^>]*>/gi, '');

// Inject version and timestamp meta tags before closing </head>
const versionMeta = `\n  <!-- Build Version: ${buildVersion} | Deployed: ${timestamp} -->\n  <meta name="build-version" content="${buildVersion}" />\n  <meta name="deployment-timestamp" content="${timestamp}" />`;
html = html.replace('</head>', `${versionMeta}\n</head>`);

// Write updated index.html
fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ Build version injected:', buildVersion);
console.log('✅ Deployment timestamp:', timestamp);
