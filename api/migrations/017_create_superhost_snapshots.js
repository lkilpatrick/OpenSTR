/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('superhost_snapshots', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    snapshot_date: { type: 'date', notNull: true },
    overall_rating: { type: 'numeric(3,2)' },
    response_rate: { type: 'numeric(5,2)' },
    cancellation_rate: { type: 'numeric(5,2)' },
    completed_stays: { type: 'smallint' },
    qualifies: { type: 'boolean' },
    next_assessment_date: { type: 'date' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('superhost_snapshots', 'superhost_snapshots_unique',
    'UNIQUE (property_id, snapshot_date)');
  pgm.createIndex('superhost_snapshots', 'property_id');
};

exports.down = (pgm) => {
  pgm.dropTable('superhost_snapshots');
};
