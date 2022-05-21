const mongoose = require('mongoose');
const Tour = require('./tourmodel');

/******************** CREATING MONGOOSE SCHEMA *********************/
const reviewSchmea = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // parent referencing (review is the child doucument referencing to its parent document tours)
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tours',
      required: [true, 'Review must belong to a tour'],
    },
    // parent referencing (review is the child doucument referencing to its parent document users)
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'Users',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    // to really make sure that when we have a virtual property in the schema, basically a field that is not stored in the database but calculated using some other value. So we want this to also show up whenever there is an output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/****************** READ PERFORMANCE IN MONGODB *******************/
// to prevent a user from making duplicate reviews for a same tour by setting compound indexes
// each combination of tour & user must be unique
reviewSchmea.index({ tour: 1, user: 1 }, { unique: true });

/******************** MONGOOSE STATIC METHODS *********************/
// static method are called on a schema/model directly
reviewSchmea.statics.calcAverageRatings = async function (tourId) {
  // aggregate() functions are called on the model/schema & static methods are also called on model/schema that's why we have used static method here
  // aggregate() recieve array of all the stages through which data will be passed & modified
  // this keyword will point to current model/schema
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }, // filter
    },
    {
      $group: {
        _id: '$tour', // group by 'tour' field
        nRating: { $sum: 1 }, // adding one to nRating for each document, will give total number of documents present in the collection
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  // console.log(stats);

  // presisting stats to the DB on a tour
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      // default values if there is no reviews
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

/******************** QUERY MIDDLEWARE FUNCTIONS *********************/
// PRE SAVE QUERY FIND MIDDLEWARE (run before all queries that starts with "find")
reviewSchmea.pre(/^find/, function (next) {
  // this keyword points to the current processed query
  // for polluting mongoose have to make an additional query & this will decrease the performance

  // in this app, it's more logical to really have the reviews available on tours, and it's not that important having the tour available on the review
  // to pollute user field
  this.populate({
    path: 'user',
    // extracting only specified fields from the guides document
    select: 'name photo',
  });

  next();
});

/***************** MONGOOSE MIDDLEWARE FUNCTIONS ******************/
// to call calcAverageRatings() whenever we create a new review
reviewSchmea.post('save', function () {
  // this keyword will point to currently processed document

  // this will not work as 'Reviews' model is not created yet
  // Reviews.calcAverageRatings(this.tourId);

  // so the other way around to write above code is using this.constructor where this keyword is the current document and the constructor is basically the model who created that document. So, "this.constructor" also points to the current model/schema. So, in this indirect way we are calling "calcAverageRatings" function on the current model/schema
  this.constructor.calcAverageRatings(this.tour);
});

/******************* MONGOOSE QUERY MIDDLEWARE ********************/
// to call calcAverageRatings() whenever we delete or update a review
reviewSchmea.pre(/^findOneAnd/, async function (next) {
  // query middleware gets access of currently processed query & not of the document. So, to get the access of document itself we query the document & save its result
  // retriving current preview document from DB & storing it to a variable
  // const r = this.findOne();
  // console.log(r);

  // trick to send data from pre query to post query middleware
  // adding a property to "this" variable (i.e to current query variable) & "this" variable will be available in both pre & post query middleware. So, now we can access "this.r" in the post query middleware as well
  // this.r will store a preview document
  this.r = await this.findOne();
  // console.log(this.r);

  next();
});

// to call calcAverageRatings() whenever we delete or update a review
reviewSchmea.post(/^findOneAnd/, async function () {
  // will not work here, as query is already executed
  // await this.findOne();

  // accessing document stored on "this.r" that was stored in above pre query middleware
  // this.r is a preview document
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

/******************** CREATING MONGOOSE MODEL *********************/
// creating a model out of the database schema & by convention the model's name's first alphabet is always capital
// model(modelName, schema)
const Reviews = mongoose.model('Reviews', reviewSchmea);

/******************** EXPORTING REVIEWS MODEL **********************/
module.exports = Reviews;
