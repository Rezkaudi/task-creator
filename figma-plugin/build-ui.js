const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src/presentation/ui');
const distDir = path.join(__dirname, 'dist');

// Read the files
const html = fs.readFileSync(path.join(srcDir, 'ui.html'), 'utf8');
const css = fs.readFileSync(path.join(srcDir, 'ui.css'), 'utf8');
const js = fs.readFileSync(path.join(srcDir, 'ui.js'), 'utf8');

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

console.log('✅ UI built successfully - CSS and JS inlined into ui.html');
