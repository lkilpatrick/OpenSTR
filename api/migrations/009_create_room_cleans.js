/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('room_cleans', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    session_id: {
      type: 'uuid',
      notNull: true,
      references: '"clean_sessions"',
      onDelete: 'CASCADE',
    },
    room_id: {
      type: 'uuid',
      notNull: true,
      references: '"rooms"',
      onDelete: 'CASCADE',
    },
    status: { type: 'varchar(20)', notNull: true, default: "'pending'" },
    started_at: { type: 'timestamptz' },
    completed_at: { type: 'timestamptz' },
  });

  pgm.createIndex('room_cleans', 'session_id');
  pgm.addConstraint('room_cleans', 'room_cleans_status_check',
    "CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped'))");
};

exports.down = (pgm) => {
  pgm.dropTable('room_cleans');
};
