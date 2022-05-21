const req = require('express/lib/request');
const AppError = require('../utils/appError');

/***************************************************************/
/******************** GLOBAL ERROR HANDLERS ********************/
const handleCastErrorDB = (err) => {
  // handling mongoDB or mongoose related error of invalid database IDs
  // to make mongoDB or mongoose error as operational error & handling it with the help our appError class
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsErrorDB = (err) => {
  // handling mongoDB or mongoose related error while creating duplicate fields for fields that are actually supposed to be unique
  // to make mongoDB or mongoose error as operational error & handling it with the help our appError class
  const message = `Duplicate filed value: "${err.keyValue.name}". Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  // handling mongoDB or mongoose related data validation errors
  // to make mongoDB or mongoose error as operational error & handling it with the help our appError class
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please login again', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired. Please login again', 401);

const sendErrorDev = (err, req, res) => {
  // will handle all the error whether it is a 3rd party (mongoDB or mongoose etc.) error or its an error occured in our application & created with the help our appError class
  // "req.originalUrl" gives original URL without host name

  // 1. to handle API error
  if (req.originalUrl.startsWith('/api')) {
    console.error('ERROR', err);

    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: `😎 DEV ERROR HANDLING 😎 ${err.message}`,
      stack: err.stack,
    });
  }

  // 2. to handle rendered website error
  console.error('ERROR', err);
  // will render the error.pug tempalte on the website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: `😎 DEV ERROR HANDLING 😎 ${err.message}`,
  });
};

const sendErrorProd = (err, req, res) => {
  // 1. to handle API error
  if (req.originalUrl.startsWith('/api')) {
    // operational, (error occured in our application & created with the help our appError class) trusted error: send message to client
    if (err.isOperational) {
      console.error('ERROR', err);

      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // programming, 3rd party (mongoDB or mongoose etc.) or other unknown error: don't leak error details
    // 1. log error
    console.error('ERROR', err);

    // 2. send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong',
    });
  }

  // 2. to handle rendered website error
  // operational, (error occured in our application & created with the help our appError class) trusted error: send message to client
  if (err.isOperational) {
    // will render the error.pug tempalte on the website
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // programming, 3rd party (mongoDB or mongoose etc.) or other unknown error: don't leak error details
  console.error('ERROR', err);
  // will render the error.pug tempalte on the website
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later!',
  });
};

// handling all the errors of entire project
// by specifying four parameters, Express automatically knows that this entire function here is an error handling middleware & if any kind of error (our application's operational error or any 3rd party error) occurs anywhere in the project then that error will be automatically handled here
// will have access of error object from some point where error occurred in the first place
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV.trim() === 'production') {
    // creating hard copy
    let error = Object.create(err);

    if (error.name === 'CastError') {
      // handling mongoDB or mongoose related error of invalid database IDs
      error = handleCastErrorDB(error);
    }

    if (error.code === 11000) {
      // handling mongoDB or mongoose related error while creating duplicate fields for fields that are actually supposed to be unique
      error = handleDuplicateFieldsErrorDB(error);
    }

    if (error.name === 'ValidationError') {
      // handling mongoDB or mongoose related data validation errors
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      // to handle wrong JWT error. A third party's library error.
      error = handleJWTError();
    }

    if (error.name === 'TokenExpiredError') {
      // to handle expired JWT error. A third party's library error.
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, req, res);
  }
};
