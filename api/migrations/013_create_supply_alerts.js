/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('supply_alerts', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    task_id: {
      type: 'uuid',
      references: '"tasks"',
      onDelete: 'SET NULL',
    },
    item_name: { type: 'varchar(100)', notNull: true },
    quantity_remaining: { type: 'smallint' },
    resolved: { type: 'boolean', notNull: true, default: false },
    resolved_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('supply_alerts', 'property_id');
  pgm.createIndex('supply_alerts', 'resolved');
};

exports.down = (pgm) => {
  pgm.dropTable('supply_alerts');
};
