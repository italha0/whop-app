export interface ChatTheme {
  name: string;
  colors: {
    sent: string;
    received: string;
    sentText: string;
    receivedText: string;
    background: string;
    headerBackground: string;
    headerBorder: string;
    headerText: string;
    statusBar: string;
    typingBubbleSent: string;
    typingBubbleReceived: string;
    typingDotSent: string;
    typingDotReceived: string;
    keyboardBackground: string;
    keyboardBorder: string;
    keyboardKey: string;
    keyboardKeyActive: string;
    inputBackground: string;
    inputText: string;
    deliveredText: string;
  };
  bubble: {
    maxWidth: string;
    padding: string;
    fontSize: number;
    lineHeight: number;
    fontFamily: string;
    borderRadius: {
      sent: {
        topLeft: (first: boolean) => number;
        topRight: (first: boolean) => number;
        bottomLeft: (last: boolean) => number;
        bottomRight: (last: boolean) => number;
      };
      received: {
        topLeft: (first: boolean) => number;
        topRight: (first: boolean) => number;
        bottomLeft: (last: boolean) => number;
        bottomRight: (last: boolean) => number;
      };
    };
    shadow: {
      sent: string;
      received: string;
    };
    letterSpacing: number;
    marginBottom: number;
  };
  header: {
    height: number;
    fontSize: number;
    fontWeight: number;
  };
  statusBar: {
    height: number;
    fontSize: number;
    fontWeight: number;
  };
  keyboard: {
    height: number;
    keyBorderRadius: number;
    keyFontSize: number;
    keyFontWeight: number;
  };
}

