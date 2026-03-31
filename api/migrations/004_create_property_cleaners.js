/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('property_cleaners', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    is_primary: { type: 'boolean', notNull: true, default: false },
    is_active: { type: 'boolean', notNull: true, default: true },
    assigned_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    notes: { type: 'text' },
  });

  pgm.addConstraint('property_cleaners', 'property_cleaners_unique',
    'UNIQUE (property_id, user_id)');
  pgm.createIndex('property_cleaners', 'property_id');
  pgm.createIndex('property_cleaners', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropTable('property_cleaners');
};
