const multer = require('multer');
const sharp = require('sharp');

const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const ancestorController = require('./ancestorController');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//Upload image
exports.uploadUserImage = upload.single('photo');

//Resize image
exports.resizeImage = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`assets/img/users/${req.file.filename}`);

  next();
});

/*
This function is for filtering objects
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

/*
A middleware that lets already logged in users view their details

This works by passing the user id into the params field while the next middleware

'getUser' fetches the user data by id
*/
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//This middleware is for already logged in users to update their details
exports.updateMe = catchAsync(async (req, res, next) => {
  //Get user
  const user = req.user;

  //Check if input includes password
  if (req.body.password || req.body.passwordConfirm)
    return next(new AppError("Can't change password, go to /updatePassword"));

  //Filter out unneccessay inputs
  const filteredBody = filterObj(req.body, 'email', 'name');

  if (req.file) filteredBody.photo = req.file.filename;

  //Update user
  const newUser = await User.findByIdAndUpdate(user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  //Send response
  res.status(200).json({
    status: 'success',
    data: {
      user: newUser,
    },
  });
});

//This middleware is for already logged in users to delete/deactivate thier account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

/* 
This middlewares are to be used by admins

Hence should pe placed only after the 'restrictTo middleware in the router'
*/
exports.getAllUsers = ancestorController.getAll(User);
exports.getUser = ancestorController.getOne(User);
exports.deleteUser = ancestorController.delete(User);
exports.updateUser = ancestorController.update(User);
