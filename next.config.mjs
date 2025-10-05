/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  
  // Allow all hosts for Replit proxy compatibility
  async rewrites() {
    return []
  },
  
  // Configure development server
  env: {
    HOSTNAME: '0.0.0.0',
  },
  
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" }
        ]
      }
    ];
  },

  // NOTE: For Next.js v15+, outputFileTracingIncludes is at the top level, not inside `experimental`.
  outputFileTracingIncludes: {
    "/api/generate-video": [
      // The script to execute
      "./scripts/render-video.cjs",

      // Your Remotion compositions
      "./remotion/**/*",

      // The Remotion config file
      "./remotion.config.ts",
  // Pre-bundled output marker + directory
  "./prebundled/**/*",

      // The headless browser for rendering
      "./node_modules/@sparticuz/chromium/**/*",
  "./node_modules/execa/**/*",
  // Execa transitive deps required at runtime (not always captured by static tracing)
  "./node_modules/cross-spawn/**/*",
  "./node_modules/execa/**/*",
  "./node_modules/extract-zip/**/*",
  "./node_modules/get-stream/**/*",
  "./node_modules/human-signals/**/*",
  "./node_modules/is-stream/**/*",
  "./node_modules/merge-stream/**/*",
  "./node_modules/mimic-fn/**/*",
  "./node_modules/npm-run-path/**/*",
  "./node_modules/onetime/**/*",
  "./node_modules/signal-exit/**/*",
  "./node_modules/source-map/**/*",
  "./node_modules/strip-final-newline/**/*",
  "./node_modules/which/**/*",
  "./node_modules/ws/**/*",
  "./node_modules/isexe/**/*",
  "./node_modules/path-key/**/*",
  "./node_modules/shebang-command/**/*",
  "./node_modules/shebang-regex/**/*",
  "./node_modules/debug/**/*",
  "./node_modules/ms/**/*",
  "./node_modules/yauzl/**/*",
  "./node_modules/buffer-crc32/**/*",
  "./node_modules/pend/**/*",

  // Core runtime-only packages now (prebundled output replaces bundler/studio/webcodecs heavy deps)
  "./node_modules/remotion/**/*",
  "./node_modules/remotion/version.js",
  "./node_modules/remotion/no-react.js",
  "./node_modules/remotion/dist/cjs/**/*",
  "./node_modules/@remotion/renderer/**/*",
  "./node_modules/@remotion/studio-shared/**/*",
  "./node_modules/@remotion/streaming/**/*",
  "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
  "./node_modules/@remotion/compositor-linux-x64-musl/**/*",
  "./node_modules/@sparticuz/chromium/**/*",

      // --- NEW & CRITICAL ADDITIONS ---

      // 1. The FFmpeg binary that Remotion uses for encoding
      "./node_modules/@remotion/renderer/bin/ffmpeg",

      // 2. The native compositor binaries for different Linux environments on Vercel
      "./node_modules/@remotion/compositor-linux-x64-gnu/**/*",
      "./node_modules/@remotion/compositor-linux-x64-musl/**/*",
    ],
  },

  webpack: (config, { isServer, webpack }) => {
    // Ignore TS declaration files so they don't bloat the bundle
    config.module.rules.push({ test: /\.d\.ts$/, use: 'ignore-loader' });
    if (isServer) {
      // Prevent optional native compositor variants from being pulled in (we only trace Linux ones explicitly)
      config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^@remotion\/compositor-/ }));
      
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@remotion/compositor-win32-x64-msvc': false,
        '@remotion/compositor-darwin-x64': false,
        '@remotion/compositor-darwin-arm64': false,
        '@remotion/compositor-linux-arm64-gnu': false,
        '@remotion/compositor-linux-arm64-musl': false,
      };
      // NOTE: Previously we marked Remotion packages as externals. That prevented Next.js
      // from tracing their internal files leading to MODULE_NOT_FOUND in the serverless
      // function. We now keep them bundled/traced so outputFileTracingIncludes + automatic
      // tracing can capture all required files.
    }
    return config;
  },
};

export default nextConfig;
