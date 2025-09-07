const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Default error
  let error = {
    message: err.message || "Internal Server Error",
    status: err.status || 500,
  };

  // Database connection errors
  if (err.code === "ECONNREFUSED") {
    error.message = "Database connection failed";
    error.status = 503;
  }

  // MySQL specific errors
  if (err.code === "ER_NO_SUCH_TABLE") {
    error.message = "Database table not found";
    error.status = 500;
  }

  if (err.code === "ER_DUP_ENTRY") {
    error.message = "Duplicate entry not allowed";
    error.status = 409;
  }

  if (err.code === "ER_NO_REFERENCED_ROW_2") {
    error.message = "Referenced record does not exist";
    error.status = 400;
  }

  // Validation errors
  if (err.name === "ValidationError") {
    error.message = "Validation failed";
    error.status = 400;
  }

  // Send error response
  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
