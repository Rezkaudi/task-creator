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

// ── UI Build (esbuild JSX → inline CSS + JS into a single HTML file) ─
const UI_SRC = path.join(__dirname, "src/presentation/ui");
const DIST = path.join(__dirname, "dist");

async function buildUI() {
  try {
    // 1. Bundle React JSX + CSS imports with esbuild
    const result = await esbuild.build({
      entryPoints: [path.join(UI_SRC, "index.tsx")],
      bundle: true,
      write: false,
      outdir: DIST,
      format: "iife",
      target: "es2020",
      minify: isProd,
      drop: isProd ? ["console"] : [],
      define,
      jsx: "automatic",
      loader: { ".jsx": "jsx", ".tsx": "tsx", ".js": "js", ".ts": "ts", ".css": "css", ".jpeg": "dataurl", ".jpg": "dataurl", ".png": "dataurl", ".gif": "dataurl", ".webp": "dataurl", ".svg": "dataurl" },
      logLevel: "info",
    });

    // 2. Extract JS and CSS from esbuild output
    const jsFile = result.outputFiles.find((f) => f.path.endsWith(".js"));
    const cssFile = result.outputFiles.find((f) => f.path.endsWith(".css"));

    // Escape </script> sequences so they don't break inline <script> tags
    const js = jsFile.text.replace(/<\/script/gi, "<\\/script");
    const css = cssFile ? cssFile.text : "";

    // 3. Read HTML template and inline CSS + JS
    const html = fs.readFileSync(path.join(UI_SRC, "ui.html"), "utf8");

    // IMPORTANT: Use function replacers to avoid $& / $' / $` substitution
    // issues — the bundled React source contains these patterns.
    const output = html
      .replace('<link rel="stylesheet" href="./ui.css">', () => `<style>\n${css}\n</style>`)
      .replace('<script src="./ui.js"></script>', () => `<script>\n${js}\n</script>`);

    fs.mkdirSync(DIST, { recursive: true });
    fs.writeFileSync(path.join(DIST, "ui.html"), output);
    console.log("✅ UI built (React)");
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
  drop: isProd ? ["console"] : [],
  sourcemap: !isProd,
  define,
  logLevel: "info",
};

// ── Run ─────────────────────────────────────────────────────────────
async function run() {
  await buildUI();

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