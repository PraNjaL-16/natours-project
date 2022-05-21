const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIfeatures = require('./../utils/apiFeatures');

/*********************************************************************/
/********************* GENERIC HANDLER FUNCITONS *********************/

/********************** DELETE HANDLER FUNCTION **********************/
// generic function which will return a generic async delete handler function according to Model used
// defining return keyword explicitly
exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    // to delete a document by id from a collection, findByIdAndDelete() will retun a promise (query object & then we have await it to get the real data)
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      // manually creating an error with the help of next() function & directly sending it to our global error handling middleware
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'sucess',
      data: null,
    });
  });
};

/********************** UPDATE HANDLER FUNCTION **********************/
// generic function which will return a generic async update handler function according to Model used
// here we are not defining return keyword explicitly as we are defining in above function, instead here we are using arrow function's shorthand syntax to return from the function
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // to update a document by id in tours collection, findByIdAndUpdate() will retun a promise (query object & then we have await it to get the real data) having access of updated document
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // will return new updated document
      runValidators: true, // to run all the data validator again on the coming updated data
    });

    if (!doc) {
      // manually creating an error with the help of next() function & directly sending it to our global error handling middleware
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'sucess',
      data: {
        data: doc,
      },
    });
  });

/********************** CREATE HANDLER FUNCTION **********************/
// generic function which will return a generic async delete handler function according to Model used
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // creating a new document in database, create() will return a promise having the access of new doucment that we have just created
    // req.body is the new data we want to store in the database
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

/********************** READING HANDLER FUNCTION **********************/
// generic function which will return a generic async reading handler function according to Model used
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) {
      query = query.populate(popOptions);
    }

    // storing actual result of the query
    const doc = await query;

    if (!doc) {
      // manually creating an error with the help of next() function & directly sending it to our global error handling middleware
      return next(new AppError('No document found with that ID', 404));
    }

    // sending response back to client as JSON
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    // creating new instance of APIfeatures class
    // const features = new APIfeatures(Tour, req.query).filter().sort().limitFields().paginatie();
    // or
    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginatie();

    // EXECUTING FINAL QUERY OBJECT
    const doc = await features.query;

    // to get a about the query
    // const doc = await features.query.explain();

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: doc.length,

      data: {
        data: doc,
      },
    });
  });
