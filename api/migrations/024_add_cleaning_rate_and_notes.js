exports.up = (pgm) => {
  // Add cleaning rate (per clean) to users table for cleaners
  pgm.addColumn('users', {
    cleaning_rate: { type: 'numeric(8,2)', default: null },
  });

  // Create cleaner_notes table for notes cleaners leave on sessions
  pgm.createTable('cleaner_notes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    session_id: { type: 'uuid', notNull: true, references: 'clean_sessions', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', notNull: true, references: 'users', onDelete: 'CASCADE' },
    note: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') },
  });
  pgm.createIndex('cleaner_notes', 'session_id');
};

exports.down = (pgm) => {
  pgm.dropTable('cleaner_notes');
  pgm.dropColumn('users', 'cleaning_rate');
};
