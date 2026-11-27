const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

const DEMO = {
  name: 'Demo User',
  email: 'demo@example.com',
  password: 'Demo@12345',
};

const SAMPLE_READINGS = [
  // Recent dates across slots so reports look meaningful
  { date: '2026-11-20', slot: 'MORNING', value: 98 },
  { date: '2026-11-20', slot: 'AFTER_BREAKFAST', value: 142 },
  { date: '2026-11-20', slot: 'AFTER_LUNCH', value: 135 },
  { date: '2026-11-21', slot: 'MORNING', value: 105 },
  { date: '2026-11-21', slot: 'AFTER_DINNER', value: 168 },
  { date: '2026-11-22', slot: 'MORNING', value: 92 },
  { date: '2026-11-22', slot: 'AFTER_BREAKFAST', value: 138 },
  { date: '2026-11-22', slot: 'AFTER_LUNCH', value: 151 },
  { date: '2026-11-22', slot: 'AFTER_DINNER', value: 160 },
  { date: '2026-10-05', slot: 'MORNING', value: 110 },
  { date: '2026-10-15', slot: 'AFTER_LUNCH', value: 145 },
  { date: '2026-09-10', slot: 'MORNING', value: 99 },
  { date: '2026-09-12', slot: 'AFTER_DINNER', value: 172 },
];

// Extra demo users, each getting a dense multi-week history.
// Deterministic PRNG (mulberry32) keeps the seed repeatable.
const EXTRA_USERS = [
  { name: 'Anaya Sharma', email: 'anaya@example.com', password: 'Demo@12345', seed: 11, days: 45, base: 96 },
  { name: 'Rahul Verma', email: 'rahul@example.com', password: 'Demo@12345', seed: 22, days: 45, base: 118 },
  { name: 'Priya Nair', email: 'priya@example.com', password: 'Demo@12345', seed: 33, days: 45, base: 104 },
  { name: 'Arjun Mehta', email: 'arjun@example.com', password: 'Demo@12345', seed: 44, days: 30, base: 132 },
  { name: 'Kavya Rao', email: 'kavya@example.com', password: 'Demo@12345', seed: 55, days: 30, base: 88 },
];

const SLOTS = ['MORNING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

// Typical lift per slot over the user's fasting baseline.
const SLOT_LIFT = {
  MORNING: 0,
  AFTER_BREAKFAST: 38,
  AFTER_LUNCH: 32,
  AFTER_DINNER: 45,
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function clampInt(v) {
  return Math.min(600, Math.max(40, Math.round(v)));
}

async function upsertReading(userId, dateISO, slot, value) {
  await prisma.reading.upsert({
    where: {
      uq_user_date_slot: {
        userId,
        readingDate: new Date(`${dateISO}T00:00:00.000Z`),
        timeSlot: slot,
      },
    },
    update: { value },
    create: {
      userId,
      readingDate: new Date(`${dateISO}T00:00:00.000Z`),
      timeSlot: slot,
      value,
    },
  });
}

async function seedExtraUser({ name, email, password, seed, days, base }) {
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashed },
    create: { name, email, password: hashed },
  });

  const rand = mulberry32(seed);
  const today = new Date();
  let count = 0;

  for (let back = 0; back < days; back += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const iso = toISODate(d);

    // 2–4 slots per day, shuffled deterministically
    const shuffled = [...SLOTS].sort(() => rand() - 0.5);
    const slotsToday = shuffled.slice(0, 2 + Math.floor(rand() * 3));

    for (const slot of slotsToday) {
      // Small day-to-day drift + noise so trends/charts look realistic
      const drift = Math.sin((back + seed) / 6) * 8;
      const noise = (rand() - 0.5) * 22;
      const value = clampInt(base + SLOT_LIFT[slot] + drift + noise);
      await upsertReading(user.id, iso, slot, value);
      count += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${email} with ${count} readings.`);
}

async function main() {
  const hashed = await bcrypt.hash(DEMO.password, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: { name: DEMO.name, password: hashed },
    create: { name: DEMO.name, email: DEMO.email, password: hashed },
  });

  for (const r of SAMPLE_READINGS) {
    await upsertReading(user.id, r.date, r.slot, r.value);
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user ${DEMO.email} with ${SAMPLE_READINGS.length} readings.`);

  for (const u of EXTRA_USERS) {
    await seedExtraUser(u);
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
