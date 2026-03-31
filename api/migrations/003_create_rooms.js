/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('rooms', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    property_id: {
      type: 'uuid',
      notNull: true,
      references: '"properties"',
      onDelete: 'CASCADE',
    },
    slug: { type: 'varchar(50)', notNull: true },
    display_name: { type: 'varchar(100)', notNull: true },
    theme_name: { type: 'varchar(100)' },
    standard_room_type: { type: 'varchar(50)' },
    display_order: { type: 'smallint', notNull: true, default: 0 },
    is_laundry_phase: { type: 'boolean', notNull: true, default: false },
    last_deep_clean_at: { type: 'timestamptz' },
    archived: { type: 'boolean', notNull: true, default: false },
  });

  pgm.createIndex('rooms', 'property_id');
  pgm.addConstraint('rooms', 'rooms_slug_property_unique',
    'UNIQUE (property_id, slug)');
};

exports.down = (pgm) => {
  pgm.dropTable('rooms');
};
