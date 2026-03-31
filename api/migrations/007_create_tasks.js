/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('tasks', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    room_id: {
      type: 'uuid',
      notNull: true,
      references: '"rooms"',
      onDelete: 'CASCADE',
    },
    standard_task_id: {
      type: 'uuid',
      references: '"standard_tasks"',
      onDelete: 'SET NULL',
    },
    label: { type: 'text', notNull: true },
    category: { type: 'varchar(50)', notNull: true },
    frequency: { type: 'varchar(20)', notNull: true, default: "'every_clean'" },
    is_high_touch: { type: 'boolean', notNull: true, default: false },
    is_mandatory: { type: 'boolean', notNull: true, default: true },
    is_override: { type: 'boolean', notNull: true, default: false },
    is_applicable: { type: 'boolean', notNull: true, default: true },
    requires_supply_check: { type: 'boolean', notNull: true, default: false },
    supply_item: { type: 'varchar(100)' },
    supply_low_threshold: { type: 'smallint', default: 5 },
    display_order: { type: 'smallint', notNull: true, default: 0 },
    archived: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('tasks', 'room_id');
  pgm.createIndex('tasks', 'property_id');
  pgm.addConstraint('tasks', 'tasks_category_check',
    "CHECK (category IN ('Cleaning', 'Sanitise', 'Laundry', 'Restocking', 'Check', 'Photography'))");
  pgm.addConstraint('tasks', 'tasks_frequency_check',
    "CHECK (frequency IN ('every_clean', 'weekly', 'monthly', 'deep_clean'))");
};

exports.down = (pgm) => {
  pgm.dropTable('tasks');
};
