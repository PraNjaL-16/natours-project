const mongoose = require('mongoose');

/******************** CREATING MONGOOSE SCHEMA *********************/
const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tours', // parent referencing
    required: [true, 'booking must belong to a tour'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'Users', // parent referencing
    required: [true, 'booking must belong to a user'],
  },
  price: {
    type: Number,
    required: [true, 'booking must have price'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

/*********************** QUERY MIDDLEWARE *************************/
bookingSchema.pre(/^find/, function (next) {
  // will populate "user" filed of bookingScheam
  this.populate('user');
  // will populate "tour" filed of bookingScheam
  this.populate({
    path: 'tour',
    select: 'name',
  });

  next();
});

/******************** CREATING MONGOOSE MODEL *********************/
// creating a model out of the database schema & by convention the model's name's first alphabet is always capital
// model(modelName, schema)
const Booking = mongoose.model('Bookings', bookingSchema);

/******************** EXPORTING BOOKING MODEL **********************/
module.exports = Booking;
