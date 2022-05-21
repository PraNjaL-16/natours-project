/********************************************************************************/
/***** this script file completely non-related with our express application *****/

const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('../../models/tourmodel');
const User = require('../../models/usermodel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
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

// READ JSON FILE & CONVERTING IT TO A JS OBJECT
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'));
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// IMORT DATA INTO A COLLECTION IN DB
// creating a scirpt to upload data from "tours-simple.json" file to Tours collection in our database
// this script is completely non-related with our express application
const importData = async () => {
  try {
    // can pass an single object or an array of objects to create() method & then each object will simply create a new document in the Tour collection
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully uploaded');
  } catch (err) {
    // console.log(err.message);
  }

  // stoping the application
  process.exit();
};

// DELETE ALL DATA FROM COLLECION
// creating a script to delete all the documents from a collection in a DB
// this script is completely non-related with our express application
const deleteData = async () => {
  try {
    // deleteMany() will delete all the collection from Tours collection
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    // console.log(err.message);
  }

  // stoping the application
  process.exit();
};

// console.log(process);

// can run these commands from cmd & according to process.arg[2] value on of the if condition results to true
// 1. node dev-data/data/import-dev-data.js --import
// 2. node dev-data/data/import-dev-data.js --delete
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
