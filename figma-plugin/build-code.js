const esbuild = require('esbuild');
const dotenv = require('dotenv');

// 1. Load .env variables
const env = dotenv.config().parsed || {};

// 2. Prepare the 'define' object. 
// This tells esbuild to replace every instance of 'process.env.BACKEND_URL' 
// with the string value from your .env file.
const define = {
  'process.env.BACKEND_URL': JSON.stringify(env.BACKEND_URL || 'http://localhost:5000')
};

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es2017',
  define: define, // <--- Injection happens here
  logLevel: 'info',
};

async function build() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('👀 Watching for code changes...');
  } else {
    await esbuild.build(buildOptions);
    console.log('✅ Plugin Code built successfully');
  }
}

build().catch(() => process.exit(1));