/**
 * seed-demo.ts — Generic demo data for open source users.
 * Creates a sample "Beach House" STR property with rooms, tasks, reservations, and sessions.
 * No personal data — safe for public repos.
 *
 * Usage: npx tsx src/db/seed-demo.ts
 */
import { pool } from './pool';
import bcrypt from 'bcrypt';
const uuidv4 = () => crypto.randomUUID();

// ── Fixed IDs for predictable references ────────────────────────────────────
const PROP = {
  BEACH_HOUSE: uuidv4(),
};

const USER = {
  ADMIN:   uuidv4(),
  CLEANER: uuidv4(),
};

const STD = {
  ENHANCED: uuidv4(),
};

const ROOM = {
  LAUNDRY:  uuidv4(),
  KITCHEN:  uuidv4(),
  BATHROOM: uuidv4(),
  BEDROOM:  uuidv4(),
  FINAL:    uuidv4(),
};

const SESSION = { S1: uuidv4(), S2: uuidv4(), S3: uuidv4() };
const RES     = { R1: uuidv4(), R2: uuidv4(), R3: uuidv4() };

type TaskDef = {
  label: string;
  category: string;
  frequency?: string;
  isHighTouch?: boolean;
  requiresSupplyCheck?: boolean;
  supplyItem?: string;
  supplyLowThreshold?: number;
};

async function insertTasks(propertyId: string, roomId: string, tasks: TaskDef[]) {
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    await pool.query(`
      INSERT INTO tasks (property_id, room_id, label, category, frequency, is_high_touch,
        requires_supply_check, supply_item, supply_low_threshold, display_order)
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE room_id = $2 AND label = $3)
    `, [
      propertyId, roomId, t.label, t.category,
      t.frequency ?? 'every_clean', t.isHighTouch ?? false,
      t.requiresSupplyCheck ?? false, t.supplyItem ?? null,
      t.supplyLowThreshold ?? null, i,
    ]);
  }
}

