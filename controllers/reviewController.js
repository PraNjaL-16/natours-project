const Review = require('../models/reviewModel');
const APIfeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

/***************************************************************/
/******************** REVIEWS ROUTE HANDLERS *******************/
// all these routes are middleware funtions

exports.setTourUserIds = (req, res, next) => {
  // will add tourId & userId if not already present in the request body
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // user object will be added on request object in protect middleware
  if (!req.body.user) req.body.user = req.user.id;

  next();
};

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

// will work only for logged-in users
exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

// DELETING a document from MongoDB using mongoose
// will work only for logged-in users
exports.deleteReview = factory.deleteOne(Review);
