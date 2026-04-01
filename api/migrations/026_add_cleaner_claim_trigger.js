exports.up = async (pgm) => {
  // Drop old CHECK constraints (original name and any newer one) and add updated one with 'cleaner_claim'
  pgm.sql(`ALTER TABLE clean_sessions DROP CONSTRAINT IF EXISTS clean_sessions_trigger_check`);
  pgm.sql(`ALTER TABLE clean_sessions DROP CONSTRAINT IF EXISTS clean_sessions_triggered_by_check`);
  pgm.sql(`ALTER TABLE clean_sessions ADD CONSTRAINT clean_sessions_triggered_by_check CHECK (triggered_by IN ('ical', 'lock_event', 'manual', 'cleaner_claim'))`);
};

exports.down = async (pgm) => {
  pgm.sql(`ALTER TABLE clean_sessions DROP CONSTRAINT IF EXISTS clean_sessions_triggered_by_check`);
  pgm.sql(`ALTER TABLE clean_sessions ADD CONSTRAINT clean_sessions_trigger_check CHECK (triggered_by IN ('ical', 'lock_event', 'manual'))`);
};
