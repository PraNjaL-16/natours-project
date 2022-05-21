const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/usermodel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

/***************************************************************/
/************************ ROUTE HANDLERS ***********************/
// all these routes are middleware funtions

const signToken = (id) => {
  // to login a user we have to sign a Json web token and then send it back to the user
  // jwt.sign(payload, secretOrPrivateKey, [options, callback])
  // using the standard HSA 256 encryption for the signature, the "secretOrPrivateKey" should at least be thirty two characters long, but the longer the better
  // the token header will be automatically created/added by JWT NPM package
  return (token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }));
};

const createSendToken = (user, statusCode, res) => {
  // login newly created user (i.e. signing a Json web token and then sending it back to the user)
  // here user id is the payload for JWT token
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), // time in ms
    // to specify that this cookie will only be created & sent to the client on an encrypted connection. So basically, only on HTTPS request. Will use it in production application
    // secure: true,
    // to specify that this cookie cannot be accessed or modified in any way by the browser, to prevent cross-site scripting attacks. Its a secure way to create & store cookie on the browser.
    httpOnly: true,
  };

  // can see the cookie's data in "Cookies" section in postman

  // making "secure" field to true for production application
  if (process.env.NODE_ENV.trim() === 'production') cookieOptions.secure = true;

  // sending token via cookie to the client
  // cookie(key, value, options)
  res.cookie('jwt', token, cookieOptions);

  // remove password only from the query output but its already gets stored in the DB
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token, // sending JWT token to the user/client & client should store this token for further use
    data: {
      user,
    },
  });
};

// signup a new user
exports.signup = catchAsync(async (req, res, next) => {
  // create() return a promise, so await it
  // const newUser = await User.create(req.body);

  // more secure way to write above commented code to create a new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    // role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  // login newly created user (i.e. signing a Json web token and then sending it back to the user) & sending response to the client
  createSendToken(newUser, 201, res);
});

/******************** USER AUTHENTICATION *********************/
// login an existing user
// the concept of logging a user in basically means to sign a JSON web token and send it back to the client. But in this case we only issue the token in case that the user actually exists, and that the password is correct
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. check if email & password exist
  if (!email || !password) {
    // this error will be picked by our global error handler
    return next(new AppError('Please provide email & password', 400));
  }

  // 2. check if the user exists & password is correct
  // const user = User.findOne({email: email});
  // or
  // explicitly selecting password field as by default it will not be selected in the query result
  const user = await User.findOne({ email }).select('+password');

  // correctPassword() is a instance method of userSchema & user is a document of userSchema. So, correctPassword() method will also be availabe on the user document
  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3. if everything ok, send the token to client
  // login an existing user (i.e. signing a Json web token and then sending it back to the user) & sending response to the client
  createSendToken(user, 200, res);
});

/********************** LOGOUT THE USER ***********************/
// to logout the logged-in user
exports.logout = (req, res) => {
  // sending token via cookie to the client
  // to remove the actual token from cookie to logout the user
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

/********** MIDDLEAWRE FUNCTION FOR PROTECTED ROUTES **********/
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. getting token & check if it's there
  // can authorize a user using jwt token coming either from authorization headers or from cookies

  // reading jwt token from header's authorization section of a request
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // reading jwt token from cookies section of a request
  else if (req.cookies.jwt) {
    // jwt is the name of cookie
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged-in. Please log in to get access.', 401));
  }

  // 2. verification token (to check if token is valid)
  // A valid token is a token where no one tried to change the payload. And the payload, in our case is always the user_id of the user for which the token was issued during direct login or login while signing up
  // jsw.verify() is a asynchronous function. It will return decoded payload. It also recieve a callback function which will be executed as soon as the verificatin process completes
  // prominisfy() is a node built-in function to make a asynchronous function return a promise
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3. check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exists', 401));
  }

  // 4. check if user changed password after the token was issued
  // changedPasswordAfter() is a instance method of User schema. So, it will be availabe on all the documents of User schema & currentUser is a document of User schema. So, changedPasswordAfter() is available on currentUser document as well.
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // user have changed the password after current login i.e after a JWT token is issued for the current login
    return next(new AppError('User recently changed password. Please login again.', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  // the request object, is the one that travels, basically, from one middleware to another middleware. And so, if we want to pass data from one middleware to the next one, then we can simply put some stuff on the request object, and then that data will be available on the next middleware function.
  // creating new field called "user" on request object. It can be used in next middleware function or adding user object to request object
  req.user = currentUser;

  // THERE IS A LOGGED IN USER. So, making that user accessible to our pug templates
  res.locals.user = currentUser; // pug template will have access to locals variable i.e to user variable

  next();
});

