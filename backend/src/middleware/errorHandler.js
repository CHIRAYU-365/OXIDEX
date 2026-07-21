const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Resource not found - ${req.originalUrl}`,
  });
};

const errorHandler = (err, req, res, next) => {
  console.error("[API ERROR]", err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
};
