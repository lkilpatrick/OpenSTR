/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('photos', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    room_clean_id: {
      type: 'uuid',
      notNull: true,
      references: '"room_cleans"',
      onDelete: 'CASCADE',
    },
    type: { type: 'varchar(10)', notNull: true },
    storage_path: { type: 'text', notNull: true },
    file_size_kb: { type: 'integer' },
    taken_at: { type: 'timestamptz' },
    uploaded_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('photos', 'room_clean_id');
  pgm.addConstraint('photos', 'photos_type_check',
    "CHECK (type IN ('before', 'after'))");
};

exports.down = (pgm) => {
  pgm.dropTable('photos');
};
