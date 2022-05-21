/**************************************************************/
/*********************** SUB APPLICATION **********************/
const express = require('express');

const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

/*************************** ROUTES ***************************/
// this middleware function will be applied over all the routes that comes after this point
// router.use(authController.isLoggedIn);

// get() is used to render the page in the browser

// this route will also gets hit whenever there is a successfull paytment using stripe as this routes url is specied in the stripe session's "success_url". So, whenever this route gets hit after a successfull paytment using stripe we will make a booking document in the DB
// its a temporary solution will change it in production using Stripe's webhooks
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getloginForm);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

// instead of directly sending form data to an endpoint, we are using API to update user data
// router.post('/submit-user-data', authController.protect, viewController.updateUserData);

/******************** EXPORTING VIEW ROUTE ********************/
module.exports = router;