export const themes: Record<string, ChatTheme> = {
  imessage: {
    name: 'iMessage',
    colors: {
      sent: '#007AFF',
      received: '#E5E5EA',
      sentText: '#ffffff',
      receivedText: '#000000',
      background: '#FFFFFF',
      headerBackground: '#F2F2F7',
      headerBorder: '#C7C7CC',
      headerText: '#007AFF',
      statusBar: '#000000',
      typingBubbleSent: '#007AFF',
      typingBubbleReceived: '#E5E5EA',
      typingDotSent: '#ffffff',
      typingDotReceived: '#6E6E73',
      keyboardBackground: '#D1D4DA',
      keyboardBorder: '#B4B7BD',
      keyboardKey: '#ffffff',
      keyboardKeyActive: '#8E8E93',
      inputBackground: '#FFFFFF',
      inputText: '#000000',
      deliveredText: '#8E8E93',
    },
    bubble: {
      maxWidth: '78%',
      padding: '8px 14px',
      fontSize: 17,
      lineHeight: 1.25,
  fontFamily: 'SF Pro Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      borderRadius: {
        sent: {
          topLeft: (first) => first ? 18 : 6,
          topRight: (first) => 18,
          bottomLeft: (last) => 18,
          bottomRight: (last) => last ? 18 : 6,
        },
        received: {
          topLeft: (first) => 18,
          topRight: (first) => first ? 18 : 6,
          bottomLeft: (last) => last ? 18 : 6,
          bottomRight: (last) => 18,
        },
      },
      shadow: {
        sent: '0 1px 1px rgba(0,0,0,.25)',
        received: '0 1px 1px rgba(0,0,0,.15)',
      },
    letterSpacing: -0.2,
    marginBottom: 8,
    },
    header: {
      height: 52,
      fontSize: 17,
      fontWeight: 600,
    },
    statusBar: {
      height: 44,
      fontSize: 15,
      fontWeight: 600,
    },
    keyboard: {
      height: 300,
      keyBorderRadius: 6,
      keyFontSize: 14,
      keyFontWeight: 500,
    },
  },

  whatsapp: {
    name: 'WhatsApp',
    colors: {
      sent: '#25D366',
      received: '#FFFFFF',
      sentText: '#ffffff',
      receivedText: '#000000',
      background: '#E5DDD5',
      headerBackground: '#075E54',
      headerBorder: '#054640',
      headerText: '#ffffff',
      statusBar: '#ffffff',
      typingBubbleSent: '#25D366',
      typingBubbleReceived: '#FFFFFF',
      typingDotSent: '#ffffff',
      typingDotReceived: '#9E9E9E',
      keyboardBackground: '#F0F0F0',
      keyboardBorder: '#CCCCCC',
      keyboardKey: '#ffffff',
      keyboardKeyActive: '#DDDDDD',
      inputBackground: '#FFFFFF',
      inputText: '#000000',
      deliveredText: '#9E9E9E',
    },
    bubble: {
      maxWidth: '75%',
      padding: '6px 12px',
      fontSize: 16,
      lineHeight: 1.3,
  fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      borderRadius: {
        sent: {
          topLeft: (first) => 8,
          topRight: (first) => first ? 8 : 3,
          bottomLeft: (last) => 8,
          bottomRight: (last) => last ? 8 : 3,
        },
        received: {
          topLeft: (first) => first ? 8 : 3,
          topRight: (first) => 8,
          bottomLeft: (last) => last ? 8 : 3,
          bottomRight: (last) => 8,
        },
      },
      shadow: {
        sent: '0 1px 2px rgba(0,0,0,.2)',
        received: '0 1px 2px rgba(0,0,0,.1)',
      },
      letterSpacing: 0,
  marginBottom: 8,
    },
    header: {
      height: 56,
      fontSize: 18,
      fontWeight: 500,
    },
    statusBar: {
      height: 44,
      fontSize: 15,
      fontWeight: 500,
    },
    keyboard: {
      height: 280,
      keyBorderRadius: 4,
      keyFontSize: 15,
      keyFontWeight: 400,
    },
  },

  snapchat: {
    name: 'Snapchat',
    colors: {
      sent: '#FFFC00',
      received: '#F5F5F5',
      sentText: '#000000',
      receivedText: '#000000',
      background: '#FFFFFF',
      headerBackground: '#FFFC00',
      headerBorder: '#E6E300',
      headerText: '#000000',
      statusBar: '#000000',
      typingBubbleSent: '#FFFC00',
      typingBubbleReceived: '#F5F5F5',
      typingDotSent: '#000000',
      typingDotReceived: '#9E9E9E',
      keyboardBackground: '#F8F8F8',
      keyboardBorder: '#E0E0E0',
      keyboardKey: '#ffffff',
      keyboardKeyActive: '#FFFC00',
      inputBackground: '#FFFFFF',
      inputText: '#000000',
      deliveredText: '#9E9E9E',
    },
    bubble: {
      maxWidth: '80%',
      padding: '10px 16px',
      fontSize: 16,
      lineHeight: 1.4,
  fontFamily: 'Avenir Next, "Helvetica Neue", Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
      borderRadius: {
        sent: {
          topLeft: (first) => 20,
          topRight: (first) => first ? 20 : 8,
          bottomLeft: (last) => 20,
          bottomRight: (last) => last ? 20 : 8,
        },
        received: {
          topLeft: (first) => first ? 20 : 8,
          topRight: (first) => 20,
          bottomLeft: (last) => last ? 20 : 8,
          bottomRight: (last) => 20,
        },
      },
      shadow: {
        sent: '0 2px 8px rgba(255, 252, 0, 0.3)',
        received: '0 1px 4px rgba(0,0,0,.1)',
      },
      letterSpacing: 0.2,
  marginBottom: 10,
    },
    header: {
      height: 50,
      fontSize: 18,
      fontWeight: 700,
    },
    statusBar: {
      height: 44,
      fontSize: 15,
      fontWeight: 600,
    },
    keyboard: {
      height: 290,
      keyBorderRadius: 8,
      keyFontSize: 16,
      keyFontWeight: 500,
    },
  },
};

export const getTheme = (themeName: string): ChatTheme => {
  return themes[themeName] || themes.imessage;
};