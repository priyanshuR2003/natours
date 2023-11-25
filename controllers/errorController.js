const AppError = require("./../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid path : value`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  // console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (error) => {
  return new AppError("Invalid token. Please login again!", 401);
};

const handleJWTExpiredError = (error) => {
  return new AppError("Your token has expired, please login again", 401);
};

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    //1)send error as JSON:
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    //2)render error:
    console.error("Error ", err);

    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    //1)send error as JSON:

    //a)operational, trusted error: (send message to client)
    if (err.isOperational) {
      return res.status(err.statusCode).render("error", {
        title: "Something went wrong",
        msg: err.message,
      });
      //b)programming or other unknown error: (don't leak error details)
    } else {
      //1)log error : (for us)
      console.error("Error ", err);

      //2)send generic message: (for client)
      return res.status(500).json({
        status: "error",
        message: "Something went very wrong!",
      });
    }
  } else {
    //2)render error:

    //a)operational, trusted error: (send message to client)
    if (err.isOperational) {
      console.log(err);
      return res.status(err.statusCode).render("error", {
        title: "Something went wrong!",
        msg: err.message,
      });
    }

    //b)programming or other unknown error: (don't leak error details)
    // 1) Log error
    console.error("ERROR 💥", err);
    // 2) Send generic message
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: "Please try again later.",
    });
  }
};

module.exports = (err, req, res, next) => {
  //stack trace:
  //console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err }; //avoiding overriding of err

    error.message = err.message; //fix

    //1)cast error: (GET)
    // if (error.statusCode === 500) {
    //   error = handleCastErrorDB(error);
    // }

    //2)duplicate name: (POST)
    // if (error.code === 11000) {
    //   error = handleDuplicateFieldsDB(error);
    // }

    //3)validation error: (PATCH)
    // if (error.name === "ValidationError") {
    //   error = handleValidationErrorDB(error);
    // }

    // 4)JsonWebTokenError:
    if (error.name === "JsonWebTokenError") {
      error = handleJWTError(error);
    }

    //5)TokenExpiredError:
    if (error.name === "TokenExpiredError") {
      error = handleJWTExpiredError(error);
    }

    sendErrorProd(error, req, res);
  }
};
