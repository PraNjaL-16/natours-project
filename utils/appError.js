// manually creating the error with the help of "Error" class
// inhariting from built-in "Error" class
class AppError extends Error {
  // constructor will automatically return the entire object of AppError class to support method chaining
  constructor(message, statusCode) {
    // calling parent class's (i.e Error class) constructor
    // setting err.message property to our incoming message using parent class constructor
    super(message);

    // adding fields to current object
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // stack trace for the error
    Error.captureStackTrace(this, this.constructor);
  }
}

/****************** EXPORTING THE FUNCTION ******************/
module.exports = AppError;
