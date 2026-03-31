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

export async function seedTasksTheTide() {
  const tasks: TaskInsert[] = [
    { label: 'Strip all beds — collect used sheets & towels', category: 'Laundry' },
    { label: 'Sort laundry into loads (sheets, towels, darks)', category: 'Laundry' },
    { label: '1st load — sheets in washer', category: 'Laundry' },
    { label: '2nd load — towels & face cloths', category: 'Laundry' },
    { label: '3rd load — blankets (one at a time)', category: 'Laundry', frequency: 'weekly' },
    { label: 'Move wash loads to dryer as each finishes', category: 'Laundry' },
    { label: 'Take out garbage', category: 'Check', requiresSupplyCheck: true, supplyItem: 'Small white bags', supplyLowThreshold: 5 },
    { label: 'Take out recycling', category: 'Check', requiresSupplyCheck: true, supplyItem: 'Small blue bags', supplyLowThreshold: 5 },
  ];

  await insertTasks(ROOM_IDS.THE_TIDE, tasks);
  console.log('The Tide tasks seeded.');
}
