/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('guest_messages', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    reservation_id: {
      type: 'uuid',
      references: '"reservations"',
      onDelete: 'SET NULL',
    },
    sender_name: { type: 'varchar(100)' },
    message: { type: 'text', notNull: true },
    source: { type: 'varchar(30)', notNull: true, default: "'airbnb'" },
    read: { type: 'boolean', notNull: true, default: false },
    received_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('guest_messages', 'property_id');
  pgm.createIndex('guest_messages', 'read');
};

exports.down = (pgm) => {
  pgm.dropTable('guest_messages');
};
