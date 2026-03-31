import { pool } from '../pool';
import { PROPERTY_IDS } from './001_properties';

export const ROOM_IDS = {
  THE_TIDE: '00000000-0000-0000-0002-000000000001',
  THE_DEEP: '00000000-0000-0000-0002-000000000002',
  THE_KELP: '00000000-0000-0000-0002-000000000003',
  THE_BEACH: '00000000-0000-0000-0002-000000000004',
  THE_SHORE: '00000000-0000-0000-0002-000000000005',
};

export async function seedRooms() {
  const rooms = [
    { id: ROOM_IDS.THE_TIDE, slug: 'the-tide', displayName: 'Laundry Phase', themeName: 'The Tide', order: 0, isLaundry: true },
    { id: ROOM_IDS.THE_DEEP, slug: 'the-deep', displayName: 'Kitchen & Living Room', themeName: 'The Deep', order: 1, isLaundry: false },
    { id: ROOM_IDS.THE_KELP, slug: 'the-kelp', displayName: 'Bathroom', themeName: 'The Kelp', order: 2, isLaundry: false },
    { id: ROOM_IDS.THE_BEACH, slug: 'the-beach', displayName: 'Bedroom', themeName: 'The Beach', order: 3, isLaundry: false },
    { id: ROOM_IDS.THE_SHORE, slug: 'the-shore', displayName: 'Final Cleaning', themeName: 'The Shore', order: 4, isLaundry: false },
  ];

  for (const room of rooms) {
    await pool.query(`
      INSERT INTO rooms (id, property_id, slug, display_name, theme_name, display_order, is_laundry_phase)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
    `, [room.id, PROPERTY_IDS.OCEAN_VIEW, room.slug, room.displayName, room.themeName, room.order, room.isLaundry]);
  }
  console.log('Rooms seeded.');
}
