/**
 * Seeds default standard tasks into the "Enhanced Clean" standard,
 * creates rooms for My STR Property, then populates tasks for all
 * properties that use that standard.
 *
 * Safe to run multiple times — skips existing rooms/tasks.
 */
import 'dotenv/config';
import { pool } from './pool';

const STANDARD_ID = '74eb4cc0-515f-4131-a55b-109329b81504';
const OCEAN_VIEW_ID = 'YOUR-PROPERTY-ID-HERE';

// Default tasks per room type
const DEFAULT_TASKS: { room_type: string; label: string; category: string; frequency: string; is_high_touch: boolean; is_mandatory: boolean; display_order: number }[] = [
  // Kitchen
  { room_type: 'kitchen', label: 'Wipe down countertops', category: 'Cleaning', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 0 },
  { room_type: 'kitchen', label: 'Clean sink and faucet', category: 'Cleaning', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 1 },
  { room_type: 'kitchen', label: 'Wipe appliance exteriors (microwave, toaster, coffee maker)', category: 'Cleaning', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 2 },
  { room_type: 'kitchen', label: 'Clean stovetop and oven exterior', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 3 },
  { room_type: 'kitchen', label: 'Empty and reline trash bin', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 4 },
  { room_type: 'kitchen', label: 'Sweep and mop floor', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 5 },
  { room_type: 'kitchen', label: 'Check and restock dish soap, sponge, paper towels', category: 'Restocking', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 6 },
  { room_type: 'kitchen', label: 'Run dishwasher or hand-wash dishes', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 7 },
  { room_type: 'kitchen', label: 'Clean inside microwave', category: 'Cleaning', frequency: 'weekly', is_high_touch: false, is_mandatory: false, display_order: 8 },
  { room_type: 'kitchen', label: 'Clean refrigerator interior', category: 'Cleaning', frequency: 'monthly', is_high_touch: false, is_mandatory: false, display_order: 9 },

  // Bathroom
  { room_type: 'bathroom', label: 'Clean and disinfect toilet (inside and out)', category: 'Sanitise', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 0 },
  { room_type: 'bathroom', label: 'Clean sink and faucet', category: 'Cleaning', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 1 },
  { room_type: 'bathroom', label: 'Clean shower/tub and fixtures', category: 'Cleaning', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 2 },
  { room_type: 'bathroom', label: 'Wipe mirror and glass surfaces', category: 'Cleaning', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 3 },
  { room_type: 'bathroom', label: 'Replace towels with fresh ones', category: 'Laundry', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 4 },
  { room_type: 'bathroom', label: 'Restock toilet paper (min 4 rolls)', category: 'Restocking', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 5 },
  { room_type: 'bathroom', label: 'Restock shampoo, conditioner, body wash, hand soap', category: 'Restocking', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 6 },
  { room_type: 'bathroom', label: 'Empty trash bin and reline', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 7 },
  { room_type: 'bathroom', label: 'Sweep and mop floor', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 8 },
  { room_type: 'bathroom', label: 'Scrub grout and tiles', category: 'Cleaning', frequency: 'monthly', is_high_touch: false, is_mandatory: false, display_order: 9 },

  // Bedroom
  { room_type: 'bedroom', label: 'Strip and remake bed with fresh linens', category: 'Laundry', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 0 },
  { room_type: 'bedroom', label: 'Fluff and arrange pillows', category: 'Check', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 1 },
  { room_type: 'bedroom', label: 'Dust all surfaces (nightstands, dresser, shelves)', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 2 },
  { room_type: 'bedroom', label: 'Wipe light switches and door handles', category: 'Sanitise', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 3 },
  { room_type: 'bedroom', label: 'Vacuum floor and under bed', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 4 },
  { room_type: 'bedroom', label: 'Check and clear closet/drawers of guest items', category: 'Check', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 5 },
  { room_type: 'bedroom', label: 'Check TV remote batteries and function', category: 'Check', frequency: 'weekly', is_high_touch: true, is_mandatory: false, display_order: 6 },
  { room_type: 'bedroom', label: 'Flip or rotate mattress', category: 'Check', frequency: 'monthly', is_high_touch: false, is_mandatory: false, display_order: 7 },

  // Living Room
  { room_type: 'living_room', label: 'Vacuum upholstery and floor', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 0 },
  { room_type: 'living_room', label: 'Dust surfaces (coffee table, shelves, TV stand)', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 1 },
  { room_type: 'living_room', label: 'Wipe remote controls and light switches', category: 'Sanitise', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 2 },
  { room_type: 'living_room', label: 'Fluff and arrange cushions/throws', category: 'Check', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 3 },
  { room_type: 'living_room', label: 'Remove any guest items left behind', category: 'Check', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 4 },
  { room_type: 'living_room', label: 'Clean windows and glass doors', category: 'Cleaning', frequency: 'weekly', is_high_touch: false, is_mandatory: false, display_order: 5 },

  // Laundry
  { room_type: 'laundry', label: 'Run dirty linens through wash and dry cycle', category: 'Laundry', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 0 },
  { room_type: 'laundry', label: 'Fold and store clean linens', category: 'Laundry', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 1 },
  { room_type: 'laundry', label: 'Clean lint trap', category: 'Check', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 2 },
  { room_type: 'laundry', label: 'Restock laundry detergent and dryer sheets', category: 'Restocking', frequency: 'every_clean', is_high_touch: false, is_mandatory: false, display_order: 3 },

  // Entryway
  { room_type: 'entryway', label: 'Sweep/vacuum entryway floor', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 0 },
  { room_type: 'entryway', label: 'Wipe door handles and light switches', category: 'Sanitise', frequency: 'every_clean', is_high_touch: true, is_mandatory: true, display_order: 1 },
  { room_type: 'entryway', label: 'Check welcome note and guest info binder', category: 'Check', frequency: 'every_clean', is_high_touch: false, is_mandatory: false, display_order: 2 },

  // Outdoor
  { room_type: 'outdoor', label: 'Clear patio/deck of debris and wipe furniture', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 0 },
  { room_type: 'outdoor', label: 'Empty outdoor trash bins', category: 'Cleaning', frequency: 'every_clean', is_high_touch: false, is_mandatory: true, display_order: 1 },
  { room_type: 'outdoor', label: 'Check BBQ grill (clean grates if used)', category: 'Check', frequency: 'every_clean', is_high_touch: false, is_mandatory: false, display_order: 2 },
];

