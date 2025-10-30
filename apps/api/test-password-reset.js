/**
 * Simple script to test password reset callback
 */
const { settings } = require('./dist/config/settings');
const { getAuth } = require('./dist/modules/auth/better-auth');
const { sendPasswordResetEmail } = require('./dist/lib/email');

async function test() {
  console.log('Testing password reset...');
  console.log('Settings:', {
    betterAuthUrl: settings.betterAuthUrl,
    isTest: settings.isTest,
  });

  const auth = getAuth();

  console.log('\nCalling requestPasswordReset...');
  const result = await auth.api.requestPasswordReset({
    body: {
      email: 'test@example.com',
      redirectTo: `${settings.betterAuthUrl}/reset-password`,
    },
  });

  console.log('Result:', result);
}

test().catch(console.error);
