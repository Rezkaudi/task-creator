const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv'); // Import dotenv

// 1. Load .env variables
const env = dotenv.config().parsed || {};
const backendUrl = env.BACKEND_URL || 'http://localhost:5000';

const srcDir = path.join(__dirname, 'src/presentation/ui');
const distDir = path.join(__dirname, 'dist');

// Read the files
const html = fs.readFileSync(path.join(srcDir, 'ui.html'), 'utf8');
const css = fs.readFileSync(path.join(srcDir, 'ui.css'), 'utf8');
let js = fs.readFileSync(path.join(srcDir, 'ui.js'), 'utf8');

// --- INJECTION START ---
// 2. Manually replace the variable in the raw JS string
// This looks for "process.env.BACKEND_URL" and replaces it with "http://localhost:5000"
js = js.replace(/process\.env\.BACKEND_URL/g, `"${backendUrl}"`);
// --- INJECTION END ---

// Replace the link tag with inline style
let output = html.replace(
    '<link rel="stylesheet" href="./ui.css">',
    `<style>\n${css}\n</style>`
);

// Replace the script tag with inline script
output = output.replace(
    '<script src="./ui.js"></script>',
    `<script>\n${js}\n</script>`
);

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Write the combined file
fs.writeFileSync(path.join(distDir, 'ui.html'), output);

console.log(`✅ UI built successfully (API: ${backendUrl})`);