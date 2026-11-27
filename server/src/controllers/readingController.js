const readingService = require('../services/readingService');

async function create(req, res) {
  const { readingDate, timeSlot, value } = req.body;
  const data = await readingService.createReading(req.user.id, { readingDate, timeSlot, value });
  res.status(201).json({ success: true, data });
}

async function list(req, res) {
  const { page, limit } = req.query;
  const result = await readingService.listReadings(req.user.id, { page, limit });
  res.json({ success: true, ...result });
}

async function getOne(req, res) {
  const data = await readingService.getReading(req.user.id, req.params.id);
  res.json({ success: true, data });
}

async function update(req, res) {
  const { readingDate, timeSlot, value } = req.body;
  const data = await readingService.updateReading(req.user.id, req.params.id, {
    readingDate,
    timeSlot,
    value,
  });
  res.json({ success: true, data });
}

async function remove(req, res) {
  await readingService.deleteReading(req.user.id, req.params.id);
  res.json({ success: true, message: 'Reading deleted.' });
}

module.exports = { create, list, getOne, update, remove };
