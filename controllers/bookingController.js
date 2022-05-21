const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourmodel');
const User = require('../models/usermodel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
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

    /*
    // user will be re-directed to this url as soon the transaction gets successfuly completed
    // this is not a secure way, will make this secure in production using Stripe's webhooks
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${
    //   req.user.id
    // }&price=${tour.price}`,
    */

    // user will be re-directed to this url as soon the transaction gets successfuly completed
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,

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
        // images must be from hosted on a website
        images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
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

/* 
// this is only temporary, because it's UNSECURE: everyone can make bookings without paying
// will implement this in secure way in production using Stripe's webhooks
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  // redirecting to home page
  res.redirect(req.originalUrl.split('?')[0]);
}); 
*/

// to create new booking in the DB
const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const { price } = await Tour.findOne({ _id: session.client_reference_id });

  await Booking.create({ tour, user, price });
};

// this code will run whenever a payment was successful
exports.webhookCheckout = (req, res, next) => {
  // when Stripe calls our webhook, it will add a header to that request containing a special signature for our webhook
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    // req.body needs to be in the raw form, so basically available as a string & that is why we put have '/webhook-checkout' route before the BODY PARSER route
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // sending error message back to stripe
    return res.status(400).send(`WEBHOOK err: ${err.message}`);
  }

  // 'checkout.session.completed' is event type that we have defined in STRIPES dashboard
  if (event.type === 'checkout.session.completed') {
    // "event.data.object" is stripe's checkout session object that we have created in getCheckoutSession()
    createBookingCheckout(event.data.object);
  }

  // sendin response back to stripe
  res.status(200).json({ received: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
