import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { getTheme, ChatTheme } from './themes';
import { renderEmojiForVideo } from './emoji';

interface Message { id: number; text: string; sent: boolean; time: string; }
interface MessageConversationProps {
  messages: Message[];
  typingBeforeIndices?: number[];
  /** Name shown in the navigation header (receiver / contact). */
  contactName?: string;
  /** Battery level 0-100 for status bar icon (defaults to 100). */
  batteryLevel?: number;
  /** Theme for the chat interface: 'imessage', 'whatsapp', or 'snapchat' */
  theme?: string;
  /** Force the on-screen keyboard to remain visible for the whole preview */
  alwaysShowKeyboard?: boolean;
}

// CONFIG
const GAP_SECONDS = 2; // base gap inserted after each message (before next starts)
const TYPING_DURATION = 1.2; // total lead time allocated for an incoming typing bubble (indicator length + gap before bubble pops to message)
const TYPING_GAP = 0.15; // gap between typing indicator end and bubble appear
const DELIVERED_DELAY = 0.6; // seconds after last outgoing message finishes typing
// Keyboard + typing effect configuration
const KEYBOARD_HEIGHT = 320; 
const ACCESSORY_HEIGHT = 56; // taller to support 2-line input without overlap
const KEYBOARD_DISAPPEAR_FRAMES = 12; // frames for slide out animation
const KEYBOARD_LEAD = 0.8; // seconds keyboard appears before first outgoing message typing begins
const KEYBOARD_TRAIL = 0.3; // seconds keyboard stays after last outgoing finishes
const TYPE_SPEED = 11; // characters per second (sender typing speed)
const SEND_GAP = 0.18; // gap between finish typing and bubble appearing (press send)
const SAFE_TOP_INSET = 18; // extra spacing below header to avoid any overlap