// Rooms to create for My STR Property
const OCEAN_VIEW_ROOMS = [
  { display_name: 'Kitchen',      slug: 'kitchen',      standard_room_type: 'kitchen',     display_order: 0 },
  { display_name: 'Bathroom',     slug: 'bathroom',     standard_room_type: 'bathroom',    display_order: 1 },
  { display_name: 'Bedroom',      slug: 'bedroom',      standard_room_type: 'bedroom',     display_order: 2 },
  { display_name: 'Living Room',  slug: 'living-room',  standard_room_type: 'living_room', display_order: 3 },
  { display_name: 'Laundry',      slug: 'laundry',      standard_room_type: 'laundry',     display_order: 4 },
  { display_name: 'Entryway',     slug: 'entryway',     standard_room_type: 'entryway',    display_order: 5 },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Seed standard tasks (skip if already exist)
    console.log('📋 Seeding standard tasks...');
    let taskSeeded = 0;
    for (const t of DEFAULT_TASKS) {
      const exists = await client.query(
        `SELECT id FROM standard_tasks WHERE standard_id = $1 AND room_type = $2 AND label = $3`,
        [STANDARD_ID, t.room_type, t.label]
      );
      if (exists.rows.length === 0) {
        await client.query(
          `INSERT INTO standard_tasks (standard_id, room_type, label, category, frequency, is_high_touch, is_mandatory, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [STANDARD_ID, t.room_type, t.label, t.category, t.frequency, t.is_high_touch, t.is_mandatory, t.display_order]
        );
        taskSeeded++;
      }
    }
    console.log(`  ✅ ${taskSeeded} standard tasks seeded`);

    // 2. Create rooms for My STR Property (skip existing)
    console.log('🏠 Creating rooms for My STR Property...');
    let roomsCreated = 0;
    const roomIds: { id: string; standard_room_type: string }[] = [];

    for (const r of OCEAN_VIEW_ROOMS) {
      const exists = await client.query(
        `SELECT id, standard_room_type FROM rooms WHERE property_id = $1 AND slug = $2`,
        [OCEAN_VIEW_ID, r.slug]
      );
      if (exists.rows.length > 0) {
        roomIds.push({ id: exists.rows[0].id, standard_room_type: r.standard_room_type });
        console.log(`  ⏭  Room "${r.display_name}" already exists`);
      } else {
        const inserted = await client.query(
          `INSERT INTO rooms (property_id, slug, display_name, standard_room_type, display_order)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [OCEAN_VIEW_ID, r.slug, r.display_name, r.standard_room_type, r.display_order]
        );
        roomIds.push({ id: inserted.rows[0].id, standard_room_type: r.standard_room_type });
        roomsCreated++;
        console.log(`  ✅ Created room "${r.display_name}"`);
      }
    }

    // Also assign the standard to My STR Property
    await client.query(
      `UPDATE properties SET standard_id = $1 WHERE id = $2`,
      [STANDARD_ID, OCEAN_VIEW_ID]
    );

    // 3. Populate tasks for each room from standard_tasks
    console.log('✅ Populating tasks for Ocean View rooms...');
    let tasksCreated = 0;
    for (const room of roomIds) {
      const stdTasks = await client.query(
        `SELECT * FROM standard_tasks WHERE standard_id = $1 AND room_type = $2`,
        [STANDARD_ID, room.standard_room_type]
      );
      for (const st of stdTasks.rows) {
        const exists = await client.query(
          `SELECT id FROM tasks WHERE room_id = $1 AND standard_task_id = $2`,
          [room.id, st.id]
        );
        if (exists.rows.length === 0) {
          await client.query(
            `INSERT INTO tasks (property_id, room_id, standard_task_id, label, category, frequency, is_high_touch, is_mandatory, display_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [OCEAN_VIEW_ID, room.id, st.id, st.label, st.category, st.frequency, st.is_high_touch, st.is_mandatory, st.display_order]
          );
          tasksCreated++;
        }
      }
    }

    await client.query('COMMIT');
    console.log(`\n🎉 Done!`);
    console.log(`   Standard tasks seeded: ${taskSeeded}`);
    console.log(`   Rooms created: ${roomsCreated}`);
    console.log(`   Tasks created: ${tasksCreated}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
