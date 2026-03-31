import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from './pool';

async function main() {
  const hash = await bcrypt.hash('admin123', 12);
  await pool.query(
    `INSERT INTO users (id, email, name, role, password_hash, active)
     VALUES ('00000000-0000-0000-0000-000000000099', 'admin@openstr.dev', 'Admin Owner', 'owner', $1, true)
     ON CONFLICT (id) DO UPDATE SET password_hash = $1`,
    [hash]
  );
  console.log('Admin user created: admin@openstr.dev / admin123');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
