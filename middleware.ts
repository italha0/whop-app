
import { WhopNextJS } from '@whop-apps/sdk';

export const config = {
  // Add your app's protected routes here
  matcher: ['/'],
};

export default WhopNextJS.protect(config);