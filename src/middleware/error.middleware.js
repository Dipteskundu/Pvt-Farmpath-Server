const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err.stack);

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error.message = "Resource not found";
    return res.status(404).json({ message: error.message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = "Duplicate field value entered";
    return res.status(400).json({ message: error.message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    error.message = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message: error.message });
  }

  res.status(error.statusCode || 500).json({
    message: error.message || "Server Error",
  });
};

module.exports = errorHandler;
