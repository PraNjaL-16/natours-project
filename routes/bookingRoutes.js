/**************************************************************/
/*********************** SUB APPLICATION **********************/
const express = require('express');
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

const router = express.Router();

/*************************** ROUTES ***************************/
// this will protect all the routes defined after this point
router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

// routes defined after this poit will only be accessible by admin & lead-guide
router.use(authController.restrictTo('admin', 'lead-guide'));

router.route('/').get(bookingController.getAllBookings).post(bookingController.createBooking);
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

/******************** EXPORTING TOUR ROUTE ********************/
module.exports = router;
