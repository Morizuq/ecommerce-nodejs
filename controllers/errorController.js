const AppError = require('./../utils/appError');

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDb = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const vals = Object.values(err.errors)
    .map((el) => el.message)
    .join('. ');
  const message = `Invalid input data: ${vals}`;
  return new AppError(message, 400);
};

const handleJWTerror = () => {
  return new AppError('Invalid token, please login again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Expired token, please login again', 401);
};

//Error to send during development
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message,
  });
};

//Error to send during production
const sendErrorProd = (err, req, res) => {
  //If error is from the backend
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
  //If error is from the fronend
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: 'Please try again later!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'dev') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'prod') {
    //spredding our 'err' into an 'error' obj
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDb(error);
    if (error.code === 11000) error = handleDuplicateErrorDb(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTerror();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    //Sending error
    sendErrorProd(error, req, res);
  }
};
