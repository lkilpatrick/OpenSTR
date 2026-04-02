exports.up = async (pgm) => {
  pgm.sql(`ALTER TABLE clean_sessions ALTER COLUMN status SET DEFAULT 'pending'`);
  pgm.sql(`ALTER TABLE clean_sessions ALTER COLUMN triggered_by SET DEFAULT 'manual'`);
  pgm.sql(`ALTER TABLE clean_sessions ALTER COLUMN session_type SET DEFAULT 'turnover'`);
  pgm.sql(`ALTER TABLE room_cleans ALTER COLUMN status SET DEFAULT 'pending'`);
};

exports.down = async () => {};
