import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import * as schema from './src/lib/db/schema.ts';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const adapter = DrizzleAdapter(db, {
  usersTable: schema.users,
  accountsTable: schema.accounts,
  sessionsTable: schema.sessions,
  verificationTokensTable: schema.verificationTokens,
});

try {
  console.log('1. Testing createUser...');
  const user = await adapter.createUser({
    name: 'Test User',
    email: 'test-' + Date.now() + '@test.com',
    emailVerified: null,
    image: null,
  });
  console.log('   createUser OK:', user);

  console.log('2. Testing getUserById...');
  const found = await adapter.getUserById(user.id);
  console.log('   getUserById OK:', found);

  console.log('3. Testing getUserByEmail...');
  const byEmail = await adapter.getUserByEmail(user.email);
  console.log('   getUserByEmail OK:', byEmail);

  console.log('4. Testing linkAccount...');
  await adapter.linkAccount({
    userId: user.id,
    type: 'oauth',
    provider: 'google',
    providerAccountId: 'test-' + Date.now(),
    access_token: 'test',
    token_type: 'bearer',
    scope: 'openid email profile',
  });
  console.log('   linkAccount OK');

  console.log('5. Testing createSession...');
  const session = await adapter.createSession({
    sessionToken: 'test-token-' + Date.now(),
    userId: user.id,
    expires: new Date(Date.now() + 86400000),
  });
  console.log('   createSession OK:', session);

  // Cleanup
  await adapter.deleteUser(user.id);
  console.log('6. Cleanup OK');

  console.log('\n✅ DrizzleAdapter works correctly!');
} catch (e) {
  console.error('❌ Error:', e.message);
  console.error('Stack:', e.stack);
}