async function main() {
  console.log('🌱 Demo seed starting...');

  // ── Wipe (cascade) ───────────────────────────────────────────────────────
  await pool.query(`DELETE FROM guest_messages`);
  await pool.query(`DELETE FROM issues`);
  await pool.query(`DELETE FROM guest_ratings`);
  await pool.query(`DELETE FROM supply_alerts`);
  await pool.query(`DELETE FROM task_completions`);
  await pool.query(`DELETE FROM photos`);
  await pool.query(`DELETE FROM room_cleans`);
  await pool.query(`DELETE FROM clean_sessions`);
  await pool.query(`DELETE FROM reservations`);
  await pool.query(`DELETE FROM tasks`);
  await pool.query(`DELETE FROM rooms`);
  await pool.query(`DELETE FROM property_cleaners`);
  await pool.query(`DELETE FROM standard_tasks`);
  await pool.query(`DELETE FROM properties`);
  await pool.query(`DELETE FROM standards`);
  await pool.query(`DELETE FROM users`);

  // ── Users ────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 12);
  const cleanerHash = await bcrypt.hash('cleaner123', 12);

  await pool.query(`
    INSERT INTO users (id, email, name, role, password_hash, active) VALUES
      ($1, 'admin@demo.openstr.dev', 'Demo Owner', 'owner', $3, true),
      ($2, 'cleaner@demo.openstr.dev', 'Demo Cleaner', 'cleaner', $4, true)
  `, [USER.ADMIN, USER.CLEANER, adminHash, cleanerHash]);

  await pool.query(`
    INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES
      (gen_random_uuid()::text, $1::uuid, $1::text, 'credential', $3, now(), now()),
      (gen_random_uuid()::text, $2::uuid, $2::text, 'credential', $4, now(), now())
  `, [USER.ADMIN, USER.CLEANER, adminHash, cleanerHash]);
  console.log('✅ Users seeded');

  // ── Standards ────────────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO standards (id, name, description) VALUES
      ($1, 'Enhanced Clean', 'Full enhanced cleaning protocol for short-term rentals')
  `, [STD.ENHANCED]);
  console.log('✅ Standards seeded');

  // ── Property ─────────────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO properties (id, name, type, address, standard_id, active) VALUES
      ($1, 'Beach House', 'short_term_rental', '123 Ocean Drive', $2, true)
  `, [PROP.BEACH_HOUSE, STD.ENHANCED]);
  console.log('✅ Property seeded');

  // ── Assign cleaner ──────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO property_cleaners (property_id, user_id, is_primary, is_active) VALUES
      ($1, $2, true, true)
  `, [PROP.BEACH_HOUSE, USER.CLEANER]);

  // ── Rooms ───────────────────────────────────────────────────────────────
  const rooms = [
    { id: ROOM.LAUNDRY,  slug: 'laundry',  displayName: 'Laundry / Start',        themeName: 'Laundry',  order: 0, isLaundry: true  },
    { id: ROOM.KITCHEN,  slug: 'kitchen',   displayName: 'Kitchen & Living Room',  themeName: 'Kitchen',  order: 1, isLaundry: false },
    { id: ROOM.BATHROOM, slug: 'bathroom',  displayName: 'Bathroom',               themeName: 'Bathroom', order: 2, isLaundry: false },
    { id: ROOM.BEDROOM,  slug: 'bedroom',   displayName: 'Bedroom',                themeName: 'Bedroom',  order: 3, isLaundry: false },
    { id: ROOM.FINAL,    slug: 'final',     displayName: 'Final Walkthrough',      themeName: 'Final',    order: 4, isLaundry: false },
  ];
  for (const r of rooms) {
    await pool.query(`
      INSERT INTO rooms (id, property_id, slug, display_name, theme_name, display_order, is_laundry_phase)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [r.id, PROP.BEACH_HOUSE, r.slug, r.displayName, r.themeName, r.order, r.isLaundry]);
  }
  console.log('✅ Rooms seeded');

  // ── Tasks ───────────────────────────────────────────────────────────────
  await insertTasks(PROP.BEACH_HOUSE, ROOM.LAUNDRY, [
    { label: 'Strip all beds — collect sheets & towels', category: 'Laundry' },
    { label: 'Sort laundry into loads', category: 'Laundry' },
    { label: '1st load — sheets in washer', category: 'Laundry' },
    { label: '2nd load — towels', category: 'Laundry' },
    { label: 'Move loads to dryer as they finish', category: 'Laundry' },
    { label: 'Take out garbage', category: 'Check', requiresSupplyCheck: true, supplyItem: 'Trash bags', supplyLowThreshold: 5 },
    { label: 'Take out recycling', category: 'Check' },
  ]);

  await insertTasks(PROP.BEACH_HOUSE, ROOM.KITCHEN, [
    { label: 'Wipe all countertops', category: 'Cleaning' },
    { label: 'Clean stovetop', category: 'Cleaning' },
    { label: 'Wipe microwave inside and out', category: 'Cleaning' },
    { label: 'Sanitise tap handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Clean sink and taps', category: 'Cleaning' },
    { label: 'Wipe cabinet fronts and handles', category: 'Cleaning' },
    { label: 'Sanitise door handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Check dish soap level', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Dish soap', supplyLowThreshold: 5 },
    { label: 'Empty dishwasher', category: 'Cleaning' },
    { label: 'Wipe dining table and chairs', category: 'Cleaning' },
    { label: 'Vacuum upholstered furniture', category: 'Cleaning' },
    { label: 'Fluff cushions and throw pillows', category: 'Cleaning' },
    { label: 'Sanitise TV remote', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise light switches', category: 'Sanitise', isHighTouch: true },
    { label: 'Vacuum / mop floors', category: 'Cleaning' },
    { label: 'Empty trash and replace liner', category: 'Cleaning', requiresSupplyCheck: true, supplyItem: 'Trash liners', supplyLowThreshold: 5 },
  ]);

  await insertTasks(PROP.BEACH_HOUSE, ROOM.BATHROOM, [
    { label: 'Scrub toilet bowl', category: 'Sanitise' },
    { label: 'Sanitise toilet flush handle and seat', category: 'Sanitise', isHighTouch: true },
    { label: 'Clean and sanitise sink', category: 'Sanitise' },
    { label: 'Sanitise tap handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Scrub shower / bathtub', category: 'Cleaning' },
    { label: 'Clean shower door', category: 'Cleaning' },
    { label: 'Sanitise light switches', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise door handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Wipe mirror (streak-free)', category: 'Cleaning' },
    { label: 'Replace toilet paper roll', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Toilet paper', supplyLowThreshold: 5 },
    { label: 'Refill shampoo dispenser', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Shampoo', supplyLowThreshold: 5 },
    { label: 'Refill body wash dispenser', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Body wash', supplyLowThreshold: 5 },
    { label: 'Replace hand soap if low', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Hand soap', supplyLowThreshold: 5 },
    { label: 'Fold and place fresh towels', category: 'Laundry' },
    { label: 'Mop bathroom floor', category: 'Cleaning' },
  ]);

  await insertTasks(PROP.BEACH_HOUSE, ROOM.BEDROOM, [
    { label: 'Make bed with fresh sheets', category: 'Laundry' },
    { label: 'Fluff and arrange pillows', category: 'Laundry' },
    { label: 'Place folded blanket at foot of bed', category: 'Laundry' },
    { label: 'Dust bedside tables and lamps', category: 'Cleaning' },
    { label: 'Sanitise lamp switches', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise light switches', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise door handles', category: 'Sanitise', isHighTouch: true },
    { label: 'Check under bed for left items', category: 'Check' },
    { label: 'Vacuum floor', category: 'Cleaning' },
    { label: 'Wipe wardrobe fronts', category: 'Cleaning' },
    { label: 'Check wardrobe for left items', category: 'Check' },
  ]);

  await insertTasks(PROP.BEACH_HOUSE, ROOM.FINAL, [
    { label: 'Final vacuum — hallway and entry', category: 'Cleaning' },
    { label: 'Mop entry and hallway', category: 'Cleaning' },
    { label: 'Sanitise entry door handle', category: 'Sanitise', isHighTouch: true },
    { label: 'Collect laundry from dryer and fold', category: 'Laundry' },
    { label: 'Store clean linens', category: 'Laundry' },
    { label: 'After photo — entry area', category: 'Photography' },
    { label: 'After photo — kitchen', category: 'Photography' },
    { label: 'After photo — bathroom', category: 'Photography' },
    { label: 'After photo — bedroom', category: 'Photography' },
    { label: 'Final walkthrough — check all rooms', category: 'Check' },
    { label: 'Confirm windows and doors locked', category: 'Check' },
    { label: 'Turn off all lights', category: 'Check' },
    { label: 'Set thermostat to default', category: 'Check' },
  ]);
  console.log('✅ Tasks seeded');

  // ── Reservations ─────────────────────────────────────────────────────────
  const today = new Date();
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  };

  await pool.query(`
    INSERT INTO reservations (id, property_id, source, external_uid, checkin_date, checkout_date, summary)
    VALUES ($1, $2, 'airbnb_ical', 'demo-past-001', $3, $4, 'Past Guest')
  `, [RES.R1, PROP.BEACH_HOUSE, d(-10), d(-3)]);
  await pool.query(`
    INSERT INTO reservations (id, property_id, source, external_uid, checkin_date, checkout_date, summary)
    VALUES ($1, $2, 'airbnb_ical', 'demo-current-001', $3, $4, 'Current Guest')
  `, [RES.R2, PROP.BEACH_HOUSE, d(-2), d(2)]);
  await pool.query(`
    INSERT INTO reservations (id, property_id, source, external_uid, checkin_date, checkout_date, summary)
    VALUES ($1, $2, 'airbnb_ical', 'demo-future-001', $3, $4, 'Upcoming Guest')
  `, [RES.R3, PROP.BEACH_HOUSE, d(5), d(8)]);
  console.log('✅ Reservations seeded');

  // ── Sessions ─────────────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO clean_sessions (id, property_id, cleaner_id, triggered_by, status, session_type,
      reservation_id, compliance_score, cleaner_start_time, cleaner_end_time, submitted_at, reviewed_at, reviewed_by)
    VALUES ($1, $2, $3, 'ical', 'approved', 'turnover', $4, 96.00,
      now() - interval '7 days', now() - interval '7 days' + interval '2 hours',
      now() - interval '7 days' + interval '2 hours', now() - interval '6 days', $5)
  `, [SESSION.S1, PROP.BEACH_HOUSE, USER.CLEANER, RES.R1, USER.ADMIN]);

  await pool.query(`
    INSERT INTO clean_sessions (id, property_id, cleaner_id, triggered_by, status, session_type,
      reservation_id, cleaner_start_time, cleaner_end_time, submitted_at)
    VALUES ($1, $2, $3, 'ical', 'submitted', 'turnover', $4,
      now() - interval '1 day', now() - interval '1 day' + interval '1.5 hours',
      now() - interval '1 day' + interval '1.5 hours')
  `, [SESSION.S2, PROP.BEACH_HOUSE, USER.CLEANER, RES.R2]);

  await pool.query(`
    INSERT INTO clean_sessions (id, property_id, triggered_by, status, session_type, reservation_id)
    VALUES ($1, $2, 'ical', 'pending', 'turnover', $3)
  `, [SESSION.S3, PROP.BEACH_HOUSE, RES.R3]);
  console.log('✅ Sessions seeded');

  // ── Room cleans ──────────────────────────────────────────────────────────
  for (const roomId of Object.values(ROOM)) {
    await pool.query(`
      INSERT INTO room_cleans (session_id, room_id, status, started_at, completed_at)
      VALUES ($1, $2, 'completed', now() - interval '7 days', now() - interval '7 days' + interval '25 minutes')
    `, [SESSION.S1, roomId]);
  }
  for (const roomId of Object.values(ROOM)) {
    await pool.query(`
      INSERT INTO room_cleans (session_id, room_id, status, started_at, completed_at)
      VALUES ($1, $2, 'completed', now() - interval '1 day', now() - interval '1 day' + interval '20 minutes')
    `, [SESSION.S2, roomId]);
  }
  for (const roomId of Object.values(ROOM)) {
    await pool.query(`
      INSERT INTO room_cleans (session_id, room_id, status)
      VALUES ($1, $2, 'pending')
    `, [SESSION.S3, roomId]);
  }
  console.log('✅ Room cleans seeded');

  // ── Guest rating for completed session ───────────────────────────────────
  await pool.query(`
    INSERT INTO guest_ratings (session_id, rating, review_text)
    VALUES ($1, 5, 'Place was spotless! Great attention to detail.')
  `, [SESSION.S1]);

  // ── Issues ───────────────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO issues (property_id, title, description, severity, status) VALUES
      ($1, 'Shower drain slow', 'The shower drain seems to be draining slowly.', 'medium', 'open'),
      ($1, 'Light bulb out in hallway', 'The hallway light needs a replacement bulb.', 'low', 'open')
  `, [PROP.BEACH_HOUSE]);

  // ── Guest messages ───────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO guest_messages (property_id, sender_name, message, source, read) VALUES
      ($1, 'Guest', 'What is the WiFi password?', 'guest_page', false),
      ($1, 'Previous Guest', 'Wonderful stay — thank you!', 'guest_page', true)
  `, [PROP.BEACH_HOUSE]);

  console.log('\n🎉 Demo seed complete! Login credentials:');
  console.log('   Admin:   admin@demo.openstr.dev / admin123');
  console.log('   Cleaner: cleaner@demo.openstr.dev / cleaner123');

  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
