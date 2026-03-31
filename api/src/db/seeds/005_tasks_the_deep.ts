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

export async function seedTasksTheDeep() {
  const tasks: TaskInsert[] = [
    // Kitchen
    { label: 'Wipe down all countertops and splashback', category: 'Cleaning' },
    { label: 'Clean stovetop and drip trays', category: 'Cleaning' },
    { label: 'Wipe inside and outside of microwave', category: 'Cleaning' },
    { label: 'Sanitise microwave buttons and handle', category: 'Sanitise', isHighTouch: true },
    { label: 'Wipe outside of all appliances (toaster, kettle, etc.)', category: 'Cleaning' },
    { label: 'Clean sink and taps', category: 'Cleaning' },
    { label: 'Sanitise kitchen tap handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Wipe cabinet fronts and handles', category: 'Cleaning' },
    { label: 'Sanitise kitchen door handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Check dish soap level', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Dish soap', supplyLowThreshold: 5 },
    { label: 'Check consumables (Coffee pods, Popcorn)', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Coffee & snacks', supplyLowThreshold: 5 },
    { label: 'Empty dishwasher and put away clean dishes', category: 'Cleaning' },
    { label: 'Wipe dining table and chairs', category: 'Cleaning' },
    // Living room
    { label: 'Vacuum all upholstered furniture', category: 'Cleaning' },
    { label: 'Fluff and arrange cushions and throw pillows', category: 'Cleaning' },
    { label: 'Sanitise TV remote and Roku remote', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise light switches (living room)', category: 'Sanitise', isHighTouch: true },
    { label: 'Wipe window sills and ledges', category: 'Cleaning' },
    { label: 'Vacuum / mop floors (kitchen + living room)', category: 'Cleaning' },
    { label: 'Empty trash can and replace liner', category: 'Cleaning', requiresSupplyCheck: true, supplyItem: 'Trash liners', supplyLowThreshold: 5 },
  ];

  await insertTasks(ROOM_IDS.THE_DEEP, tasks);
  console.log('The Deep tasks seeded.');
}
