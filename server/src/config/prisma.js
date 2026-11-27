require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const url =
  process.env.NODE_ENV === 'test' && process.env.DATABASE_URL_TEST
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL;

const prisma = new PrismaClient({
  datasources: url ? { db: { url } } : undefined,
});

module.exports = prisma;
