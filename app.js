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
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

// importing our router
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');

/******************** START EXPRESS APP ***********************/
const app = express();

/*********************** TRUST PROXY **************************/
// make our application trust proxy's. So, again, request.secure doesn't work in the first place because Heroku acts as a proxy, which kind of redirects and modifies incoming requests
// to set "x-forwarded-proto" header. So, we can later use it in autController
app.enable('trust proxy');

/************* SETTING UP TEMPLATE ENGINE: PUG  ****************/
// to tell express that we are using PUG template engine (also called view engine)
app.set('view engine', 'pug');
// to define where the views are actually located in our file system
app.set('views', path.join(__dirname, 'views'));

/**************************************************************/
/********** GLOBAL MIDDLEWARES FOR THIS APPLICATION ***********/
// all middleware functions are executed in order as they are in the code or middleware is added to the middleware stack in the order in which it is defined in the code

/******************** TO SERVE STATIC FILES ********************/
app.use(express.static(path.join(__dirname, 'public')));

/*************** SETTING SECURITY HTTP HEADERS *****************/
// seting security http headers
// can see newly added headers from the headers section in postman
// using helmet npm package, helmet() will return a middleware function
app.use(helmet());

/********************** IMPLEMENTING CORS **********************/
// STEP 1: will only work simple requests
// "cors()" will return a middleware function which is then gonna add a couple of different headers to our response
// enabling CORS for all incoming requests i.e for our entire APIs, can also implement CORS for specific route
app.use(cors());

/* 
// enabling CORS for a specific domain
app.use(
  cors({
    origin: 'https://www.example.com/',
  })
); */

// STEP 2: for non-simple requests
// this is very similar to doing get(), post(), delete(), patch() and all these requests So options() is not to set any options on our application, it's really just another HTTP method that we can respond to
// And so again, in this case we need to respond to it because the browser sends an option request when there is a preflight phase
// options('route', handler)
app.options('*', cors());
// app.options('/api/v1/tours/:id', cors());

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

/************** TO HANDLE STRIPE'S POST REQUEST ***************/
// Stripe will then automatically post the original session data to this URL to whenever a checkout session has successfully completed
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }), // to parse the body in a so-called raw format
  bookingController.webhookCheckout
);

/********* LIMITING AMOUNT OF DATA COMING IN THE BODY *********/
// BODY PARSER
// to parse data from body of a incoming request to JSON object (reading data from body into request.body)
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

/****************** COMPRESSION MIDDLEWARE ********************/
// will compress all the text that is sent to clients
app.use(compression());

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

/* 
// enabling CORS only for a specific route
app.use('/api/v1/bookings', bookingRouter); */

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
