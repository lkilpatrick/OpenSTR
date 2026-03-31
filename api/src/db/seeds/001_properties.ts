import { pool } from '../pool';

export const PROPERTY_IDS = {
  OCEAN_VIEW: '00000000-0000-0000-0000-000000000001',
  RESIDENCE: '00000000-0000-0000-0000-000000000002',
};

export async function seedProperties() {
  await pool.query(`
    INSERT INTO properties (id, name, type, active)
    VALUES
      ($1, 'My STR Property', 'short_term_rental', true),
      ($2, 'Owner''s Residence', 'private_home', true)
    ON CONFLICT (id) DO NOTHING
  `, [PROPERTY_IDS.OCEAN_VIEW, PROPERTY_IDS.RESIDENCE]);
  console.log('Properties seeded.');
}
