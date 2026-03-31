/* eslint-disable camelcase */
/**
 * Migration to add better-auth tables and adapt existing users table.
 *
 * better-auth core schema requires: user, session, account, verification.
 * We map "user" -> existing "users" table and add missing columns.
 * We create session, account, verification tables fresh.
 */
exports.up = (pgm) => {
  // 1. Add columns better-auth expects on the users table
  //    better-auth expects: id, name, email, emailVerified, image, createdAt, updatedAt
  //    Our table already has: id, name, email, created_at, updated_at
  //    We need to add: email_verified, image
  pgm.addColumns('users', {
    email_verified: { type: 'boolean', notNull: true, default: false },
    image: { type: 'text' },
  });

  // Make password_hash nullable (better-auth stores passwords in account table)
  pgm.alterColumn('users', 'password_hash', { notNull: false, default: null });

  // 2. Create "session" table for better-auth sessions
  pgm.createTable('session', {
    id: { type: 'text', primaryKey: true },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    token: { type: 'text', notNull: true, unique: true },
    expires_at: { type: 'timestamptz', notNull: true },
    ip_address: { type: 'text' },
    user_agent: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('session', 'user_id');
  pgm.createIndex('session', 'token');

  // 3. Create "account" table for better-auth (stores provider credentials / passwords)
  pgm.createTable('account', {
    id: { type: 'text', primaryKey: true },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    account_id: { type: 'text', notNull: true },
    provider_id: { type: 'text', notNull: true },
    access_token: { type: 'text' },
    refresh_token: { type: 'text' },
    access_token_expires_at: { type: 'timestamptz' },
    refresh_token_expires_at: { type: 'timestamptz' },
    scope: { type: 'text' },
    id_token: { type: 'text' },
    password: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('account', 'user_id');

  // 4. Create "verification" table for better-auth (email verification, password reset, etc.)
  pgm.createTable('verification', {
    id: { type: 'text', primaryKey: true },
    identifier: { type: 'text', notNull: true },
    value: { type: 'text', notNull: true },
    expires_at: { type: 'timestamptz', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // 5. Migrate existing user passwords from users.password_hash into account table
  //    This creates a "credential" account for each existing user with a password
  pgm.sql(`
    INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
    SELECT
      gen_random_uuid()::text,
      id,
      id::text,
      'credential',
      password_hash,
      created_at,
      updated_at
    FROM users
    WHERE password_hash IS NOT NULL AND password_hash != ''
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('verification');
  pgm.dropTable('account');
  pgm.dropTable('session');
  pgm.dropColumns('users', ['email_verified', 'image']);
  pgm.alterColumn('users', 'password_hash', { notNull: true });
};
