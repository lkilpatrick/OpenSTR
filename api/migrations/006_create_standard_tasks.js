/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('standard_tasks', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    standard_id: {
      type: 'uuid',
      notNull: true,
      references: '"standards"',
      onDelete: 'CASCADE',
    },
    room_type: { type: 'varchar(50)', notNull: true },
    label: { type: 'text', notNull: true },
    category: { type: 'varchar(50)', notNull: true },
    frequency: { type: 'varchar(20)', notNull: true, default: "'every_clean'" },
    is_high_touch: { type: 'boolean', notNull: true, default: false },
    is_mandatory: { type: 'boolean', notNull: true, default: true },
    display_order: { type: 'smallint', notNull: true, default: 0 },
  });

  pgm.createIndex('standard_tasks', 'standard_id');
  pgm.addConstraint('standard_tasks', 'standard_tasks_frequency_check',
    "CHECK (frequency IN ('every_clean', 'weekly', 'monthly', 'deep_clean'))");
};

exports.down = (pgm) => {
  pgm.dropTable('standard_tasks');
};
