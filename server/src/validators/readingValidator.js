const ALLOWED_SLOTS = ['MORNING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

const SLOT_LABELS = {
  MORNING: 'Morning',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

const SLOT_ORDER = {
  MORNING: 0,
  AFTER_BREAKFAST: 1,
  AFTER_LUNCH: 2,
  AFTER_DINNER: 3,
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isValidCalendarDate(str) {
  if (!DATE_RE.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  );
}

function slotLabel(slot) {
  return SLOT_LABELS[slot] || slot;
}

// Returns { readingDate, timeSlot, value } or throws HttpError-like Error.
function validateReadingInput({ readingDate, timeSlot, value }) {
  // Rule: date format
  if (!readingDate || typeof readingDate !== 'string' || !isValidCalendarDate(readingDate)) {
    const err = new Error('Invalid date format. Use YYYY-MM-DD.');
    err.statusCode = 400;
    throw err;
  }
  // Rule 5: future date
  if (readingDate > todayLocalISO()) {
    const err = new Error('Date cannot be in the future.');
    err.statusCode = 400;
    throw err;
  }
  if (!ALLOWED_SLOTS.includes(timeSlot)) {
    const err = new Error('Invalid time slot.');
    err.statusCode = 400;
    throw err;
  }
  // Rule 1: value required
  if (value === undefined || value === null || value === '') {
    const err = new Error('Please enter a glucose value.');
    err.statusCode = 400;
    throw err;
  }
  // Rule 2: whole number 40-600
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(num) || num < 40 || num > 600) {
    const err = new Error('Value must be between 40 and 600 mg/dl.');
    err.statusCode = 400;
    throw err;
  }
  return { readingDate, timeSlot, value: num };
}

function toReadingDTO(r) {
  const iso = r.readingDate instanceof Date
    ? r.readingDate.toISOString().slice(0, 10)
    : String(r.readingDate).slice(0, 10);
  return {
    id: r.id,
    userId: r.userId,
    readingDate: iso,
    timeSlot: r.timeSlot,
    timeSlotLabel: slotLabel(r.timeSlot),
    value: r.value,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

module.exports = {
  ALLOWED_SLOTS,
  SLOT_LABELS,
  SLOT_ORDER,
  todayLocalISO,
  isValidCalendarDate,
  slotLabel,
  validateReadingInput,
  toReadingDTO,
};
