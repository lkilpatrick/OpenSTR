/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('properties', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: { type: 'varchar(100)', notNull: true },
    type: { type: 'varchar(30)', notNull: true, default: "'short_term_rental'" },
    address: { type: 'text' },
    ical_url: { type: 'text' },
    lock_entity_id: { type: 'varchar(100)' },
    session_trigger_time: { type: 'time', default: "'10:00'" },
    min_turnaround_hours: { type: 'smallint', default: 3 },
    standard_id: { type: 'uuid' },
    active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('properties', 'active');
};

exports.down = (pgm) => {
  pgm.dropTable('properties');
};
