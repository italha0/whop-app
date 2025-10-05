
import { WhopAPI, WhopNextJS } from '@whop-apps/sdk';

export default WhopNextJS.appAuth({
  whop: WhopAPI.app(process.env.WHOP_API_KEY!),
});