export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with more details
  console.error('Error:', {
    message: err.message,
    code: err.code,
    name: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // PostgreSQL errors
  if (err.code === '42P01') { // Table does not exist
    const message = 'Database table does not exist. Please restart the server to initialize tables.';
    error = { message, statusCode: 503 };
  } else if (err.code === 'ECONNREFUSED') {
    const message = 'Database connection failed. Please check your database configuration.';
    error = { message, statusCode: 503 };
  } else if (err.code === '23505') { // Unique violation
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  } else if (err.code === '23503') { // Foreign key violation
    const message = 'Referenced record does not exist';
    error = { message, statusCode: 400 };
  }

  // Mongoose bad ObjectId (for compatibility)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key (for compatibility)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error (for compatibility)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      code: err.code,
      name: err.name
    })
  });
};

