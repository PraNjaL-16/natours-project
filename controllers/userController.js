const sharp = require('sharp');
const AppError = require('../utils/appError');
const upload = require('../utils/imageUpload');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

/**************************************************************/
/********************* USERS ROUTE HANDLERS *******************/
// all these routes are middleware funtions

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      // copying data from obj to newObj
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

// to upload a single image
// "photo" is the image field name in the form from where we are uploading the image
// "upload.single()" is the middleware used to parse data coming from a multi-part form
// upload.single() middleware will take the image from the form field and copy it to the destination that we specified with multer & also put some infromation about the uploaded image on "request.file" object
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  // to view uploaded image's details
  // console.log(req.file);

  if (!req.file) return next();

  // adding "filename" filed to "req.file" object. So, that we can access file name in "updateMe" route
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  // resizing the image
  // when we have to do image processing (e.g. image re-sizing) right after uploading a file, then it's always best to not even save the file to the disk/file-system directly, but instead save it to memory (i.e as buffer)
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); // finally, saving image to disk/file-system

  next();
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'this route is not implemented. Please use authController to signup new user',
  });
};

// do not upate passwords with this route, we have seprate route to update the passwords
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

/********** UPDATE DATA OF CURRENTLY LOGGED-IN USER **********/
// will work only for logged-in users
exports.updateMe = catchAsync(async (req, res, next) => {
  // to view uploaded image's details
  // console.log(req.file);

  // 1. create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError('This route is not for password updates. Please use /updateMyPassword', 400)
    );
  }

  // 2. filters out unwanted field names that are not allowed to be updated
  // filters out all the other fields from req.body except name & email. So, after filtering only name & email fields will be there in the "filteredBody"
  const filteredBody = filterObj(req.body, 'name', 'email');

  // to update curently uploading image's name in the DB
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // 3. udpate user document
  // user object is added to request object by "protect" middleware function
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // will return new updated document
    runValidators: true, // to run all the data validator again on the coming updated data
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

/********************* ADDING /ME ENDPOINT *********************/
// will work only for logged-in users
// its an endpoint where a user can retrieve his own data
exports.getMe = (req, res, next) => {
  // user object is added to request object by "protect" middleware function
  req.params.id = req.user.id;
  next();
};

/*************** DELETE CURRENTLY LOGGED-IN USER ***************/
// will work only for logged-in users
// to delete a user we are just making it UN-ACTIVE in the DB & not entirely deleting it from DB
exports.deleteMe = catchAsync(async (req, res, next) => {
  // user object is added to request object by "protect" middleware function
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
