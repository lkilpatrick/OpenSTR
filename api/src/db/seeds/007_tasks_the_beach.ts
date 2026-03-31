import { pool } from '../pool';
import { PROPERTY_IDS } from './001_properties';
import { ROOM_IDS } from './003_rooms';

type TaskInsert = {
  label: string;
  category: string;
  frequency?: string;
  isHighTouch?: boolean;
  requiresSupplyCheck?: boolean;
  supplyItem?: string;
  supplyLowThreshold?: number;
};

async function insertTasks(roomId: string, tasks: TaskInsert[]) {
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    await pool.query(`
      INSERT INTO tasks (property_id, room_id, label, category, frequency, is_high_touch,
        requires_supply_check, supply_item, supply_low_threshold, display_order)
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      WHERE NOT EXISTS (
        SELECT 1 FROM tasks WHERE room_id = $2 AND label = $3
      )
    `, [
      PROPERTY_IDS.OCEAN_VIEW,
      roomId,
      t.label,
      t.category,
      t.frequency ?? 'every_clean',
      t.isHighTouch ?? false,
      t.requiresSupplyCheck ?? false,
      t.supplyItem ?? null,
      t.supplyLowThreshold ?? null,
      i,
    ]);
  }
}

export async function seedTasksTheBeach() {
  const tasks: TaskInsert[] = [
    { label: 'Make bed with fresh sheets', category: 'Laundry' },
    { label: 'Fluff and arrange pillows', category: 'Laundry' },
    { label: 'Place folded blanket at foot of bed', category: 'Laundry' },
    { label: 'Dust bedside tables and lamps', category: 'Cleaning' },
    { label: 'Wipe bedside table surfaces', category: 'Cleaning' },
    { label: 'Sanitise bedside lamp switches', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise bedroom light switches', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise bedroom door handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Check under bed and clear any items', category: 'Check' },
    { label: 'Vacuum bedroom floor', category: 'Cleaning' },
    { label: 'Wipe wardrobe / closet fronts', category: 'Cleaning' },
    { label: 'Check wardrobe for left items', category: 'Check' },
    { label: 'Close blinds / curtains neatly', category: 'Check' },
  ];

  await insertTasks(ROOM_IDS.THE_BEACH, tasks);
  console.log('The Beach tasks seeded.');
}
