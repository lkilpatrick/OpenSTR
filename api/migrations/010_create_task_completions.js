/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('task_completions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    room_clean_id: {
      type: 'uuid',
      notNull: true,
      references: '"room_cleans"',
      onDelete: 'CASCADE',
    },
    task_id: {
      type: 'uuid',
      notNull: true,
      references: '"tasks"',
      onDelete: 'CASCADE',
    },
    completed: { type: 'boolean', notNull: true, default: false },
    quantity_value: { type: 'smallint' },
    supply_replenished: { type: 'boolean' },
    completed_at: { type: 'timestamptz' },
    notes: { type: 'text' },
  });

  pgm.createIndex('task_completions', 'room_clean_id');
  pgm.addConstraint('task_completions', 'task_completions_unique',
    'UNIQUE (room_clean_id, task_id)');
};

exports.down = (pgm) => {
  pgm.dropTable('task_completions');
};
