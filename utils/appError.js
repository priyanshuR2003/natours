class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith("4") ? "fail" : "err";

    this.isOperational = true;

    //capturing stackTrace:
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
