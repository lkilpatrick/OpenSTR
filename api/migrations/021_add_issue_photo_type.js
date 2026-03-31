exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_type_check`);
  pgm.addConstraint('photos', 'photos_type_check',
    "CHECK (type IN ('before', 'after', 'issue'))");
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE photos DROP CONSTRAINT IF EXISTS photos_type_check`);
  pgm.addConstraint('photos', 'photos_type_check',
    "CHECK (type IN ('before', 'after'))");
};
