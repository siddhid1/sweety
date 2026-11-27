// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  // Prisma unique-constraint violation (e.g. duplicate slot per day)
  if (err && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate reading for this date and time slot.',
    });
  }

  const status = err.statusCode || err.status || 500;
  const message =
    status >= 500 ? 'Something went wrong. Please try again.' : err.message || 'Request failed.';
  res.status(status).json({ success: false, message });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

module.exports = { errorHandler, notFound };
