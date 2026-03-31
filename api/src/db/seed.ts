import 'dotenv/config';
import { seedProperties } from './seeds/001_properties';
import { seedStandards } from './seeds/002_standards';
import { seedRooms } from './seeds/003_rooms';
import { seedTasksTheTide } from './seeds/004_tasks_the_tide';
import { seedTasksTheDeep } from './seeds/005_tasks_the_deep';
import { seedTasksTheKelp } from './seeds/006_tasks_the_kelp';
import { seedTasksTheBeach } from './seeds/007_tasks_the_beach';
import { seedTasksTheShore } from './seeds/008_tasks_the_shore';
import { pool } from './pool';

async function main() {
  console.log('Running seeds...');
  await seedProperties();
  await seedStandards();
  await seedRooms();
  await seedTasksTheTide();
  await seedTasksTheDeep();
  await seedTasksTheKelp();
  await seedTasksTheBeach();
  await seedTasksTheShore();
  console.log('All seeds complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
