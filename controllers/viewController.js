const Tour = require('../models/tourmodel');
const User = require('../models/usermodel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/***************************************************************/
/********************** VIEW ROUTE HANDLERS ********************/
// all these routes are middleware funtions

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. get tour data from collection
  // will return an array of the tours
  const tours = await Tour.find();

  // 2. build the template
  // overview template is created in overview.pug with data that we have sent in the response object

  // 3. render that template using tours data from step 1
  // to send back the response object with some additional data that will be availbale in PUG template
  res.status(200).render('overview', {
    // these data variables will be available in PUG template
    title: 'All tours',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1. get data for the requested tour (including tour guides & reviews)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  // 2. build the template
  // tour template is created in tour.pug with data that we have sent in the response object

  // 3. render that template using tour data from step 1
  // to send back the response object with some additional data that will be availbale in PUG template
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getloginForm = (req, res) => {
  // 1. build the template
  // login template is created in login.pug

  // 2. render that template
  // to send back the response object with some additional data that will be availbale in PUG template
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

exports.getAccount = (req, res) => {
  // 1. build the template
  // account template is created in account.pug

  // 2. render that template
  // to send back the response object with some additional data that will be availbale in PUG template
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1. find all bookings
  // user object is added to request object in protect middleware
  const bookings = await Booking.find({ user: req.user.id });

  // 2. find tour with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

/* 
// instead of directly sending form data to an endpoint, we are using API to update user data
// to handle data coming from the form
exports.updateUserData = catchAsync(async (req, res, next) => {
  // form data
  // console.log(req.body);

  // user object is added to request object in protect middleware
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true, // to get new/updated user document
      runValidators: true,
    }
  );

  // to render account page again with updated user infromation
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
}); 
*/
