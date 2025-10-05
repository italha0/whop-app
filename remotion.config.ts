import { Config } from '@remotion/cli/config';
// Add this import
import chromium from '@sparticuz/chromium';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setCodec('h264');

// Enhanced Chromium configuration for better emoji and font support
(async () => {
  const executablePath = await chromium.executablePath();
  Config.setBrowserExecutable(executablePath);

  // Disable web security for CDN access
  Config.setChromiumDisableWebSecurity(true);
  
  // Enhanced Chromium options for emoji support
  Config.setChromiumOpenGlRenderer('egl');
  Config.setChromiumHeadlessMode(true);
  
  // Additional browser args for emoji and font rendering
  Config.setChromiumMultiProcessOnLinux(true);
  Config.setChromiumIgnoreCertificateErrors(true);
})();