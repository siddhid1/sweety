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

async function main() {
  const hashed = await bcrypt.hash(DEMO.password, 10);
  const user = await prisma.user.upsert({
    where: { email: DEMO.email },
    update: { name: DEMO.name, password: hashed },
    create: { name: DEMO.name, email: DEMO.email, password: hashed },
  });

  for (const r of SAMPLE_READINGS) {
    await prisma.reading.upsert({
      where: {
        uq_user_date_slot: {
          userId: user.id,
          readingDate: new Date(`${r.date}T00:00:00.000Z`),
          timeSlot: r.slot,
        },
      },
      update: { value: r.value },
      create: {
        userId: user.id,
        readingDate: new Date(`${r.date}T00:00:00.000Z`),
        timeSlot: r.slot,
        value: r.value,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user ${DEMO.email} with ${SAMPLE_READINGS.length} readings.`);
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
