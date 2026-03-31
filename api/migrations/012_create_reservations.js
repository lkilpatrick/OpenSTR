/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('reservations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    source: { type: 'varchar(30)', notNull: true, default: "'airbnb_ical'" },
    external_uid: { type: 'varchar(200)', unique: true },
    checkin_date: { type: 'date', notNull: true },
    checkout_date: { type: 'date', notNull: true },
    summary: { type: 'varchar(200)' },
    turnaround_hours: { type: 'smallint' },
    synced_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('reservations', ['property_id', 'checkout_date'],
    { name: 'idx_reservations_property_checkout' });
  pgm.createIndex('reservations', 'external_uid',
    { name: 'idx_reservations_uid' });
};

exports.down = (pgm) => {
  pgm.dropTable('reservations');
};
