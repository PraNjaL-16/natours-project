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
const port = process.env.port || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

/***** ERRORS OUSIDE EXPRESS: UNHANDLED PROMISE REJECTIONS *****/
// asynchronous code errors
// handling all the unhandled promise rejections of our entire application at one central place
// each time whenever there is an unhandled rejection somewhere in our application, the global process object will emit an object called unhandledRejection and we can listen for this object using process.on() method
process.on('unhandledRejection', (err) => {
  console.log('😤 UNHANDLED REJECTIONS. Shutting down... 😤');
  // console.log(err.name, err.message);

  // closing the server & shutting down the application
  server.close(() => {
    process.exit(1);
  });
});
