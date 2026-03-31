import { pool } from '../pool';

export const STANDARD_IDS = {
  AIRBNB_ENHANCED: '00000000-0000-0000-0001-000000000001',
  HOME_STANDARD: '00000000-0000-0000-0001-000000000002',
};

export async function seedStandards() {
  await pool.query(`
    INSERT INTO standards (id, name, description)
    VALUES
      ($1, 'Airbnb Enhanced Clean', 'Full Airbnb Enhanced Clean protocol for short-term rentals'),
      ($2, 'Home Standard', 'Standard cleaning protocol for private residences')
    ON CONFLICT (id) DO NOTHING
  `, [STANDARD_IDS.AIRBNB_ENHANCED, STANDARD_IDS.HOME_STANDARD]);

  // Link My STR Property to the Airbnb standard
  await pool.query(`
    UPDATE properties SET standard_id = $1 WHERE id = $2
  `, [STANDARD_IDS.AIRBNB_ENHANCED, '00000000-0000-0000-0000-000000000001']);

  console.log('Standards seeded.');
}
