const reportService = require('../services/reportService');

async function daily(req, res) {
  const data = await reportService.dailyReport(req.user.id, req.query.date, req.query.timeSlot);
  res.json({ success: true, data });
}

async function monthToDate(req, res) {
  const data = await reportService.monthToDateReport(req.user.id, req.query.date, req.query.timeSlot);
  res.json({ success: true, data });
}

async function monthly(req, res) {
  const data = await reportService.monthlyReport(req.user.id, req.query.date, req.query.timeSlot);
  res.json({ success: true, data });
}

module.exports = { daily, monthToDate, monthly };
