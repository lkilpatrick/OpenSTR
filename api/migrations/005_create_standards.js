/* eslint-disable camelcase */
exports.up = (pgm) => {
  pgm.createTable('standards', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(100)', notNull: true },
    description: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // Now we can add the FK from properties to standards
  pgm.addConstraint('properties', 'properties_standard_id_fk',
    'FOREIGN KEY (standard_id) REFERENCES standards(id) ON DELETE SET NULL');
};

exports.down = (pgm) => {
  pgm.dropConstraint('properties', 'properties_standard_id_fk');
  pgm.dropTable('standards');
};
