const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

/*
natours -> database in MongoDB
Tours -> collection/model in natours database
can create mulitple doucments in tours collecion/model 
*/

/******************** CREATING MONGOOSE SCHEMA *********************/
// 1. defining schema type options for specific fields of database schema for data validation, they are called validators
// 2. if we try to put some fields in database which are not the in the defined schema then mongoose will simply ignore those fields from the document & don't store them in the document
// 3. can do LIMITING FIELDS (including & excluding) directly on Schema like we have excluded createdAt fields. So, this fields will we there in database but it will not be visible to users
// 4. a schema can have virtual properties
// 5. validator's recieves a simple callback function which is gonna be called whenever a new document is created
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
      // custom data validator from validator library
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: { type: Number, required: [true, 'A tour must have a duration'] },
    maxGroupSize: { type: Number, required: [true, 'A tour must have a group size'] },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must me below 5'],
      // its a setter function (a callback func), which will run each time whenever a new value is set for "ratingsAverage" field
      set: (val) => Math.round(val * 10) / 10, // 4.66666, 46.666, 47, 4.7
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        // custom data validator (user-defined validation's callback function)
        validator: function (val) {
          // this keyword will point to currently processed document only when we create a new document (i.e. on CREATE() & SAVE()) & not when we update an existing document using normal UPDATE()
          return val < this.price;
        },
        // {VALUE} will be equal to val
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: { type: String, trim: true, required: [true, 'A tour must have a description'] },
    description: { type: String, trim: true },
    imageCover: { type: String, required: [true, 'A tour must have a cover image'] },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // will hide "createdAt" field in all the query results
    },
    startDates: [Date],
    secretTour: { type: Boolean, default: false },
    // startLocation is an object filed of tours schema having more than one fields
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // embedding location data/document into tours data/document (arry of objects)
    locations: [
      {
        type: { type: String, default: 'Point', enum: ['Point'] },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // embedding guide/user data/document into tours data/document (arry of objects)
    // guides: Array,
    // or
    // instead of embedding we are using referencing b/w guides & tours documents
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'Users' }],
    // child referencing (tour is the parent document refrencing to its child document reviews). Instead of this we are gonna use mongoose virtual populate
    // reviews: [{ type: mongoose.Schema.ObjectId, ref: 'Reviews' }],
  },
  {
    // to really make sure that when we have a virtual property in the schema, basically a field that is not stored in the database but calculated using some other value. So we want this to also show up whenever there is an output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/*********************** SETTING OUR OWN INDEXES ************************/
// custom indexes can when used efficiently can improve read performance in mongoDB
// 1 is for sorting in ascending order, -1 for ascending order

// single field index for price filed
// tourSchema.index({ price: 1 });

// compound index for price & ratingsAverage field
tourSchema.index({ price: 1, ratingsAverage: -1 });
// single field index for slug filed
tourSchema.index({ slug: 1 });

// index for geospatial queries
tourSchema.index({ startLocation: '2dsphere' });

/******************** MONGOOSE MIDDLEWARE FUNCTIONS *********************/
/* 
// to embedd guide/user document into tours document (demo purpose only)
// instead of embedding we will use referencing b/w guides & tours documents
tourSchema.pre('save', async function (next) {
  // this keyword will point to currently processed document
  const guidesPromises = this.guides.map(async (id) => await User.findById(id));

  // User.findById(id) will return promise. So, "guidesPromises" will be an array of promises. So, we have to await for all the promises of "guidesPromises" array to get the actual results out of the promises
  this.guides = await Promise.all(guidesPromises);

  next();
}); 
*/

// PRE SAVE HOOK/MIDDLEWARE (run before mongoose's save() and create() methods)
tourSchema.pre('save', function (next) {
  // this keyword will point to currently processed document
  // console.log(this);

  // creating new property "slug" (based on tour name) on the document
  // a slug is basically just a string that we can put in the URL, usually based on some string
  this.slug = slugify(this.name, { lower: true });

  next();
});

// PRE SAVE HOOK/MIDDLEWARE (run before mongoose's save() and create() methods)
tourSchema.pre('save', function (next) {
  // console.log('Will save document...');
  next();
});

// POST SAVE HOOK/MIDDLEWARE (run after mongoose's save() and create() methods)
tourSchema.post('save', function (doc, next) {
  // this keyword will point to currently saved/created document
  // console.log(this);

  // post middleware functions are executed after all the pre middleware functions have comleted their execution. So in we actually have the access of currently saved/created document.
  // console.log(doc);

  next();
});

/******************** QUERY MIDDLEWARE FUNCTIONS *********************/
// PRE FIND HOOK/MIDDLEWARE (run before find() & findOne() methods)
tourSchema.pre(/^find/, function (next) {
  // this keyword will point to currently processed query object. So, we can chain query object methods on it.
  // filtering out document having secretTour field equal to true
  this.find({ secretTour: { $ne: true } });

  // creating a new property on the query object
  this.start = Date.now();

  next();
});

// POST FIND HOOK/MIDDLEWARE (run after find() & findOne() methods)
tourSchema.post(/^find/, function (docs, next) {
  // this keyword will point to currently processed query object
  // console.log(`Query took ${Date.now() - this.start} milliseconds`);

  // have access of all the documents returned from the query
  // console.log(docs);

  next();
});

// PRE AGGREGATE HOOK/MIDDLEWARE (run before mongoose's aggregate() method)
tourSchema.pre('aggregate', function (next) {
  // this keyword will point to currently processed aggregation object
  // this.pipeline() will return an arregation pipeline's array array
  // console.log(this.pipeline());

  const pipeline = this.pipeline();

  // if there is a geospatial stage in a aggregation pipeline then it must be the first stage of the pipeline
  if (!(Object.keys(pipeline[0])[0] === '$geoNear')) {
    // adding another phase at the beggining of currently processed arregation pipeline's array
    pipeline.unshift({ $match: { secretTour: { $ne: true } } });
  }

  next();
});

// PRE SAVE QUERY FIND MIDDLEWARE (run before all queries that starts with "find")
tourSchema.pre(/^find/, function (next) {
  // this keyword points to the current processed query
  // for polluting mongoose have to make an additional query

  // to pollute guides field
  this.populate({
    path: 'guides',
    // extracting only specified fields from the guides document
    select: '-__v -passwordChangedAt',
  });

  next();
});

/******************** MONGOOSE VIRTUAL POPULATE **********************/
// to populate each tour with its reviews
// will create a virtual field 'reviews' on all the Tours document's query results but this filed will not be persisted to DB
// this way allows us to basically  keeping a reference to all the child documents on the parent document, but without actually persisting that information to the database
tourSchema.virtual('reviews', {
  ref: 'Reviews', // refrenced document
  foreignField: 'tour', // tour is a field of Reviews document having tour's id
  localField: '_id', // _id is a field of Tours documnet
});

/******************** MONGOOSE VIRTUAL FUNCTIONS *********************/
// defining VIRTUAL properties on a schema & then defining the get() method on it. And that's just because virtual property will basically be created each time when we get some data out of the database
tourSchema.virtual('durationWeeks').get(function () {
  // "durationWeeks" will be a new property/field on each document present in the tours collection

  // this keyword will point to currently processed document
  return this.duration / 7;
});

/******************** CREATING MONGOOSE MODEL *********************/
// creating a model out of the database schema & by convention the model's name's first alphabet is always capital
// model(modelName, schema)
const Tours = mongoose.model('Tours', tourSchema);

/********************* EXPORTING TOURS MODEL **********************/
module.exports = Tours;
