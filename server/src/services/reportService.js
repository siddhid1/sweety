const prisma = require('../config/prisma');
const { toReadingDTO, isValidCalendarDate, ALLOWED_SLOTS } = require('../validators/readingValidator');

function requireValidDate(date) {
  if (!date || !isValidCalendarDate(date)) {
    const err = new Error('Invalid date format. Use YYYY-MM-DD.');
    err.statusCode = 400;
    throw err;
  }
}

function parseDateUTC(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISODate(dt) {
  return dt.toISOString().slice(0, 10);
}

function prevMonthRange(refISO) {
  const [y, m] = refISO.split('-').map(Number);
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const start = `${prev.y}-${String(prev.m).padStart(2, '0')}-01`;
  const lastDay = new Date(Date.UTC(prev.y, prev.m, 0)).getUTCDate();
  const end = `${prev.y}-${String(prev.m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

function summarize(rows) {
  if (rows.length === 0) {
    return {
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      readings: [],
      message: 'No glucose readings found for this period. Start by adding your first reading.',
    };
  }
  const values = rows.map((r) => r.value);
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const average = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  return {
    count: rows.length,
    highest,
    lowest,
    average,
    readings: rows.map(toReadingDTO),
  };
}

async function fetchRange(userId, startISO, endISO, timeSlot) {
  if (timeSlot !== undefined && !ALLOWED_SLOTS.includes(timeSlot)) {
    const err = new Error('Invalid time slot.');
    err.statusCode = 400;
    throw err;
  }
  const where = {
    userId,
    readingDate: { gte: parseDateUTC(startISO), lte: parseDateUTC(endISO) },
    ...(timeSlot ? { timeSlot } : {}),
  };
  return prisma.reading.findMany({
    where,
    orderBy: [{ readingDate: 'asc' }, { createdAt: 'asc' }],
  });
}

async function dailyReport(userId, date, timeSlot) {
  requireValidDate(date);
  const rows = await fetchRange(userId, date, date, timeSlot);
  return { date, dateRange: { start: date, end: date }, ...summarize(rows) };
}

async function monthToDateReport(userId, date, timeSlot) {
  requireValidDate(date);
  const start = `${date.slice(0, 7)}-01`;
  const rows = await fetchRange(userId, start, date, timeSlot);
  return { date, dateRange: { start, end: date }, ...summarize(rows) };
}

async function monthlyReport(userId, date, timeSlot) {
  requireValidDate(date);
  const { start, end } = prevMonthRange(date);
  const rows = await fetchRange(userId, start, end, timeSlot);
  return { date, dateRange: { start, end }, ...summarize(rows) };
}

module.exports = { dailyReport, monthToDateReport, monthlyReport, prevMonthRange, toISODate };
