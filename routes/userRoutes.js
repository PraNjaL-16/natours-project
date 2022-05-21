/**************************************************************/
/*********************** SUB APPLICATION **********************/
const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

/*************************** ROUTES ***************************/
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.route('/logout').get(authController.logout);

router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);

// "protect" function here is really just a middleware. And also remember that middleware runs always in sequence. And "router" is also a kind of middleware function. And so just like with the regular routes we can use middleware function on "router" as well. And what this will do is to basically protect all the routes that come after this point/middlware for i.e. routes below this middleware can only be accessed by a logged-in users. And again, that's because middleware runs in sequence.
router.use(authController.protect);

router.route('/updateMyPassword').patch(authController.updatePassword);
router
  .route('/updateMe')
  .patch(userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.route('/deleteMe').delete(userController.deleteMe);
router.route('/me').get(userController.getMe, userController.getUser);

// all the routes below this middleware are protected (i.e. routes below this middleware can only be accessed by a logged-in users) as well as only restricted for 'admin' use
router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers).post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

/******************** EXPORTING USER ROUTE ********************/
module.exports = router;
