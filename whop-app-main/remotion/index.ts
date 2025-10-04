import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';
export { RemotionRoot } from './Root';
export { MessageConversation } from './MessageConversation';

// Register root for Remotion bundler programmatic usage
registerRoot(RemotionRoot);