/********************* LOGGED IN OR NOT  **********************/
// middleware function to check whether a user is logged in or not
// only for rendered pages, no errors
exports.isLoggedIn = async (req, res, next) => {
  let token;

  try {
    if (req.cookies.jwt) {
      // 1. getting token & check if it's there
      token = req.cookies.jwt;

      // 2. verification token (to check if token is valid)
      // when we perform the logout this verification step will fail as token is not in the format that this function expected & control will go to catch() block & from there to next middleware & in this way we don't have a logged in user any more
      // but when we perform the login this verification step will be successful as token will be in the format that this function expected & user will be logged in after further steps also become successfull
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      // 3. check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 4. check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        // user have changed the password after current login i.e after a JWT token is issued for the current login
        return next();
      }

      // THERE IS A LOGGED IN USER. So, making that user accessible to our pug templates
      res.locals.user = currentUser; // pug template will have access to locals variable i.e to user variable
      return next();
    }
  } catch (err) {
    return next();
  }

  next();
};

/********************* USER AUTHORIZATION *********************/
// usually, we cannot pass arguments into a middleware function but if we really want to pass arguments to a middleware function. We can do it by creating a wrapper function which will then return a middleware function that we acutally want to create. We can then pass arguments to the wrapper function & these arguments will then be available on the middleware function according to concept of Clousers in JS.
// wrapper function accepting arbitary number of arguments using REST operator
exports.restrictTo = (...roles) => {
  // returning the actual middleware function & this middleware function will have access of waraper function's arguments due to Closure. So, in this indirect way we can pass arguments to a middleware function.
  return (req, res, next) => {
    // roles will be a array

    // user object is added to request object by "protect" middleware function
    // console.log('role', req.user.role);

    // "user" is the field added to request body in the previous middleware function
    if (!roles.includes(req.user.role)) {
      // only admin & lead-guide can delete a tour
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    // ACCESS GRANTED TO DELETE A TOUR
    next();
  };
};

/********************* FORGOT PASSWORD *********************/
exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError('There is no user with email address', 404));

  // console.log('user', user);

  // 2. generate the random reset token
  // using instance method of userSchema
  const resetToken = user.createPasswordResetToken();

  // "validateBeforeSave: false" will stop all the validators specified in the userSchema only for this document & save this document without performing any data validation
  await user.save({ validateBeforeSave: false });

  // 3. sent it the user's mail
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    // console.log(resetURL);
    await new Email(user, resetURL).sendPasswordReset();
  } catch (err) {
    // this will only modify the field & not update their values in the database
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // to save updates in the database
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!',
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. get user based on token
  // generates a encrypted string
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  // 2. if token has not expired, and there is user, set the new password
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  // 3. upadate changedPasswordAt property for the user
  // this will only modify the field & not update their values in the database
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // to save updates in the database
  await user.save(); // all the specified validators of the database will run on the data

  // 4. log the user in, send JWT
  // login an existing user (i.e. signing a Json web token and then sending it back to the user) & sending response to the client
  createSendToken(user, 200, res);
});

/********** UPDATE PASSWORD OF CURRENTLY LOGGED-IN USER **********/
// will work only for logged-in users
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1. get user from collection
  // user object is added to request object by "protect" middleware function
  // explicitly selecting password field as by default it will not be selected in the query result
  const user = await User.findById(req.user.id).select('+password');

  // 2. check if POSTed current password is correct
  // instance method of userSchema
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3. if so update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // 4. log user in, send JWT
  // login an existing user (i.e. signing a Json web token and then sending it back to the user) & sending response to the client
  createSendToken(user, 200, res);
});
