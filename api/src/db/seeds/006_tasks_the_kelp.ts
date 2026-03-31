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

export async function seedTasksTheKelp() {
  const tasks: TaskInsert[] = [
    { label: 'Scrub toilet bowl', category: 'Sanitise' },
    { label: 'Sanitise toilet flush handle and seat', category: 'Sanitise', isHighTouch: true },
    { label: 'Clean and sanitise sink and counter', category: 'Sanitise' },
    { label: 'Sanitise bathroom tap handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Scrub and rinse shower / bathtub', category: 'Cleaning' },
    { label: 'Clean shower door / curtain', category: 'Cleaning' },
    { label: 'Sanitise light switches (bathroom)', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise bathroom door handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Wipe mirror (streak-free)', category: 'Cleaning' },
    { label: 'Replace toilet paper roll — ensure backup under sink', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Toilet paper', supplyLowThreshold: 5 },
    { label: 'Refill shampoo dispenser', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Shampoo', supplyLowThreshold: 5 },
    { label: 'Refill conditioner dispenser', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Conditioner', supplyLowThreshold: 5 },
    { label: 'Refill body wash dispenser', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Body wash', supplyLowThreshold: 5 },
    { label: 'Replace hand soap if low', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Hand soap', supplyLowThreshold: 5 },
    { label: 'Fold and place fresh towels', category: 'Laundry' },
    { label: 'Mop bathroom floor', category: 'Cleaning' },
    { label: 'Empty bathroom trash and replace liner', category: 'Cleaning', requiresSupplyCheck: true, supplyItem: 'Small trash liners', supplyLowThreshold: 5 },
  ];

  await insertTasks(ROOM_IDS.THE_KELP, tasks);
  console.log('The Kelp tasks seeded.');
}
