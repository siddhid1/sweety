const prisma = require('../config/prisma');
const {
  validateReadingInput,
  toReadingDTO,
  slotLabel,
  SLOT_ORDER,
} = require('../validators/readingValidator');

function toDateOnly(iso) {
  // Store as DATE without timezone shift
  return new Date(`${iso}T00:00:00.000Z`);
}

function duplicateSlotError(timeSlot) {
  const err = new Error(`You already have an ${slotLabel(timeSlot)} reading for this date.`);
  err.statusCode = 409;
  return err;
}

async function createReading(userId, input) {
  const { readingDate, timeSlot, value } = validateReadingInput(input);

  const existingSlot = await prisma.reading.findUnique({
    where: {
      uq_user_date_slot: {
        userId,
        readingDate: toDateOnly(readingDate),
        timeSlot,
      },
    },
  });
  if (existingSlot) throw duplicateSlotError(timeSlot);

  const count = await prisma.reading.count({
    where: { userId, readingDate: toDateOnly(readingDate) },
  });
  if (count >= 4) {
    const err = new Error('You can add only 4 readings per day.');
    err.statusCode = 400;
    throw err;
  }

  try {
    const created = await prisma.reading.create({
      data: { userId, readingDate: toDateOnly(readingDate), timeSlot, value },
    });
    return toReadingDTO(created);
  } catch (e) {
    if (e.code === 'P2002') throw duplicateSlotError(timeSlot);
    throw e;
  }
}

async function listReadings(userId, { page, limit } = {}) {
  const hasPagination = page !== undefined || limit !== undefined;
  const orderBy = [{ readingDate: 'desc' }, { createdAt: 'desc' }];
  if (!hasPagination) {
    const rows = await prisma.reading.findMany({ where: { userId }, orderBy });
    const sorted = rows.map(toReadingDTO).sort((a, b) => {
      if (a.readingDate !== b.readingDate) return b.readingDate.localeCompare(a.readingDate);
      return SLOT_ORDER[a.timeSlot] - SLOT_ORDER[b.timeSlot];
    });
    return { data: sorted };
  }
  const p = Math.max(1, parseInt(page || '1', 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
  const [total, rows] = await Promise.all([
    prisma.reading.count({ where: { userId } }),
    prisma.reading.findMany({
      where: { userId },
      orderBy,
      skip: (p - 1) * l,
      take: l,
    }),
  ]);
  return {
    data: rows.map(toReadingDTO),
    pagination: { page: p, limit: l, total, totalPages: Math.ceil(total / l) },
  };
}

async function getReading(userId, id) {
  const row = await prisma.reading.findFirst({ where: { id, userId } });
  if (!row) {
    const err = new Error('Reading not found.');
    err.statusCode = 404;
    throw err;
  }
  return toReadingDTO(row);
}

async function updateReading(userId, id, input) {
  const { readingDate, timeSlot, value } = validateReadingInput(input);
  const existing = await prisma.reading.findFirst({ where: { id, userId } });
  if (!existing) {
    const err = new Error('Reading not found.');
    err.statusCode = 404;
    throw err;
  }

  const clash = await prisma.reading.findUnique({
    where: {
      uq_user_date_slot: { userId, readingDate: toDateOnly(readingDate), timeSlot },
    },
  });
  if (clash && clash.id !== id) throw duplicateSlotError(timeSlot);

  // If moving to a different date, enforce 4/day on target date
  const sameDay =
    existing.readingDate.toISOString().slice(0, 10) === readingDate;
  if (!sameDay) {
    const count = await prisma.reading.count({
      where: { userId, readingDate: toDateOnly(readingDate) },
    });
    if (count >= 4) {
      const err = new Error('You can add only 4 readings per day.');
      err.statusCode = 400;
      throw err;
    }
  }

  try {
    const updated = await prisma.reading.update({
      where: { id },
      data: { readingDate: toDateOnly(readingDate), timeSlot, value },
    });
    return toReadingDTO(updated);
  } catch (e) {
    if (e.code === 'P2002') throw duplicateSlotError(timeSlot);
    throw e;
  }
}

async function deleteReading(userId, id) {
  const existing = await prisma.reading.findFirst({ where: { id, userId } });
  if (!existing) {
    const err = new Error('Reading not found.');
    err.statusCode = 404;
    throw err;
  }
  await prisma.reading.delete({ where: { id } });
  return { id };
}

module.exports = { createReading, listReadings, getReading, updateReading, deleteReading };
