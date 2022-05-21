/**************************************************************/
/*********************** SUB APPLICATION **********************/
const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

// const router = express.Router();

/******************* MONGOOSE MERGE PARAMS ********************/
// by default, each router only have access to the parameters of their specific routes & by specifying '{ mergeParams: true }' now this review router can access parameters of all the routes in this case it can now access parameters of tourRoutes as well
const router = express.Router({ mergeParams: true });

/*************************** ROUTES ***************************/
// this will basically protect all the routes that come after this point/middlware for i.e. routes below this middleware can only be accessed by a logged-in users
router.use(authController.protect);

router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'), // this route can accessed by user
  reviewController.setTourUserIds,
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  // these routes can only be access by user & admin after login
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview);

/******************** EXPORTING TOUR ROUTE ********************/
module.exports = router;
