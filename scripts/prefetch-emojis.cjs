#!/usr/bin/env node

/**
 * Prefetch Emoji Assets Script
 * Downloads and caches emoji assets for offline video rendering
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Common emojis used in video content
const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😔', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
  '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱',
  '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶',
  '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱',
  '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷',
  '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩',
  '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹',
  '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐️', '✋',
  '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪',
  '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴',
  '👀', '👁️', '👅', '👄', '💋', '🩸', '👶', '🧒', '👦', '👧',
  '🧑', '👱', '👨', '🧔', '👩', '🧓', '👴', '👵', '🙍', '🙎',
  '🙅', '🙆', '💁', '🙋', '🧏', '🙇', '🤦', '🤷', '👮', '🕵️',
  '💂', '👷', '🤴', '👸', '👳', '👲', '🧕', '🤵', '👰', '🤰',
  '🤱', '👼', '🎅', '🤶', '🦸', '🦹', '🧙', '🧚', '🧛', '🧜',
  '🧝', '🧞', '🧟', '💆', '💇', '🚶', '🧍', '🧎', '👨‍🦯', '👩‍🦯',
  '👨‍🦼', '👩‍🦼', '👨‍🦽', '👩‍🦽', '🏃', '💃', '🕺', '🕴️', '👯',
  '🧖', '🧗', '🤺', '🏇', '⛷️', '🏂', '🏌️', '🏄', '🚣', '🏊',
  '⛹️', '🏋️', '🚴', '🚵', '🤸', '🤼', '🤽', '🤾', '🤹', '🧘',
  '🛀', '🛌', '👭', '👫', '👬', '💏', '💑', '👪', '👨‍👩‍👧', '👨‍👩‍👧‍👦',
  '👨‍👩‍👦‍👦', '👨‍👩‍👧‍👧', '👨‍👨‍👦', '👨‍👨‍👧', '👨‍👨‍👧‍👦', '👨‍👨‍👦‍👦',
  '👨‍👨‍👧‍👧', '👩‍👩‍👦', '👩‍👩‍👧', '👩‍👩‍👧‍👦', '👩‍👩‍👦‍👦', '👩‍👩‍👧‍👧',
  '👨‍👦', '👨‍👦‍👦', '👨‍👧', '👨‍👧‍👦', '👨‍👧‍👧', '👩‍👦', '👩‍👦‍👦',
  '👩‍👧', '👩‍👧‍👦', '👩‍👧‍👧', '🗣️', '👤', '👥', '👣', '🐵',
  '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐕‍🦺', '🐩', '🐺', '🦊',
  '🦝', '🐱', '🐈', '🐈‍⬛', '🦁', '🐯', '🐅', '🐆', '🐴', '🐎',
  '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗',
  '🐽', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏',
  '🦛', '🐭', '🐁', '🐀', '🐹', '🐰', '🐇', '🐿️', '🦔', '🦇',
  '🐻', '🐻‍❄️', '🐨', '🐼', '🦥', '🦦', '🦨', '🦘', '🦡', '🐾',
  '🦃', '🐔', '🐓', '🐣', '🐤', '🐥', '🐦', '🐧', '🕊️', '🦅',
  '🦆', '🦢', '🦉', '🦩', '🦚', '🦜', '🐸', '🐊', '🐢', '🦎',
  '🐍', '🐲', '🐉', '🦕', '🦖', '🐳', '🐋', '🐬', '🐟', '🐠',
  '🐡', '🦈', '🐙', '🐚', '🐌', '🦋', '🐛', '🐜', '🐝', '🐞',
  '🦗', '🕷️', '🦂', '🦟', '🦠', '💐', '🌸', '💮', '🏵️', '🌹',
  '🥀', '🌺', '🌻', '🌼', '🌷', '🌱', '🌲', '🌳', '🌴', '🌵',
  '🌶️', '🍄', '🌾', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺',
  '🌻', '🌼', '🌷', '🌱', '🪴', '🌲', '🌳', '🌴', '🌵', '🌶️',
  '🍄', '🌾', '💐', '🌸', '💮', '🏵️', '🌹', '🥀', '🌺', '🌻'
];

// Create emoji cache directory
const EMOJI_CACHE_DIR = path.join(__dirname, '..', 'public', 'emoji-cache');

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getEmojiCodepoint(emoji) {
  return emoji.codePointAt(0).toString(16).toLowerCase();
}

function downloadEmoji(emoji, codepoint) {
  return new Promise((resolve, reject) => {
    const url = `https://twemoji.maxcdn.com/v/latest/svg/${codepoint}.svg`;
    const filePath = path.join(EMOJI_CACHE_DIR, `${codepoint}.svg`);
    
    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`✅ Emoji ${emoji} already cached`);
      resolve();
      return;
    }
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`📥 Downloaded emoji ${emoji} (${codepoint})`);
          resolve();
        });
      } else {
        console.warn(`⚠️ Failed to download emoji ${emoji}: ${response.statusCode}`);
        resolve(); // Don't reject, just skip
      }
    }).on('error', (err) => {
      console.warn(`⚠️ Error downloading emoji ${emoji}:`, err.message);
      resolve(); // Don't reject, just skip
    });
  });
}

async function prefetchEmojis() {
  console.log('🎨 Starting emoji prefetch...');
  
  ensureDirectoryExists(EMOJI_CACHE_DIR);
  
  const downloadPromises = COMMON_EMOJIS.map(emoji => {
    const codepoint = getEmojiCodepoint(emoji);
    return downloadEmoji(emoji, codepoint);
  });
  
  await Promise.all(downloadPromises);
  
  console.log(`✅ Emoji prefetch completed! Cached ${COMMON_EMOJIS.length} emojis`);
  console.log(`📁 Cache directory: ${EMOJI_CACHE_DIR}`);
}

// Run if called directly
if (require.main === module) {
  prefetchEmojis().catch(console.error);
}

module.exports = { prefetchEmojis, COMMON_EMOJIS };
