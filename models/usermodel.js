const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/*
natours -> database in MongoDB
Users -> collection/model in natours database
can create mulitple doucments in Users collecion/model 
*/

/******************** CREATING MONGOOSE SCHEMA *********************/
const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please tell us your name'] },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, // will convert email to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: { type: String, default: 'default.jpg' },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be atleat 8 character long'],
    select: false, // will hide "password" field in all the query results
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password'],
    validate: {
      // custom data validator (user-defined validation's callback function), works only with CREATE(), SAVE() & not with UPDATE()
      validator: function (el) {
        return el === this.password; // password matching
      },
      message: 'passwords must be same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    defautl: true,
    select: false, // will hide "active" field in all the query results
  },
});

/***************** MONGOOSE MIDDLEWARE FUNCTIONS ******************/
// PRE SAVE HOOK/MIDDLEWARE (run before mongoose's save() and create() methods)
userSchema.pre('save', async function (next) {
  // this keyword will point to currently processed document

  /// only run this function if password field was actually modified/updated
  if (!this.isModified('password')) return next();

  // PASSWORD ENCRYPTION/HASHING using "bcrypt" algorithm
  // bcrypt.hash(password, cost) -> its an asynchronous function, so wait it
  this.password = await bcrypt.hash(this.password, 12);

  // deleting or making "passwordConfirm" field unpersistent in the database
  this.passwordConfirm = undefined;

  next();
});

userSchema.pre('save', function (next) {
  // password filed is not modified or current document is newly created
  if (!this.isModified('password') || this.isNew) return next();

  // in practice, sometimes a small problem happens. And that problem is that sometimes saving to the database is a bit slower than issuing the JSON Web Token, making it so that the changed password timestamp is sometimes set a bit after the JSON Web Token has been created. so again, sometimes it happens that JWT token is created a bit before the changed password timestamp has actually been created.
  // this will actually ensure that the token is always created after the password has been changed
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/******************** QUERY MIDDLEWARE FUNCTIONS *********************/
// PRE SAVE QUERY FIND MIDDLEWARE (run before all queries that starts with "find")
userSchema.pre(/^find/, function (next) {
  // this keyword points to the current processed query

  // will find only those documents that have "active: true" field
  this.find({ active: { $ne: false } });

  next();
});

/************************ INSTANCE METHOD *************************/
// an instance method is basically a method that is gonna be available on all documents of a certain collection i.e. a instance method is defined on a particular schema

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  // this keyword points to currently processed document

  // bycrypt.compare() is an asynchronus methods
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // convert passwordChangedAt to timestamp in seconds
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    // console.log(changedTimestamp, JWTTimestamp);

    // will return true only if user have changed the password after current login i.e after a JWT token is issued for the curent login
    return JWTTimestamp < changedTimestamp;
  }

  // user does't changed the password
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // generate a random 32 bytes hexa-decimal string
  const resetToken = crypto.randomBytes(32).toString('hex');

  // generates a encrypted string
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);

  // this will only update the value of "passwordResetExpires" field but did not save it in the database
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

/******************** CREATING MONGOOSE MODEL *********************/
// creating a model out of the database schema & by convention the model's name's first alphabet is always capital
// model(modelName, schema)
const Users = mongoose.model('Users', userSchema);

/********************* EXPORTING TOURS MODEL **********************/
module.exports = Users;
