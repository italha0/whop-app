import twemoji from 'twemoji';

/**
 * Escapes HTML characters to prevent XSS
 */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Safe emoji rendering component for video - uses font-based emojis only
 * This avoids XSS vulnerabilities and CDN dependencies
 */
export const renderEmojiForVideo = (text: string): string => {
  if (!text) return '';
  
  // Escape user input to prevent XSS
  const escapedText = escapeHtml(text);
  
  // Use only font-based emoji rendering for security and reliability
  return `<span style="font-family:'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji','Segoe UI Symbol',system-ui,sans-serif;font-size:inherit;line-height:inherit;">${escapedText}</span>`;
};

/**
 * Legacy function for UI - kept for backward compatibility but with security fixes
 * Safely renders emojis with proper escaping
 */
export const renderEmojiHTML = (text: string): string => {
  if (!text) return '';
  
  // Escape user input first
  const escapedText = escapeHtml(text);
  
  try {
    // Parse emojis from escaped text
    const result = twemoji.parse(escapedText, {
      folder: 'svg',
      ext: '.svg', 
      base: '/twemoji/', // Use local assets instead of CDN
      attributes: () => ({
        draggable: 'false',
        height: '1em',
        width: '1em',
        style: 'display:inline-block;vertical-align:-0.125em;',
        alt: '', // Remove alt to prevent issues
        loading: 'lazy'
      })
    });
    
    return result;
  } catch (error) {
    console.warn('[EMOJI] Twemoji parsing failed, using font fallback:', error);
    // Safe fallback with escaped text
    return `<span style="font-family:system-ui,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji',sans-serif;">${escapedText}</span>`;
  }
};
