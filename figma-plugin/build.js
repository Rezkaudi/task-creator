const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// ── Args & Environment ──────────────────────────────────────────────
const isProd = process.argv.includes("--prod");
const isWatch = process.argv.includes("--watch");

const envFile = isProd ? ".env.production" : ".env";
const envPath = path.join(__dirname, envFile);
if (!fs.existsSync(envPath)) {
  console.error(`❌ Environment file ${envFile} not found!`);
  process.exit(1);
}

const { BACKEND_URL } = dotenv.config({ path: envPath }).parsed;
console.log(`🔧 ${isProd ? "Production 🚀" : "Development 🛠️"}  · API: ${BACKEND_URL}`);

const define = { "process.env.BACKEND_URL": JSON.stringify(BACKEND_URL) };

// ── UI Build (inline CSS + JS into a single HTML file) ──────────────
const UI_SRC = path.join(__dirname, "src/presentation/ui");
const DIST = path.join(__dirname, "dist");

function buildUI() {
  try {
    const html = fs.readFileSync(path.join(UI_SRC, "ui.html"), "utf8");
    const css = fs.readFileSync(path.join(UI_SRC, "ui.css"), "utf8");
    let js = fs.readFileSync(path.join(UI_SRC, "ui.js"), "utf8");

    // Inject env vars the same way esbuild's `define` would
    js = js.replace(/process\.env\.BACKEND_URL/g, JSON.stringify(BACKEND_URL))
           .replace(/"PROCESS_ENV_BACKEND_URL"/g, JSON.stringify(BACKEND_URL));

    const output = html
      .replace('<link rel="stylesheet" href="./ui.css">', `<style>\n${css}\n</style>`)
      .replace('<script src="./ui.js"></script>', `<script>\n${js}\n</script>`);

    fs.mkdirSync(DIST, { recursive: true });
    fs.writeFileSync(path.join(DIST, "ui.html"), output);
    console.log("✅ UI built");
  } catch (err) {
    console.error("❌ UI build failed:", err);
  }
}

// ── Code Build (esbuild for plugin sandbox) ─────────────────────────
const codeBuildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017",
  minify: isProd,
  sourcemap: !isProd,
  define,
  logLevel: "info",
};

// ── Run ─────────────────────────────────────────────────────────────
async function run() {
  buildUI();

  if (isWatch) {
    const ctx = await esbuild.context(codeBuildOptions);
    await ctx.watch();
    console.log("👀 Watching code changes…");

    // Watch UI source files with Node's built-in fs.watch (no chokidar needed)
    fs.watch(UI_SRC, { recursive: true }, (_event, filename) => {
      if (filename) {
        console.log(`🎨 UI changed (${filename}), rebuilding…`);
        buildUI();
      }
    });
  } else {
    await esbuild.build(codeBuildOptions);
    console.log("✅ Code bundle built");
  }
}

run().catch(() => process.exit(1));