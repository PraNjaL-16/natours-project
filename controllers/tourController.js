const sharp = require('sharp');
const Tour = require('./../models/tourmodel');
const upload = require('../utils/imageUpload');
const APIfeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

/***************************************************************/
/********************* TOURS ROUTE HANDLERS ********************/
// all these routes are middleware funtions

// to upload a multipe image
// "imageCover" & "images" are the image field name in the form from where we are uploading the image
// this middleware will take the images from the form fields and copy it to the destination that we specified with multer & also put some infromation about the uploaded images on "request.files" object
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // to view uploaded image's details
  // console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // when we have to do image processing (e.g. image re-sizing) right after uploading a file, then it's always best to not even save the file to the disk/file-system directly, but instead save it to memory (i.e as buffer)

  // 1. processing cover images
  // to update curently uploading image's name in the DB
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`); // finally, saving image to disk/file-system

  // 2. processing other images
  req.body.images = [];

  // map() will return a array of Promises. So, to await all the promises at the same time we have used Promis.all() method
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`); // finally, saving image to disk/file-system

      // to update curently uploading image's name in the DB
      req.body.images.push(filename);
    })
  );

  next();
});

// ALIASING using middleware function
exports.aliasTopTours = async (req, res, next) => {
  // pre-filling the request query string
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';

  next();
};

// READING ALL the documents from MongoDB using mongoose
// will work only for logged-in users
exports.getAllTours = factory.getAll(Tour);

// READING a document from MongoDB using mongoose
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// CREATING a new document in MongoDB using mongoose
exports.createTour = factory.createOne(Tour);

// UPDATING a document on MongoDB using mongoose
exports.updateTour = factory.updateOne(Tour);

// DELETING a document from MongoDB using mongoose
// will work only for logged-in users
exports.deleteTour = factory.deleteOne(Tour);

// MONGODB AGGRIGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
  // aggregate() functions are called on the model/schema itself
  // aggregate() recieve array of all the stages though which data will be passed & these stages can be repeated
  // as we go through a stages of aggregation pipeline data gets modified (i.e new fileds are added) & these new added fields can be used along with previous fields in next stages
  // document's filed name should be pre-fixed with dollar sign when we specify it as a string in any stage of the aggregation pipeline

  // will return an query object. So, we have to await it to get the results.
  const stats = await Tour.aggregate([
    {
      // match is like a filter
      // will give all the doucumnets having ratingsAverate gte 4.5
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // group by 'difficulty' field
        numTours: { $sum: 1 }, // adding one to numTours for each document, will give total number of documents present in the collection
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // sorting based on avgPrice in ascending order
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: stats,
  });
});

// MONGODB AGGRIGATION PIPELINE
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  // trick to convert to number
  const year = +req.params.year;

  // will return an query object. So, we have to await it to get the results.
  const plan = await Tour.aggregate([
    {
      // creates a new document for each date present in startDates array
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: {
          // month is mongoDB operator to extract month from a date
          $month: '$startDates',
        },
        numToursStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0, // hides _id field from result
      },
    },
    {
      // sorting based on numToursStarts in dscending order
      $sort: { numToursStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'sucess',
    data: plan,
  });
});

// for geospatial queries
exports.getToursWithIn = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(new AppError('Please provide latitute & langitude in correct format', 404));
  }

  // radius = distance/radius of the earth
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // console.log(distance, lat, lng, unit);
  const tours = await Tour.find({
    // to find documents that are located within a certain distance of a starting point
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// for geospatial queries
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    next(new AppError('Please provide latitute & langitude in correct format', 404));
  }

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // aggregate() functions are called on the model/schema
  // if there is a geospatial stage in a aggregation pipeline then it must be the first stage of the pipeline
  // using geospatial aggregation in order to calculate distances to all the tours from a starting point
  const distances = await Tour.aggregate([
    {
      // geospatial stage
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat], // trick to convert lng & lat to number
        },
        // to specify name of the field that will be created and where all the calculated distances will be stored
        distanceField: 'distance',
        distanceMultiplier: multiplier, // this number will be multiplied with each distance
      },
    },
    {
      $project: {
        distance: 1, // persisting only name & distance field in the restults
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});
