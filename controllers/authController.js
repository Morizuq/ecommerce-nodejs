const catchAsync = require('../utils/catchAsync');
const User = require('../models/user');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const crypto = require('crypto');
const Email = require('../utils/email');

//Create a jsonwebtoken token
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

//Send response cookie and token
const createSendToken = (user, status, res) => {
  //Create token
  const token = signToken(user._id);

  //Cookie options
  const cookieOptions = {
    expire: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'prod') cookieOptions.secure = true;
  //Hide Password
  user.password = undefined;

  //Send Response
  res.cookie('jwt', token, cookieOptions);

  res.status(status).json({
    status: 'success',
    token,
  });
};

/*
Sign up user
*/
exports.signUp = catchAsync(async (req, res, next) => {
  //Create new user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    /* 
    **role: req.body.role** 
    Only admins can change the role of a user
    Hence, the role can only be changed from the default 
    with the 'updateUser middleware'
    */
  });

  //Send a welcome message after sign up
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  //Create token and send response
  createSendToken(newUser, 201, res);
});

/*
Log user in
*/
exports.logIn = catchAsync(async (req, res, next) => {
  //Get req email and password
  const { email, password } = req.body;
  //If there is no email || password, send error
  if (!email || !password) {
    return next(new AppError('Please input email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  //Chack if input email and password matches an existing user
  if (!user || !(await user.confirmPassword(password, user.password))) {
    return next(new AppError('Wrong email or password', 401));
  }

  //Create token and send response
  createSendToken(user, 200, res);
});

/*
Log user out
*/
exports.logOut = catchAsync(async (req, res, next) => {
  //Overwrite the cookie
  res.cookie('jwt', process.env.JWT_LOGOUT_STRING, {
    expiresIn: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

/* 
This middleware is to restrict access to only logged in users
*/
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  //Get token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  //If there is no token, send a login error
  if (!token) {
    return next(new AppError('Pleas log in', 401));
  }

  //Decode token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //Check if user exist
  const currentUser = await User.findById(decoded.id);

  //If user doesn't exist, send error
  if (!currentUser) {
    return next(new AppError('User does not exist', 401));
  }

  //Check if password has been changed after token has been issued
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return new AppError('Password Changed, log in again', 401);
  }

  //Set user so the next middleware can have access to 'req.user'
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  //Check if jwt cookie exist
  try {
    if (req.cookie.jwt) {
      //Decode the cookie
      const decoded = await promisify(jwt.verify)(
        req.cookie.jwt,
        process.env.JWT_SECRET
      );
      //Find user by id
      const currentUser = User.findById(decoded.id);

      //If user doesn't exist, move to the next middleware
      if (!currentUser) {
        return next();
      }
      //If user changed password after jwt was issued, move to the next middleware
      if (currentUser.passwordChangedAfter(decoded.iat)) {
        return next();
      }
      res.locals.user = currentUser;
      return next();
    }
  } catch (error) {
    return next();
  }
  next();
};

/*
Restrict routes to users with certain priviledges
*/
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }
    next();
  };
};

/*
Forget Password

This middleware is for signed out users who forgot their password

Users would recieve a url to reset their password in their email after

triggering the '/forgetPassword' route
*/
exports.forgetPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(
      new AppError('No user matches the email, please try again!', 400)
    );
  }

  //If user is found, mail reset token to the user
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  //Send mail
  try {
    await new Email(user, resetURL).sendPasswordReset();

    //If successful
    res.status(200).json({
      status: 'success',
      message: 'Email sent successfully',
    });
  } catch (error) {
    //If not successful
    (user.passwordResetToken = undefined),
      (user.passwordResetTokenExpiresIn = undefined);

    //Do not run validators before saving to the db
    await user.save({ validateBeforeSave: false });
    //Log error to the console
    console.log(error);
    return next(new AppError('Something went wrong, please try again!', 400));
  }
});

/*
Reset Password

This middleware if for logged out users who recieved 

their reset token after triggering the '/forgetPassword' 

route to change their password
*/
exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get reset token from params
  const resetToken = req.params.token;

  //Encrypt reset token
  const encryptedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //Get user if token is not expired
  const user = await User.findOne({
    passwordResetToken: encryptedToken,
    passwordResetTokenExpiresIn: { $gt: Date.now() },
  });

  //If no user, send an error
  if (!user) {
    return new AppError('Invalid token or token is expired', 400);
  }

  /*Update user password and also remove the 
  
  passwordResetToken along with passwordResetTokenExpiresIn*/

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpiresIn = undefined;
  await user.save();

  //Create token and send response
  createSendToken(user, 200, res);
});

/*
Update pasword

This middleware is for already logged in users to update their password

Hence, for this to work, the 'protect' middleware/controller has to be

present before this midleware such that the req.user can be passed on to this controller
*/
exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user
  const user = await User.findById(req.user.id).select('+password');

  /*Confirm password and update password

  *passwordCurrent* is the current user password*/

  if (!(await user.confirmPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect Password', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //Send and recieve token
  createSendToken(user, 200, res);
});
