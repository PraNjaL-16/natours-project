const multer = require('multer');

// saving image to file system
// const multerStorage = multer.diskStorage({
//   // req is the current request object
//   // file is currently uploading photo
//   // cb is a call back function
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];

//     // user-userId-timeStamp.jpeg -> image's name format
//     // user object will be added to request object in protect middleware function
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// saving image to memory (i.e. image is stored as buffer)
const multerStorage = multer.memoryStorage();

// filter to upload image files only
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 404), false);
  }
};

// to upload images
// const upload = multer({ dest: 'public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

/******************** EXPORTING MULTER OBJECT ********************/
module.exports = upload;
