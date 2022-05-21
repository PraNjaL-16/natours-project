/**************************************************************/
/*********************** MAIN APPLICATION *********************/
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// importing our router
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const exp = require('constants');

const app = express();

/**************************************************************/
/********** GLOBAL MIDDLEWARES FOR THIS APPLICATION ***********/
// all middleware functions are executed in order as they are in the code or middleware is added to the middleware stack in the order in which it is defined in the code

/************* SETTING UP TEMPLATE ENGINE: PUG  ****************/
// to tell express that we are using PUG template engine (also called view engine)
app.set('view engine', 'pug');
// to define where the views are actually located in our file system
app.set('views', path.join(__dirname, 'views'));

/******************** to serve static files ********************/
app.use(express.static(path.join(__dirname, 'public')));

/*************** SETTING SECURITY HTTP HEADERS *****************/
// seting security http headers
// using helmet npm package, helmet() will return a middleware function
app.use(helmet());

// can see newly added headers from the headers section in postman

/***************** IMPLEMENTING RATE LIMITING ******************/
// limits requestes from same API
// rateLimit() will return a middleware function. So, "limiter" will be a middleware function
const limiter = rateLimit({
  max: 100, // 100 request from a same IP per hour
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!', // error message if rate limit exceeds
});

// can see request made, request remaining etc. data for a particualr IP in headers section in postman
// after refresh or restart of application the number of request made from a paritcular IP will become zero

// middleware function for "/api" route
app.use('/api', limiter);

/********* LIMITING AMOUNT OF DATA COMING IN THE BODY *********/
// BODY PARSER
// to parse data from body of a incoming request (reading data from body into request.body)
// "express.json()" middleware to handle POST requests with Express & to get access of requests's body object
// if there will be data of more than 10kb inside the body, then that will not be accepted
app.use(
  express.json({
    limit: '10kb',
  })
);

/************************* FORM PARSER ************************/
// to parse data coming from a url encoded form
app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
);

/************************ COOKIE PARSER ***********************/
// to parse data from cookies of a incoming request
app.use(cookieParser());

/********************* DATA SANITIZATION **********************/
// to prevent aganist NoSQL query injection attactks
// mongoSanitize() will return a middleware function
app.use(mongoSanitize());

// to clean any user input from malicious HTML code
// mongoSanitize() will return a middleware function
app.use(xss());

/*************** PREVENTING PARAMETER POLLUTION ***************/
// hpp() will return a middleware function
app.use(
  hpp({
    // only these parameter's duplicate will be allowed in the query string
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

/******************** DEVELOPMENT LOGGING *********************/
if (process.env.NODE_ENV === 'development') {
  // to see all the request's data in the console
  app.use(morgan('dev'));
}

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  // getting all the headers of a request
  // console.log(req.headers);

  // getting all the parameters of a request
  // console.log('request parameters', req.params);

  // getting all the query of a request
  // console.log('request string', req.query);

  // getting all the cookies of a request
  // console.log(req.cookies);

  next();
});

/******************** MOUNTING THE ROUTERS *********************/
// PUG routes
// these are also middlewares mounted over a specific path & they are also a part of middleware stack
app.use('/', viewRouter);

// API routes
// these are also middlewares mounted over a specific path & they are also a part of middleware stack
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

/************** HANDLING ALL THE UN-DEFINED ROUTES **************/
// this should be always defined at the end of all other routes. So, that control will only reach here after matching current request object with all the previously defined routes. If any of the previous routes matches with current request object then control will not reach here & if any of the previous routes dones not matches with current request object then control will reach here & response will be sent to the client
// all('*') will run for all the HTTP methods like get(), post(), patch() etc.
// its also a middleware
app.all('*', (req, res, next) => {
  // if the next function receives an argument, then Express will automatically know that there was an error
  // manually creating an error with the help of next() function & directly sending it to our global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

/*************** GLOBAL ERROR HANDLING MIDDLEWARE ***************/
// handling all the errors (operational error) of entire project
// if any kind of error occurs anywhere in the project then that error will be automatically handled here
app.use(globalErrorHandler);

/*************** EXPORTING EXPRESS'S APP OBJECT ****************/
module.exports = app;
