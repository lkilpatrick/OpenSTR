exports.up = (pgm) => {
  pgm.createTable('superhost_snapshots', {
    id: { type: 'serial', primaryKey: true },
    property_id: { type: 'integer', notNull: true, references: 'properties', onDelete: 'CASCADE' },
    snapshot_date: { type: 'date', notNull: true },
    overall_rating: { type: 'numeric(3,2)' },
    cleanliness_rating: { type: 'numeric(3,2)' },
    checkin_rating: { type: 'numeric(3,2)' },
    communication_rating: { type: 'numeric(3,2)' },
    response_rate: { type: 'numeric(5,2)' },
    acceptance_rate: { type: 'numeric(5,2)' },
    cancellation_count: { type: 'integer', default: 0 },
    is_superhost: { type: 'boolean', default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('NOW()') }
  });
};

exports.down = (pgm) => {
  pgm.dropTable('superhost_snapshots');
};
