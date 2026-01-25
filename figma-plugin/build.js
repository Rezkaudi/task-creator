const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const chokidar = require("chokidar");

// 1. Runtime Configuration (Arguments Parsing)
const isProd = process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

// 2. Load the appropriate environment file
const envFile = isProd ? ".env.production" : ".env";
const envPath = path.join(__dirname, envFile);

// Ensure the file exists
if (!fs.existsSync(envPath)) {
  console.error(`❌ Error: Environment file ${envFile} not found!`);
  process.exit(1);
}

const envConfig = dotenv.config({ path: envPath }).parsed;
const BACKEND_URL = envConfig.BACKEND_URL;

console.log(`🔧 Mode: ${isProd ? "Production 🚀" : "Development 🛠️"}`);
console.log(`🔌 API URL: ${BACKEND_URL}`);

// 3. UI Build Function
function buildUI() {
  try {
    const srcDir = path.join(__dirname, "src/presentation/ui");
    const distDir = path.join(__dirname, "dist");

    const html = fs.readFileSync(path.join(srcDir, "ui.html"), "utf8");
    const css = fs.readFileSync(path.join(srcDir, "ui.css"), "utf8");
    let js = fs.readFileSync(path.join(srcDir, "ui.js"), "utf8");

    // Replace the URL inside JS
    js = js
      .replace(/process\.env\.BACKEND_URL/g, `"${BACKEND_URL}"`)
      .replace(/"PROCESS_ENV_BACKEND_URL"/g, `"${BACKEND_URL}"`);

    // Merge files (Inlining)
    let output = html
      .replace(
        '<link rel="stylesheet" href="./ui.css">',
        `<style>\n${css}\n</style>`,
      )
      .replace('<script src="./ui.js"></script>', `<script>\n${js}\n</script>`);

    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
    fs.writeFileSync(path.join(distDir, "ui.html"), output);

    console.log("✅ UI Built successfully");
  } catch (error) {
    console.error("❌ UI Build failed:", error);
  }
}

// 4. esbuild Configuration
const buildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017",
  minify: isProd, // Minify code only in production
  sourcemap: !isProd,
  define: {
    "process.env.BACKEND_URL": JSON.stringify(BACKEND_URL),
  },
};

// 5. Main Execution
async function run() {
  // Run UI build once
  buildUI();

  if (isWatch) {
    // Watch Mode
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("👀 Watching code changes...");

    // Watch UI files using chokidar
    chokidar.watch("src/presentation/ui/**/*").on("change", () => {
      console.log("🎨 UI changed, rebuilding...");
      buildUI();
    });
  } else {
    // Single Build Mode
    await esbuild.build(buildOptions);
    console.log("✅ Code Bundle built successfully");
  }
}

run().catch(() => process.exit(1));
