
import { WhopNextJS } from '@whop-apps/sdk';

export const {
  GET,
  POST,
} = WhopNextJS.webhook({
  whop: {
    secret: process.env.AZURE_WEBHOOK_SECRET!,
  },
  async onActivated(event) {
    // Called when a user purchases a product and gains access to your app
  },
  async onDeactivated(event) {
    // Called when a user's access to your app is removed
  },
});