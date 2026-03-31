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

export async function seedTasksTheShore() {
  const tasks: TaskInsert[] = [
    { label: 'Final vacuum — hallway and entry', category: 'Cleaning' },
    { label: 'Mop entry and hallway floors', category: 'Cleaning' },
    { label: 'Wipe entry door and handle', category: 'Cleaning' },
    { label: 'Sanitise entry door handle (inside + outside)', category: 'Sanitise', isHighTouch: true },
    { label: 'Collect all laundry from dryer and fold', category: 'Laundry' },
    { label: 'Store clean linens in linen cupboard', category: 'Laundry' },
    { label: 'Before photo — entry area', category: 'Photography' },
    { label: 'After photo — entry area', category: 'Photography' },
    { label: 'After photo — kitchen overview', category: 'Photography' },
    { label: 'After photo — living room overview', category: 'Photography' },
    { label: 'After photo — bathroom', category: 'Photography' },
    { label: 'After photo — bedroom', category: 'Photography' },
    { label: 'Final walkthrough — check all rooms', category: 'Check' },
    { label: 'Confirm all windows and doors locked', category: 'Check' },
    { label: 'Turn off all lights', category: 'Check' },
    { label: 'Set thermostat to default', category: 'Check' },
    { label: 'Collect all cleaning supplies and leave', category: 'Check' },
  ];

  await insertTasks(ROOM_IDS.THE_SHORE, tasks);
  console.log('The Shore tasks seeded.');
}
