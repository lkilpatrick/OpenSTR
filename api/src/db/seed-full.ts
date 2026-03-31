import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from './pool';

// ── IDs ──────────────────────────────────────────────────────────────────────
const PROP = {
  OCEAN_VIEW: '00000000-0000-0000-0000-000000000001',
  UPSTAIRS:   '00000000-0000-0000-0000-000000000002',
};
const USER = {
  ADMIN:   '00000000-0000-0000-0000-000000000099',
  DALLAS:  '00000000-0000-0000-0000-000000000088',
};
const STD = {
  AIRBNB: '00000000-0000-0000-0001-000000000001',
  HOME:   '00000000-0000-0000-0001-000000000002',
};
// Ocean View rooms
const OV_ROOM = {
  LAUNDRY:  '00000000-0000-0000-0002-000000000001',
  KITCHEN:  '00000000-0000-0000-0002-000000000002',
  BATHROOM: '00000000-0000-0000-0002-000000000003',
  BEDROOM:  '00000000-0000-0000-0002-000000000004',
  FINAL:    '00000000-0000-0000-0002-000000000005',
};
// Upstairs rooms
const UP_ROOM = {
  KITCHEN:   '00000000-0000-0000-0003-000000000001',
  LIVING:    '00000000-0000-0000-0003-000000000002',
  MASTER:    '00000000-0000-0000-0003-000000000003',
  GUEST_BED: '00000000-0000-0000-0003-000000000004',
  BATHROOM1: '00000000-0000-0000-0003-000000000005',
  BATHROOM2: '00000000-0000-0000-0003-000000000006',
  LAUNDRY:   '00000000-0000-0000-0003-000000000007',
};
// Session IDs
const SESSION = {
  S1: '00000000-0000-0000-0004-000000000001',
  S2: '00000000-0000-0000-0004-000000000002',
  S3: '00000000-0000-0000-0004-000000000003',
  S4: '00000000-0000-0000-0004-000000000004',
};
const RES = {
  R1: '00000000-0000-0000-0005-000000000001',
  R2: '00000000-0000-0000-0005-000000000002',
  R3: '00000000-0000-0000-0005-000000000003',
};

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
  console.log('🌱 Full seed starting — wiping and repopulating...');

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
  const dallasHash = await bcrypt.hash('dallas123', 12);

  await pool.query(`
    INSERT INTO users (id, email, name, role, password_hash, active) VALUES
      ($1, 'admin@openstr.dev', 'Property Owner', 'owner', $3, true),
      ($2, 'dallas@openstr.dev', 'Dallas J', 'cleaner', $4, true)
  `, [USER.ADMIN, USER.DALLAS, adminHash, dallasHash]);

  // better-auth authenticates from the account table, not users.password_hash
  await pool.query(`
    INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES
      (gen_random_uuid()::text, $1::uuid, $1::text, 'credential', $3, now(), now()),
      (gen_random_uuid()::text, $2::uuid, $2::text, 'credential', $4, now(), now())
  `, [USER.ADMIN, USER.DALLAS, adminHash, dallasHash]);
  console.log('✅ Users seeded (admin + Dallas J)');

  // ── Standards ────────────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO standards (id, name, description) VALUES
      ($1, 'Airbnb Enhanced Clean', 'Full Airbnb Enhanced Clean protocol for short-term rentals'),
      ($2, 'Home Standard', 'Standard cleaning protocol for private residences')
  `, [STD.AIRBNB, STD.HOME]);
  console.log('✅ Standards seeded');

  // ── Properties ───────────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO properties (id, name, type, address, standard_id, active) VALUES
      ($1, 'Ocean View BNB', 'short_term_rental', '123 Ocean Drive, Malibu, CA', $3, true),
      ($2, 'Upstairs', 'private_home', '456 Hilltop Lane, Malibu, CA', $4, true)
  `, [PROP.OCEAN_VIEW, PROP.UPSTAIRS, STD.AIRBNB, STD.HOME]);
  console.log('✅ Properties seeded');

  // ── Assign Dallas to both properties ─────────────────────────────────────
  await pool.query(`
    INSERT INTO property_cleaners (property_id, user_id, is_primary, is_active) VALUES
      ($1, $3, true, true),
      ($2, $3, true, true)
  `, [PROP.OCEAN_VIEW, PROP.UPSTAIRS, USER.DALLAS]);
  console.log('✅ Dallas assigned to both properties');

  // ── Rooms: Ocean View BNB ────────────────────────────────────────────────
  const ovRooms = [
    { id: OV_ROOM.LAUNDRY,  slug: 'the-tide',  displayName: 'Laundry Phase',        themeName: 'The Tide',  order: 0, isLaundry: true  },
    { id: OV_ROOM.KITCHEN,  slug: 'the-deep',  displayName: 'Kitchen & Living Room', themeName: 'The Deep',  order: 1, isLaundry: false },
    { id: OV_ROOM.BATHROOM, slug: 'the-kelp',  displayName: 'Bathroom',             themeName: 'The Kelp',  order: 2, isLaundry: false },
    { id: OV_ROOM.BEDROOM,  slug: 'the-beach', displayName: 'Bedroom',              themeName: 'The Beach', order: 3, isLaundry: false },
    { id: OV_ROOM.FINAL,    slug: 'the-shore', displayName: 'Final Cleaning',       themeName: 'The Shore', order: 4, isLaundry: false },
  ];
  for (const r of ovRooms) {
    await pool.query(`
      INSERT INTO rooms (id, property_id, slug, display_name, theme_name, display_order, is_laundry_phase)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [r.id, PROP.OCEAN_VIEW, r.slug, r.displayName, r.themeName, r.order, r.isLaundry]);
  }
  console.log('✅ Ocean View rooms seeded');

  // ── Rooms: Upstairs ──────────────────────────────────────────────────────
  const upRooms = [
    { id: UP_ROOM.KITCHEN,   slug: 'kitchen',      displayName: 'Kitchen',          themeName: 'Kitchen',       order: 0, isLaundry: false },
    { id: UP_ROOM.LIVING,    slug: 'living-room',   displayName: 'Living Room',      themeName: 'Living Room',   order: 1, isLaundry: false },
    { id: UP_ROOM.MASTER,    slug: 'master-bedroom', displayName: 'Master Bedroom',   themeName: 'Master',        order: 2, isLaundry: false },
    { id: UP_ROOM.GUEST_BED, slug: 'guest-bedroom',  displayName: 'Guest Bedroom',    themeName: 'Guest',         order: 3, isLaundry: false },
    { id: UP_ROOM.BATHROOM1, slug: 'master-bath',    displayName: 'Master Bathroom',  themeName: 'Master Bath',   order: 4, isLaundry: false },
    { id: UP_ROOM.BATHROOM2, slug: 'guest-bath',     displayName: 'Guest Bathroom',   themeName: 'Guest Bath',    order: 5, isLaundry: false },
    { id: UP_ROOM.LAUNDRY,   slug: 'laundry',        displayName: 'Laundry',          themeName: 'Laundry',       order: 6, isLaundry: true  },
  ];
  for (const r of upRooms) {
    await pool.query(`
      INSERT INTO rooms (id, property_id, slug, display_name, theme_name, display_order, is_laundry_phase)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [r.id, PROP.UPSTAIRS, r.slug, r.displayName, r.themeName, r.order, r.isLaundry]);
  }
  console.log('✅ Upstairs rooms seeded');

  // ── Tasks: Ocean View BNB ────────────────────────────────────────────────
  // Laundry Phase (The Tide)
  await insertTasks(PROP.OCEAN_VIEW, OV_ROOM.LAUNDRY, [
    { label: 'Strip all beds — collect used sheets & towels', category: 'Laundry' },
    { label: 'Sort laundry into loads (sheets, towels, darks)', category: 'Laundry' },
    { label: '1st load — sheets in washer', category: 'Laundry' },
    { label: '2nd load — towels & face cloths', category: 'Laundry' },
    { label: '3rd load — blankets (one at a time)', category: 'Laundry', frequency: 'weekly' },
    { label: 'Move wash loads to dryer as each finishes', category: 'Laundry' },
    { label: 'Take out garbage', category: 'Check', requiresSupplyCheck: true, supplyItem: 'Small white bags', supplyLowThreshold: 5 },
    { label: 'Take out recycling', category: 'Check', requiresSupplyCheck: true, supplyItem: 'Small blue bags', supplyLowThreshold: 5 },
  ]);

  // Kitchen & Living Room (The Deep)
  await insertTasks(PROP.OCEAN_VIEW, OV_ROOM.KITCHEN, [
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
    { label: 'Vacuum all upholstered furniture', category: 'Cleaning' },
    { label: 'Fluff and arrange cushions and throw pillows', category: 'Cleaning' },
    { label: 'Sanitise TV remote and Roku remote', category: 'Sanitise', isHighTouch: true },
    { label: 'Sanitise light switches (living room)', category: 'Sanitise', isHighTouch: true },
    { label: 'Wipe window sills and ledges', category: 'Cleaning' },
    { label: 'Vacuum / mop floors (kitchen + living room)', category: 'Cleaning' },
    { label: 'Empty trash can and replace liner', category: 'Cleaning', requiresSupplyCheck: true, supplyItem: 'Trash liners', supplyLowThreshold: 5 },
  ]);

  // Bathroom (The Kelp)
  await insertTasks(PROP.OCEAN_VIEW, OV_ROOM.BATHROOM, [
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
  ]);

  // Bedroom (The Beach)
  await insertTasks(PROP.OCEAN_VIEW, OV_ROOM.BEDROOM, [
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
  ]);

  // Final Cleaning (The Shore)
  await insertTasks(PROP.OCEAN_VIEW, OV_ROOM.FINAL, [
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
  ]);
  console.log('✅ Ocean View tasks seeded');

  // ── Tasks: Upstairs ──────────────────────────────────────────────────────
  await insertTasks(PROP.UPSTAIRS, UP_ROOM.KITCHEN, [
    { label: 'Wipe countertops and island', category: 'Cleaning' },
    { label: 'Clean stovetop', category: 'Cleaning' },
    { label: 'Wipe microwave inside and out', category: 'Cleaning' },
    { label: 'Clean sink and taps', category: 'Cleaning' },
    { label: 'Wipe cabinet fronts', category: 'Cleaning' },
    { label: 'Empty dishwasher', category: 'Cleaning' },
    { label: 'Sweep and mop floor', category: 'Cleaning' },
    { label: 'Empty trash and replace liner', category: 'Cleaning' },
  ]);
  await insertTasks(PROP.UPSTAIRS, UP_ROOM.LIVING, [
    { label: 'Dust all surfaces', category: 'Cleaning' },
    { label: 'Vacuum furniture', category: 'Cleaning' },
    { label: 'Fluff cushions', category: 'Cleaning' },
    { label: 'Wipe TV screen and stand', category: 'Cleaning' },
    { label: 'Vacuum / mop floor', category: 'Cleaning' },
    { label: 'Wipe window sills', category: 'Cleaning' },
  ]);
  await insertTasks(PROP.UPSTAIRS, UP_ROOM.MASTER, [
    { label: 'Change sheets', category: 'Laundry' },
    { label: 'Make bed', category: 'Laundry' },
    { label: 'Dust nightstands and dresser', category: 'Cleaning' },
    { label: 'Vacuum floor', category: 'Cleaning' },
    { label: 'Empty bedroom trash', category: 'Cleaning' },
  ]);
  await insertTasks(PROP.UPSTAIRS, UP_ROOM.GUEST_BED, [
    { label: 'Change sheets', category: 'Laundry' },
    { label: 'Make bed', category: 'Laundry' },
    { label: 'Dust surfaces', category: 'Cleaning' },
    { label: 'Vacuum floor', category: 'Cleaning' },
    { label: 'Empty trash', category: 'Cleaning' },
  ]);
  await insertTasks(PROP.UPSTAIRS, UP_ROOM.BATHROOM1, [
    { label: 'Scrub toilet', category: 'Sanitise' },
    { label: 'Clean sink and counter', category: 'Sanitise' },
    { label: 'Scrub shower/tub', category: 'Cleaning' },
    { label: 'Wipe mirror', category: 'Cleaning' },
    { label: 'Replace towels', category: 'Laundry' },
    { label: 'Mop floor', category: 'Cleaning' },
    { label: 'Restock toilet paper', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Toilet paper', supplyLowThreshold: 5 },
  ]);
  await insertTasks(PROP.UPSTAIRS, UP_ROOM.BATHROOM2, [
    { label: 'Scrub toilet', category: 'Sanitise' },
    { label: 'Clean sink and counter', category: 'Sanitise' },
    { label: 'Scrub shower', category: 'Cleaning' },
    { label: 'Wipe mirror', category: 'Cleaning' },
    { label: 'Replace towels', category: 'Laundry' },
    { label: 'Mop floor', category: 'Cleaning' },
    { label: 'Restock toilet paper', category: 'Restocking', requiresSupplyCheck: true, supplyItem: 'Toilet paper', supplyLowThreshold: 5 },
  ]);
  await insertTasks(PROP.UPSTAIRS, UP_ROOM.LAUNDRY, [
    { label: 'Wash sheets load', category: 'Laundry' },
    { label: 'Wash towels load', category: 'Laundry' },
    { label: 'Transfer to dryer', category: 'Laundry' },
    { label: 'Fold and store clean linens', category: 'Laundry' },
    { label: 'Wipe washer/dryer tops', category: 'Cleaning' },
  ]);
  console.log('✅ Upstairs tasks seeded');

  // ── Reservations (Ocean View only — it's the STR) ────────────────────────
  const today = new Date();
  const d = (offset: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  };

  await pool.query(`
    INSERT INTO reservations (id, property_id, source, external_uid, checkin_date, checkout_date, summary)
    VALUES ($1, $2, 'airbnb_ical', 'airbnb-past-001', $3, $4, 'Johnson Family')
  `, [RES.R1, PROP.OCEAN_VIEW, d(-10), d(-3)]);
  await pool.query(`
    INSERT INTO reservations (id, property_id, source, external_uid, checkin_date, checkout_date, summary)
    VALUES ($1, $2, 'airbnb_ical', 'airbnb-current-001', $3, $4, 'Sarah & Mike')
  `, [RES.R2, PROP.OCEAN_VIEW, d(-2), d(2)]);
  await pool.query(`
    INSERT INTO reservations (id, property_id, source, external_uid, checkin_date, checkout_date, summary)
    VALUES ($1, $2, 'airbnb_ical', 'airbnb-future-001', $3, $4, 'Weekend Getaway Group')
  `, [RES.R3, PROP.OCEAN_VIEW, d(5), d(8)]);
  console.log('✅ Reservations seeded');

  // ── Sessions ─────────────────────────────────────────────────────────────
  // S1: completed session (past) for Ocean View
  await pool.query(`
    INSERT INTO clean_sessions (id, property_id, cleaner_id, triggered_by, status, session_type,
      reservation_id, compliance_score, cleaner_start_time, cleaner_end_time, submitted_at, reviewed_at, reviewed_by)
    VALUES ($1, $2, $3, 'ical', 'approved', 'turnover', $4, 94.50,
      now() - interval '7 days', now() - interval '7 days' + interval '2 hours',
      now() - interval '7 days' + interval '2 hours', now() - interval '6 days', $5)
  `, [SESSION.S1, PROP.OCEAN_VIEW, USER.DALLAS, RES.R1, USER.ADMIN]);

  // S2: submitted session (awaiting review) for Ocean View
  await pool.query(`
    INSERT INTO clean_sessions (id, property_id, cleaner_id, triggered_by, status, session_type,
      reservation_id, cleaner_start_time, cleaner_end_time, submitted_at)
    VALUES ($1, $2, $3, 'lock_event', 'submitted', 'turnover', $4,
      now() - interval '1 day', now() - interval '1 day' + interval '1.5 hours',
      now() - interval '1 day' + interval '1.5 hours')
  `, [SESSION.S2, PROP.OCEAN_VIEW, USER.DALLAS, RES.R2]);

  // S3: pending session (upcoming) for Ocean View
  await pool.query(`
    INSERT INTO clean_sessions (id, property_id, triggered_by, status, session_type, reservation_id)
    VALUES ($1, $2, 'ical', 'pending', 'turnover', $3)
  `, [SESSION.S3, PROP.OCEAN_VIEW, RES.R3]);

  // S4: a completed scheduled clean for Upstairs
  await pool.query(`
    INSERT INTO clean_sessions (id, property_id, cleaner_id, triggered_by, status, session_type,
      compliance_score, cleaner_start_time, cleaner_end_time, submitted_at, reviewed_at, reviewed_by)
    VALUES ($1, $2, $3, 'manual', 'approved', 'scheduled', 91.00,
      now() - interval '3 days', now() - interval '3 days' + interval '3 hours',
      now() - interval '3 days' + interval '3 hours', now() - interval '2 days', $4)
  `, [SESSION.S4, PROP.UPSTAIRS, USER.DALLAS, USER.ADMIN]);
  console.log('✅ Sessions seeded');

  // ── Room cleans for sessions ─────────────────────────────────────────────
  // For S1 (approved) — all rooms completed
  for (const roomId of Object.values(OV_ROOM)) {
    await pool.query(`
      INSERT INTO room_cleans (session_id, room_id, status, started_at, completed_at)
      VALUES ($1, $2, 'completed', now() - interval '7 days', now() - interval '7 days' + interval '25 minutes')
    `, [SESSION.S1, roomId]);
  }
  // For S2 (submitted) — all rooms completed
  for (const roomId of Object.values(OV_ROOM)) {
    await pool.query(`
      INSERT INTO room_cleans (session_id, room_id, status, started_at, completed_at)
      VALUES ($1, $2, 'completed', now() - interval '1 day', now() - interval '1 day' + interval '20 minutes')
    `, [SESSION.S2, roomId]);
  }
  // For S3 (pending) — all rooms pending
  for (const roomId of Object.values(OV_ROOM)) {
    await pool.query(`
      INSERT INTO room_cleans (session_id, room_id, status)
      VALUES ($1, $2, 'pending')
    `, [SESSION.S3, roomId]);
  }
  // For S4 (Upstairs approved)
  for (const roomId of Object.values(UP_ROOM)) {
    await pool.query(`
      INSERT INTO room_cleans (session_id, room_id, status, started_at, completed_at)
      VALUES ($1, $2, 'completed', now() - interval '3 days', now() - interval '3 days' + interval '30 minutes')
    `, [SESSION.S4, roomId]);
  }
  console.log('✅ Room cleans seeded');

  // ── Guest rating for S1 ──────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO guest_ratings (session_id, rating, review_text)
    VALUES ($1, 5, 'Place was spotless! Amazing attention to detail.')
  `, [SESSION.S1]);
  console.log('✅ Guest ratings seeded');

  // ── Issues ───────────────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO issues (property_id, title, description, severity, status) VALUES
      ($1, 'Shower drain slow', 'The shower drain in the bathroom seems to be draining slowly. May need to be cleaned out.', 'medium', 'open'),
      ($1, 'Microwave light out', 'The interior light of the microwave is not working.', 'low', 'open'),
      ($1, 'Stain on living room carpet', 'There is a small wine stain on the carpet near the couch. Tried spot cleaning but it needs professional treatment.', 'medium', 'in_progress')
  `, [PROP.OCEAN_VIEW]);
  console.log('✅ Issues seeded');

  // ── Guest messages ───────────────────────────────────────────────────────
  await pool.query(`
    INSERT INTO guest_messages (property_id, sender_name, message, source, read) VALUES
      ($1, 'Sarah M.', 'Hi! What is the WiFi password? I can''t find it in the guide.', 'guest_page', false),
      ($1, 'Mike R.', 'Just wanted to say thank you for a wonderful stay! The view is incredible.', 'guest_page', true),
      ($1, 'Johnson Family', 'We accidentally left a phone charger behind. Could you check the bedroom nightstand?', 'airbnb', false)
  `, [PROP.OCEAN_VIEW]);
  console.log('✅ Guest messages seeded');

  console.log('\n🎉 Full seed complete! Login credentials:');
  console.log('   Admin:  admin@openstr.dev / admin123');
  console.log('   Dallas: dallas@openstr.dev / dallas123');

  await pool.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
