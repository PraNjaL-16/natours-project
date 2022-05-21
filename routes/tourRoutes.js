/**************************************************************/
/*********************** SUB APPLICATION **********************/
const express = require('express');
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router();

/********************* PARAMS MIDDLEWARES *********************/
// param middleware is middleware that only runs for certain parameters, so basically, when we have a certain parameter in our URL

/******************** MOUNTING THE ROUTERS ********************/
// redirectiong to reviewRouter
// "router" itself is really just a middleware. And so we can use the use() method on it, and mount it over some another route for a specific path
// to specify that tour router should use review router in case it encounters a route like '/:tourId/reviews'
// redirecting control to reviwRouter for paths like '/:tourId/reviews'
router.use('/:tourId/reviews', reviewRouter);

/*************************** ROUTES ***************************/
// ALIASING ROUTE (chaining milldreware functions)
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

// AGGRIGATION PIPELINE's ROUTE
router.route('/tour-stats').get(tourController.getTourStats);

// adding extra middleware middlewares to the routes for authentication & authorization
router
  .route('/montly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

// for geospatial queries
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithIn);

// for geospatial queries
router.route('/distance/:latlng/unit/:unit').get(tourController.getDistances);

// adding extra middleware middlewares to the routes for authentication & authorization
router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

// adding extra middleware middlewares to the routes for authentication & authorization
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'), // only admin & lead-guide can delete a tour
    tourController.deleteTour
  );

/******************** EXPORTING TOUR ROUTE ********************/
module.exports = router;
