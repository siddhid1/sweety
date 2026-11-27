const { execSync } = require('child_process');
const prisma = require('../src/config/prisma');

// Apply migrations to the test database once before all suites.
beforeAll(async () => {
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
    stdio: 'ignore',
  });
});

beforeEach(async () => {
  await prisma.reading.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

module.exports = { prisma };
