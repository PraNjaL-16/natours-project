// server.js is a king of setup file
const mongoose = require('mongoose');
const dotenv = require('dotenv');

/**************** CATCHING UNCAUGHT EXCEPTIONS *****************/
// synchronous code error
// catching all the uncaught exceptions of our entire application at one central place
// each time whenever there is a uncaught excetion somewhere in our application, the global process object will emit an object called uncaughtExceptions and we can listen for this object using process.on() method
process.on('uncaughtExceptions', (err) => {
  console.log('😤 UNCAUGHT EXCEPTIONS. Shutting down... 😤');
  // console.log(err.name, err.message);

  // shutting down the application
  process.exit(1);
});

/******************* ENVIRONMENT VARIABLES ********************/
// connecting our node application to config.env file to access environment varaibles
dotenv.config({ path: './config.env' });

const app = require('./app');

/******************** CONNECTING TO mongoDB ********************/
// connecting to mongoDB database using mongoose library

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// connect method will return a promise & this promise will have access of a connection object
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('😀 DB CONNECTION SUCCESSFUL 😀');
  });

/******************** STARTING THE SERVER *********************/
// uisng envrionment variable that are defined in config.env file
// important for heroku deployment as heroku will automatically set process.env.port variable
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

/***** ERRORS OUSIDE EXPRESS: UNHANDLED PROMISE REJECTIONS *****/
// asynchronous code errors
// handling all the unhandled promise rejections of our entire application at one central place
// each time whenever there is an unhandled rejection somewhere in our application, the global process object will emit an object called unhandledRejection and we can listen for this object using process.on() method
process.on('unhandledRejection', (err) => {
  console.log('😤 UNHANDLED REJECTIONS. Shutting down gracefully 😤');
  // console.log(err.name, err.message);

  // closing the server but before that still handle all of the pending requests
  server.close(() => {
    // shutting down the application
    process.exit(1);
  });
});

/*************** HANDLING HEROKUs SIGTERM SIGNAL ***************/
// we need to implement this listening to SIGTERM event here, because Heroku every 24 hours will shut down our application by sending this signal, or this event, to our application. And so then, we shut down the process gracefully, by using server dot close, which allows all the pending requests to still process until the end
// can listen to SIGTERM signal emitted by heroku using process.on() method
process.on('SIGTERM', () => {
  console.log('😤 SIGTERM RECEIVED. Shutting dowm gracefully 😤');

  // closing the server but before that still handle all of the pending requests & then shutting down the application
  server.close(() => {
    console.log('Process terminated');

    // we don't have to use process dot exit to shut-down the application, because the SIGTERM itself will cause the application to shut-down. We do not need to do it manually
    // process.exit(1);
  });
});