const MessageBubble: React.FC<{ msg: Message; appearSec: number; first: boolean; last: boolean; theme: ChatTheme; }>= ({ msg, appearSec, first, last, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appearFrame = Math.round(appearSec * fps);
  if (frame < appearFrame) return null;
  const progress = spring({ frame: frame - appearFrame, fps, config:{ damping: 12, mass:0.9, stiffness:170 } });
  const translateY = interpolate(progress, [0,1],[24,0]);
  const scale = interpolate(progress, [0,1],[0.8,1]);
  
  const displayText = msg.text;
  const borderRadius = msg.sent ? theme.bubble.borderRadius.sent : theme.bubble.borderRadius.received;
  
  const bubbleStyle: React.CSSProperties = {
    maxWidth: theme.bubble.maxWidth,
    padding: theme.bubble.padding,
    backgroundColor: msg.sent ? theme.colors.sent : theme.colors.received,
    color: msg.sent ? theme.colors.sentText : theme.colors.receivedText,
    fontSize: theme.bubble.fontSize,
    lineHeight: theme.bubble.lineHeight,
    fontFamily: theme.bubble.fontFamily,
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    borderTopLeftRadius: borderRadius.topLeft(first),
    borderTopRightRadius: borderRadius.topRight(first),
    borderBottomLeftRadius: borderRadius.bottomLeft(last),
    borderBottomRightRadius: borderRadius.bottomRight(last),
    boxShadow: msg.sent ? theme.bubble.shadow.sent : theme.bubble.shadow.received,
    letterSpacing: theme.bubble.letterSpacing,
  };
  
  return (
    <div style={{ display:'flex', justifyContent: msg.sent ? 'flex-end':'flex-start', marginBottom: theme.bubble.marginBottom, transform:`translateY(${translateY}px) scale(${scale})`, opacity: progress }}>
      <div style={bubbleStyle} dangerouslySetInnerHTML={{ __html: renderEmojiForVideo(displayText) }} />
    </div>
  );
};

const TypingBubble: React.FC<{ startSec: number; endSec: number; sent: boolean; theme: ChatTheme }> = ({ startSec, endSec, sent, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSec * fps);
  const endFrame = Math.round(endSec * fps);
  if (frame < startFrame || frame > endFrame) return null;
  const local = frame - startFrame;
  const progress = spring({ frame: local, fps, config:{ damping:14, mass:0.8, stiffness:140 } });
  const translateY = interpolate(progress, [0,1],[15,0]);
  const dot = (i: number) => {
    const cycle = (local + i * 6) % 45;
    const scale = interpolate(cycle, [0,15,30,45],[0.4,1,0.4,0.4]);
    return <div key={i} style={{ width:6, height:6, borderRadius:3, background: sent ? theme.colors.typingDotSent : theme.colors.typingDotReceived, transform:`scale(${scale})`, transition:'transform 0.15s linear' }} />;
  };
  return (
    <div style={{ display:'flex', justifyContent: sent? 'flex-end':'flex-start', marginBottom: theme.bubble.marginBottom, transform:`translateY(${translateY}px)`, opacity:progress }}>
      <div style={{ display:'flex', gap:6, background: sent ? theme.colors.typingBubbleSent : theme.colors.typingBubbleReceived, padding: theme.bubble.padding, borderRadius:18 }}>
        {[0,1,2].map(dot)}
      </div>
    </div>
  );
};

const Keyboard: React.FC<{ startSec: number; endSec?: number; currentInputText?: string; activeChar?: string; theme: ChatTheme }> = ({ startSec, endSec, currentInputText, activeChar, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSec * fps);
  const endFrame = endSec != null ? Math.round(endSec * fps) : undefined;
  if (frame < startFrame) return null;
  if (endFrame !== undefined && frame > endFrame) return null;

  const appearFrames = 12; // frames for slide in
  const disappearFrames = 12; // frames for slide out
  const sinceStart = frame - startFrame;
  const untilEnd = endFrame !== undefined ? endFrame - frame : Infinity;

  const appearProgress = spring({ frame: sinceStart, fps, config:{ damping:16, mass:1, stiffness:180 } });
  const slideIn = interpolate(appearProgress, [0,1],[KEYBOARD_HEIGHT,0]);
  let translateY = slideIn;
  let opacity = appearProgress;

  if (endFrame !== undefined && untilEnd <= disappearFrames) {
    // animate out
    const outProgress = 1 - untilEnd / disappearFrames; // 0 -> 1
    const eased = spring({ frame: Math.round(outProgress * disappearFrames), fps, config:{ damping:18, mass:0.9, stiffness:140 } });
    const slideOut = interpolate(eased, [0,1],[0, KEYBOARD_HEIGHT]);
    translateY = slideOut;
    opacity = 1 - eased * 0.4; // slight fade
  }
  const keyRows = [ ['Q','W','E','R','T','Y','U','I','O','P'], ['A','S','D','F','G','H','J','K','L'], ['⇧','Z','X','C','V','B','N','M','⌫'], ['123',':)','space','return'] ];
  const renderKey = (k: string) => {
    const isSpace = k==='space';
    const normalizedActive = (activeChar || '').toLowerCase();
    const keyChar = isSpace ? ' ' : k.toLowerCase();
    const isActive = normalizedActive === keyChar && normalizedActive !== '';
    const baseStyle: React.CSSProperties = {
      flex: isSpace?4:1,
      background: isActive ? theme.colors.keyboardKeyActive : theme.colors.keyboardKey,
      color: isActive ? '#FFFFFF' : '#000',
      borderRadius: theme.keyboard.keyBorderRadius,
      padding:'10px 6px',
      textAlign:'center',
      fontSize: theme.keyboard.keyFontSize,
      fontWeight: theme.keyboard.keyFontWeight,
      boxShadow:'0 1px 0 rgba(0,0,0,0.25)',
      margin:'0 3px',
      transform: isActive ? 'translateY(1px)' : 'translateY(0)',
      transition:'background 80ms ease, color 80ms ease, transform 80ms ease'
    };
    return <div key={k} style={baseStyle}>{isSpace? '' : k}</div>;
  };
  const caretBlink = (frame / fps) % 1 < 0.5;
  const showCaret = true;
  const baseInputText = currentInputText && currentInputText.length>0 ? currentInputText : 'Type a message';
  const inputHTMLCore = renderEmojiForVideo(baseInputText);
  const caretHTML = showCaret && caretBlink ? `<span style="border-left: 2px solid ${theme.colors.sent}; margin-left:2px"></span>` : '';
  const inputHTML = (currentInputText && currentInputText.length>0) ? `${inputHTMLCore}${caretHTML}` : `<span style="opacity:0.4">${inputHTMLCore}${caretHTML}</span>`;
  return (
    <div style={{ position:'absolute', left:0, right:0, bottom:2, transform:`translateY(${translateY}px)`, background: theme.colors.keyboardBackground, borderTop: `1px solid ${theme.colors.keyboardBorder}`, fontFamily: theme.bubble.fontFamily }}>
      <div style={{ display:'flex', alignItems:'center', padding:'8px 10px', gap:8, background: theme.colors.headerBackground, minHeight: ACCESSORY_HEIGHT, boxSizing:'border-box' }}>
        <div style={{ width:32, height:32, borderRadius:16, background: theme.colors.keyboardKeyActive, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="#fff" aria-hidden>
            <path d="M4 7h3l1-2h8l1 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm8 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
          </svg>
        </div>
  <div style={{ flex:1, background: theme.colors.inputBackground, borderRadius:16, padding:'8px 12px', color: theme.colors.inputText, fontSize:16, minHeight:36, maxHeight:72, overflow:'hidden', display:'flex', alignItems:'center', lineHeight:1.25, whiteSpace:'pre-wrap', wordBreak:'break-word' }} dangerouslySetInnerHTML={{ __html: inputHTML }} />
        <div style={{ width:32, height:32, borderRadius:16, background: theme.colors.sent, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="#fff" aria-hidden>
            <path d="M3 12l18-9-9 18-1.5-6L3 12z"/>
          </svg>
        </div>
      </div>
      <div style={{ padding:'6px 6px 6px' }}>
        {keyRows.map((row,i)=>(<div key={i} style={{ display:'flex', justifyContent:'center', marginBottom:i===keyRows.length-1?0:6 }}>{row.map(renderKey)}</div>))}
      </div>
    </div>
  );
};

const StatusBar: React.FC<{ batteryLevel?: number; theme: ChatTheme }> = ({ batteryLevel = 100, theme }) => {
  const clamped = Math.min(100, Math.max(0, batteryLevel));
  return (
  <div style={{ position:'absolute', top:0, left:0, right:0, height: theme.statusBar.height, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 18px', fontSize: theme.statusBar.fontSize, fontWeight: theme.statusBar.fontWeight, fontFamily: theme.bubble.fontFamily, color: theme.colors.statusBar, zIndex:1000, background:'#FFFFFF' }}>
      <div>9:41</div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {/* Signal Bars */}
        <div style={{ display:'flex', alignItems:'flex-end', gap:2 }}>
          {[4,7,10,13].map((h,i)=>(<div key={i} style={{ width:3, height:h, background: theme.colors.statusBar, borderRadius:1 }} />))}
        </div>
        {/* Wi-Fi (simple) */}
        <div style={{ position:'relative', width:18, height:14 }}>
          <svg viewBox="0 0 20 14" width={18} height={14}>
            <path d="M10 13c.9 0 1.6-.7 1.6-1.6S10.9 9.8 10 9.8 8.4 10.5 8.4 11.4 9.1 13 10 13Z" fill={theme.colors.statusBar} />
            <path d="M3.3 6.6a9.2 9.2 0 0 1 13.4 0l-1.2 1.2a7.5 7.5 0 0 0-11 0L3.3 6.6Z" fill={theme.colors.statusBar} />
            <path d="M6.2 9.3a5.3 5.3 0 0 1 7.6 0l-1.2 1.2a3.6 3.6 0 0 0-5.2 0l-1.2-1.2Z" fill={theme.colors.statusBar} />
          </svg>
        </div>
        {/* Battery */}
        <div style={{ position:'relative', width:28, height:14, border: `2px solid ${theme.colors.statusBar}`, borderRadius:4, display:'flex', alignItems:'center', padding:'0 3px', boxSizing:'border-box' }}>
          <div style={{ position:'absolute', top:3, right:-5, width:3, height:8, background: theme.colors.statusBar, borderRadius:1 }} />
          <div style={{ width:`${clamped}%`, height:6, background: clamped < 20 ? '#FF3B30' : theme.colors.statusBar, borderRadius:2, transition:'width 0.3s' }} />
        </div>
      </div>
    </div>
  );
};

const NavigationHeader: React.FC<{ contactName?: string; theme: ChatTheme }> = ({ contactName, theme }) => (
  <div style={{ position:'absolute', top: theme.statusBar.height, left:0, right:0, height: theme.header.height, background: theme.colors.headerBackground, borderBottom: `1px solid ${theme.colors.headerBorder}`, display:'flex', alignItems:'center', padding:'0 12px', fontFamily: theme.bubble.fontFamily, zIndex:900 }}>
    <div style={{ fontSize: theme.header.fontSize, color: theme.colors.headerText }}>Back</div>
    <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', fontSize: theme.header.fontSize, fontWeight: theme.header.fontWeight, color: theme.colors.headerText }}>{contactName || 'Contact'}</div>
  </div>
);

// Inline delivered label component
const DeliveredBelow: React.FC<{ startSec: number; theme: ChatTheme }> = ({ startSec, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const startFrame = Math.round(startSec * fps);
  if (frame < startFrame) return null;
  const progress = spring({ frame: frame - startFrame, fps, config:{ damping:20, stiffness:170, mass:0.8 } });
  const opacity = interpolate(progress, [0,1],[0,1]);
  const translateY = interpolate(progress, [0,1],[6,0]);
  return (
    <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4, transform:`translateY(${translateY}px)`, opacity }}>
      <div style={{ fontSize:12, color: theme.colors.deliveredText, fontFamily: theme.bubble.fontFamily }}>Delivered</div>
    </div>
  );
};

export const MessageConversation: React.FC<MessageConversationProps> = ({ messages, typingBeforeIndices, contactName, batteryLevel, theme: themeName = 'imessage', alwaysShowKeyboard }) => {
  const theme = getTheme(themeName);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Precompute a dynamic timeline for all messages.
  type TimelineEntry = {
    idx: number;
    msg: Message;
  appearSec: number; // when bubble mounts (after typing for outgoing)
  typingStart?: number;
  typingEnd?: number;
  typingDuration: number; // only for outgoing
  endSec: number; // timeline anchor (bubble appear)
    typingIndicatorStart?: number; // for incoming typing indicator
    typingIndicatorEnd?: number;   // end of indicator (before gap)
  };

  const entries: TimelineEntry[] = [];
  let prevEnd = 0; // end time of previous sequence
  for (let i=0;i<messages.length;i++) {
    const m = messages[i];
    // Should we show a typing indicator before this message (incoming after an outgoing)?
    const indicatorForced = typingBeforeIndices?.includes(i);
    const autoIndicator = !m.sent && i>0 && messages[i-1].sent;
    const showIndicator = indicatorForced || autoIndicator;

    const base = i===0 ? 0 : prevEnd + GAP_SECONDS; // base time before any typing indicator or bubble
    let typingIndicatorStart: number | undefined;
    let typingIndicatorEnd: number | undefined;
    let appearSec: number;
    let typingStart: number | undefined;
    let typingEnd: number | undefined;
    let typingDuration = 0;
    if (m.sent) {
      typingDuration = m.text.length / TYPE_SPEED;
      typingStart = base;
      typingEnd = typingStart + typingDuration;
      appearSec = typingEnd + SEND_GAP; // bubble after send
    } else {
      if (showIndicator) {
        typingIndicatorStart = base;
        typingIndicatorEnd = typingIndicatorStart + (TYPING_DURATION - TYPING_GAP);
        appearSec = base + TYPING_DURATION;
      } else {
        appearSec = base;
      }
    }
    const endSec = appearSec;
    entries.push({ idx:i, msg:m, appearSec, typingStart, typingEnd, typingDuration, endSec, typingIndicatorStart, typingIndicatorEnd });
    prevEnd = endSec;
  }

  // Keyboard timings: from just before first outgoing begins to shortly after last outgoing finished
  const firstSent = entries.find(e=> e.msg.sent);
  const lastSent = [...entries].reverse().find(e=> e.msg.sent);
  const keyboardStart = alwaysShowKeyboard ? 0 : (firstSent ? Math.max(0, (firstSent.typingStart ?? firstSent.appearSec) - KEYBOARD_LEAD) : null);
  const keyboardEnd = alwaysShowKeyboard ? undefined : (lastSent ? (lastSent.typingEnd ?? lastSent.appearSec) + KEYBOARD_TRAIL : undefined);
  const deliveredStartSec = lastSent ? lastSent.appearSec + DELIVERED_DELAY : null;

  // Derive current input text
  const currentSec = frame / fps;
  let currentInputText = '';
  let activeChar = '';
  if (keyboardStart != null && currentSec >= keyboardStart && (!keyboardEnd || currentSec <= keyboardEnd)) {
    const active = entries.find(e => e.msg.sent && e.typingStart !== undefined && e.typingEnd !== undefined && currentSec >= e.typingStart && currentSec < e.typingEnd);
    if (active && active.typingStart !== undefined) {
      const elapsed = currentSec - active.typingStart;
      const chars = Math.min(active.msg.text.length, Math.floor(elapsed * TYPE_SPEED));
      currentInputText = active.msg.text.slice(0, chars);
      if (chars < active.msg.text.length) {
        // character currently being typed (next char appearing)
        activeChar = active.msg.text.charAt(chars).toLowerCase();
      }
    } else {
      const sending = entries.find(e => e.msg.sent && e.typingEnd !== undefined && currentSec >= e.typingEnd && currentSec < e.appearSec);
      if (sending) currentInputText = sending.msg.text;
    }
  }

  // Compute dynamic bottom padding based on keyboard slide animation
  let keyboardVisibleHeight = 0;
  if (keyboardStart != null) {
    const ks = Math.round(keyboardStart * fps);
    if (frame >= ks) {
      if (keyboardEnd == null || frame < Math.round(keyboardEnd * fps) - KEYBOARD_DISAPPEAR_FRAMES) {
        // Appearing or steady
        const sinceStart = frame - ks;
        const appearProgress = spring({ frame: sinceStart, fps, config:{ damping:16, mass:1, stiffness:180 } });
        const slideIn = interpolate(appearProgress, [0,1],[KEYBOARD_HEIGHT,0]);
        keyboardVisibleHeight = KEYBOARD_HEIGHT - slideIn;
      } else {
        // Disappearing
        const ke = Math.round((keyboardEnd as number) * fps);
        const untilEnd = ke - frame;
        const outProgress = 1 - untilEnd / KEYBOARD_DISAPPEAR_FRAMES;
        const eased = spring({ frame: Math.round(outProgress * KEYBOARD_DISAPPEAR_FRAMES), fps, config:{ damping:18, mass:0.9, stiffness:140 } });
        const slideOut = interpolate(eased, [0,1],[0, KEYBOARD_HEIGHT]);
        keyboardVisibleHeight = KEYBOARD_HEIGHT - slideOut;
      }
    }
  }

  const headerHeight = theme.statusBar.height + theme.header.height;
  return (
    <AbsoluteFill style={{ background:'transparent', fontFamily: theme.bubble.fontFamily, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:360, height:780, background: theme.colors.background, borderRadius:48, position:'relative', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.25)', border:'0px solid transparent', isolation:'isolate' }}>
        <StatusBar batteryLevel={batteryLevel} theme={theme} />
        <NavigationHeader contactName={contactName} theme={theme} />
  <div style={{ position:'absolute', top: headerHeight + SAFE_TOP_INSET, left:0, right:0, bottom:0, padding:'8px 12px 0', paddingBottom: Math.max(0, keyboardVisibleHeight - ACCESSORY_HEIGHT), display:'flex', flexDirection:'column', justifyContent:'flex-end', boxSizing:'border-box', zIndex:100 }}>
          {entries.map(entry=>{
            const { msg, idx, appearSec, typingIndicatorStart, typingIndicatorEnd } = entry;
            const prev = entries[idx-1]?.msg;
            const next = entries[idx+1]?.msg;
            const first = !prev || prev.sent !== msg.sent;
            const last = !next || next.sent !== msg.sent;
            return (
              <React.Fragment key={msg.id}>
                {typingIndicatorStart !== undefined && typingIndicatorEnd !== undefined && (
                  <TypingBubble startSec={typingIndicatorStart} endSec={typingIndicatorEnd} sent={false} theme={theme} />
                )}
                <MessageBubble msg={msg} appearSec={appearSec} first={first} last={last} theme={theme} />
                {deliveredStartSec != null && lastSent && lastSent.idx === idx && (
                  <DeliveredBelow startSec={deliveredStartSec} theme={theme} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {keyboardStart != null && (
          <div style={{ position:'absolute', left:0, right:0, bottom:0, zIndex:25 }}>
            <Keyboard startSec={keyboardStart} endSec={keyboardEnd} currentInputText={currentInputText} activeChar={activeChar} theme={theme} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
