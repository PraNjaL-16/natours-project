const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('./../models/tourmodel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

/***************************************************************/
/******************* BOOKINGS ROUTE HANDLERS *******************/
// all these routes are middleware funtions
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2. create stripe's checkout session object
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], // credit-card

    // user will be re-directed to this url as soon the transaction gets successfuly completed
    // this is not a secure way, will make this secure in production using Stripe's webhooks
    success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${
      req.user.id
    }&price=${tour.price}`,

    // user will be re-directed to this url if transaction gets cancelled completed
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    // user object will be added to req object in protect middleware
    customer_email: req.user.email,
    // this custome field is gonna allow us to pass in some data about the session that we are currently creating. And that's important because later once the purchase was successful, we will then get access to the session object again. And by then, we can access the data passed to this field
    client_reference_id: req.params.tourId,
    // product details
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // images must be hosted on a website
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1,
      },
    ],
  });

  // 3. send session as response to the client
  res.status(200).json({
    status: 'success',
    session,
  });
});

// this is only temporary, because it's UNSECURE: everyone can make bookings without paying
// will make this secure in production using Stripe's webhooks
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  // redirecting to home page
  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
