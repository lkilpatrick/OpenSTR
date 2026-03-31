/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('issues', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    session_id: {
      type: 'uuid',
      references: '"clean_sessions"',
      onDelete: 'SET NULL',
    },
    reported_by: {
      type: 'uuid',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    title: { type: 'varchar(200)', notNull: true },
    description: { type: 'text' },
    severity: { type: 'varchar(20)', notNull: true, default: "'medium'" },
    status: { type: 'varchar(20)', notNull: true, default: "'open'" },
    resolved_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('issues', 'property_id');
  pgm.createIndex('issues', 'status');
  pgm.addConstraint('issues', 'issues_severity_check',
    "CHECK (severity IN ('low', 'medium', 'high', 'critical'))");
  pgm.addConstraint('issues', 'issues_status_check',
    "CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))");
};

exports.down = (pgm) => {
  pgm.dropTable('issues');
};
