/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    name: { type: 'varchar(100)', notNull: true },
    role: { type: 'varchar(20)', notNull: true, default: "'cleaner'" },
    password_hash: { type: 'text', notNull: true },
    active: { type: 'boolean', notNull: true, default: true },
    push_token: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('users', 'email');
  pgm.createIndex('users', 'role');
  pgm.addConstraint('users', 'users_role_check',
    "CHECK (role IN ('guest', 'cleaner', 'admin', 'owner'))");
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
