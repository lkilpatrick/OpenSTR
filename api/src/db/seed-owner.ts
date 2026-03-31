/**
 * Seed script to create the owner account for owner@openstr.dev
 * using better-auth's server-side API.
 *
 * Usage: npx tsx src/db/seed-owner.ts
 */
import 'dotenv/config';
import { auth } from '../lib/auth';
import { pool } from './pool';

async function seedOwner() {
  const email = 'owner@openstr.dev';
  const name = 'Property Owner';
  const password = 'ChangeMe123!'; // Change this after first login

  // Check if user already exists
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log(`User ${email} already exists (id: ${existing.rows[0].id})`);
    console.log('Updating role to owner...');
    await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['owner', email]);
    console.log('Done. User is now an owner.');
    await pool.end();
    process.exit(0);
  }

  // Create user via better-auth's server API
  console.log(`Creating owner account for ${email}...`);
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!result?.user?.id) {
      console.error('Failed to create user:', result);
      await pool.end();
      process.exit(1);
    }

    // Set role to owner (better-auth doesn't allow setting role on signup for security)
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', ['owner', result.user.id]);

    console.log('Owner account created successfully!');
    console.log(`  Email: ${email}`);
    console.log(`  Name: ${name}`);
    console.log(`  Password: ${password}`);
    console.log(`  User ID: ${result.user.id}`);
    console.log('\n⚠️  Change the password after first login!');
  } catch (err) {
    console.error('Error creating owner:', err);
  }

  await pool.end();
  process.exit(0);
}

seedOwner();
