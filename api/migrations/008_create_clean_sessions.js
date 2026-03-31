/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('clean_sessions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    triggered_by: { type: 'varchar(30)', notNull: true, default: "'manual'" },
    cleaner_id: {
      type: 'uuid',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    status: { type: 'varchar(30)', notNull: true, default: "'pending'" },
    session_type: { type: 'varchar(20)', notNull: true, default: "'turnover'" },
    compliance_score: { type: 'numeric(5,2)' },
    reservation_id: { type: 'uuid' },
    rejection_reason: { type: 'text' },
    cleaner_start_time: { type: 'timestamptz' },
    cleaner_end_time: { type: 'timestamptz' },
    submitted_at: { type: 'timestamptz' },
    reviewed_at: { type: 'timestamptz' },
    reviewed_by: { type: 'uuid', references: '"users"', onDelete: 'SET NULL' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('clean_sessions', 'property_id');
  pgm.createIndex('clean_sessions', 'cleaner_id');
  pgm.createIndex('clean_sessions', 'status');
  pgm.addConstraint('clean_sessions', 'clean_sessions_status_check',
    "CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected'))");
  pgm.addConstraint('clean_sessions', 'clean_sessions_type_check',
    "CHECK (session_type IN ('turnover', 'deep_clean', 'scheduled'))");
  pgm.addConstraint('clean_sessions', 'clean_sessions_trigger_check',
    "CHECK (triggered_by IN ('ical', 'lock_event', 'manual'))");
};

exports.down = (pgm) => {
  pgm.dropTable('clean_sessions');
};
