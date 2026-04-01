exports.up = async (sql) => {
  // Add 'accepted' to the clean_sessions status check constraint
  await sql`ALTER TABLE clean_sessions DROP CONSTRAINT IF EXISTS clean_sessions_status_check`;
  await sql`ALTER TABLE clean_sessions ADD CONSTRAINT clean_sessions_status_check
    CHECK (status IN ('pending', 'accepted', 'in_progress', 'submitted', 'approved', 'rejected'))`;
};

exports.down = async (sql) => {
  await sql`ALTER TABLE clean_sessions DROP CONSTRAINT IF EXISTS clean_sessions_status_check`;
  await sql`ALTER TABLE clean_sessions ADD CONSTRAINT clean_sessions_status_check
    CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected'))`;
};
