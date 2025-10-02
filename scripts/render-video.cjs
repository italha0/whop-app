#!/usr/bin/env node
/*
  Usage: node scripts/render-video.cjs <propsPath> <outputPath> <compositionId>
*/
const { readFileSync } = require('fs');
const path = require('path');

// Add dependency validation at the start
console.log('[RENDER] Validating critical dependencies...');
const criticalDeps = ['ws', 'remotion/version', 'remotion/no-react', 'isexe', 'shebang-regex', 'debug', 'ms', 'yauzl', 'buffer-crc32', 'pend', '@remotion/streaming'];
for (const dep of criticalDeps) {
  try {
    require.resolve(dep);
    console.log(`[RENDER] ✅ ${dep}`);
  } catch (error) {
    console.warn(`[RENDER] ⚠️ ${dep} - Will attempt to continue:`, error.message);
  }
}

// No bundling at runtime – we rely on prebundled assets created during build.
const { getCompositions, renderMedia } = require('@remotion/renderer');

async function run() {
  const [,, propsPath, outputPath, compositionId] = process.argv;
  if (!propsPath || !outputPath || !compositionId) {
    console.error('Missing args: propsPath outputPath compositionId');
    process.exit(1);
  }
  console.log('[RENDER] Starting render');
  console.log('[RENDER] Node version:', process.version);
  console.log('[RENDER] Platform:', process.platform, 'Arch:', process.arch);

  // Try to set a Chromium executable path for serverless (Vercel) if not provided
  if (!process.env.REMOTION_BROWSER_EXECUTABLE) {
    try {
      const chromium = require('@sparticuz/chromium');
      const execPath = await chromium.executablePath();
      process.env.REMOTION_BROWSER_EXECUTABLE = execPath;
      // Also set Puppeteer fallback env var
      process.env.PUPPETEER_EXECUTABLE_PATH = execPath;
      console.log('[RENDER] Using serverless Chromium at', execPath);
    } catch (e) {
      console.warn('[RENDER] Could not resolve @sparticuz/chromium executable', e?.message || e);
    }
  } else {
    console.log('[RENDER] REMOTION_BROWSER_EXECUTABLE already set');
  }
  // Try to use pre-bundled serveUrl produced at build time
  let bundleLocation = process.env.PREBUNDLED_SERVE_URL || null;
  if (bundleLocation) {
    console.log('[RENDER] PREBUNDLED_SERVE_URL provided:', bundleLocation);
  }
  const prebundledMarker = path.join(process.cwd(), 'prebundled', 'serveUrl.txt');
  if (!bundleLocation && require('fs').existsSync(prebundledMarker)) {
    try {
      bundleLocation = require('fs').readFileSync(prebundledMarker, 'utf-8').trim();
      console.log('[RENDER] Using pre-bundled serveUrl:', bundleLocation);
    } catch (e) {
      console.warn('[RENDER] Failed reading prebundled marker, falling back to bundling', e.message);
    }
  }
  if (!bundleLocation) {
    if (process.env.VERCEL) {
      console.error('[RENDER] No prebundled serveUrl available in production. Ensure build ran prebundle script.');
      process.exit(1);
    } else {
      console.log('[RENDER] No prebundle found (local dev). Bundling on-the-fly...');
      try {
        const { bundle } = require('@remotion/bundler');
        const entry = path.join(process.cwd(), 'remotion', 'index.ts');
        bundleLocation = await bundle(entry);
        console.log('[RENDER] Local bundle created at', bundleLocation);
      } catch (e) {
        console.error('[RENDER] Failed to bundle locally. Install @remotion/bundler or run prebundle.', e);
        process.exit(1);
      }
    }
  }
  const props = JSON.parse(readFileSync(propsPath, 'utf-8'));
  console.log('[RENDER] Messages count:', (props.messages || []).length);
  const comps = await getCompositions(bundleLocation, { inputProps: props });
  const comp = comps.find(c => c.id === compositionId);
  if (!comp) {
    console.error('[RENDER] Composition not found:', compositionId);
    process.exit(1);
  }

  // Match the Preview: ~4s per message, minimum 10s total
  const msgCount = (props.messages || []).length;
  const minSeconds = 10; // 300 frames at 30fps
  const perMessageSeconds = 4;
  const desired = Math.round(Math.max(minSeconds, msgCount * perMessageSeconds) * comp.fps);
  const durationInFrames = desired;
  console.log('[RENDER] Using durationInFrames', durationInFrames);

  await renderMedia({
    composition: { ...comp, durationInFrames },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: props,
    scale: 2, // 2x resolution for sharper output
    crf: 15,  // higher quality (lower CRF)
  concurrency: process.env.VERCEL ? 1 : 2, // lower concurrency in serverless envs
    dumpBrowserLogs: false,
    chromiumOptions: {
      disableWebSecurity: true,
      enableMultiProcessOnLinux: true,
      allowHTTP1ForStreaming: true,
      allowOrganizeImports: true,
      headless: true,
      ignoreCertificateErrors: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        // Enhanced emoji and font support
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--disable-font-subpixel-positioning',
        '--allow-running-insecure-content',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--force-color-profile=srgb',
        // Network and CDN access
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-translate',
        '--no-default-browser-check'
      ]
    },
    onProgress: (p) => {
      if (p.renderedFrames % 30 === 0) {
        process.stdout.write(`\n[RENDER] ${p.renderedFrames}/${durationInFrames} ${(p.progress*100).toFixed(1)}%`);
      }
    }
  });
  console.log('\n[RENDER] Success');
}

run().catch(err => {
  console.error('[RENDER] Failed', err);
  process.exit(1);
});
