#!/usr/bin/env node
/**
 * Pre-bundle the Remotion project at build time so the serverless function
 * only needs @remotion/renderer (not @remotion/bundler + webpack + react-dom at runtime).
 */
const { bundle } = require('@remotion/bundler');
const path = require('path');
const fs = require('fs');

(async () => {
  const entry = path.join(process.cwd(), 'remotion', 'index.ts');
  console.log('[PREBUNDLE] Bundling', entry);
  const tmpBundle = await bundle(entry);
  console.log('[PREBUNDLE] Temporary bundle at', tmpBundle);
  const outDir = path.join(process.cwd(), 'prebundled');
  const target = path.join(outDir, 'bundle');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  // Clean old
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
  // Copy bundle directory recursively
  fs.cpSync(tmpBundle, target, { recursive: true });
  const serveUrl = target; // absolute path inside project, will be traced
  fs.writeFileSync(path.join(outDir, 'serveUrl.txt'), serveUrl, 'utf-8');
  console.log('[PREBUNDLE] Copied bundle to', serveUrl);
})();
