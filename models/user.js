const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },

  email: {
    type: String,
    required: [true, 'Please provide user email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide valid email'],
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minLength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password doesn't' match",
    },
  },

  photo: {
    type: String,
    default: 'default.jpg',
  },

  passwordChangedAt: Date,

  passwordResetToken: String,

  passwordResetTokenExpiresIn: Date,

  active: {
    type: Boolean,
    default: true,
    select: false,
  },

  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
});

//Hash password before saving to the db
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

//If password was modified, the time it was changed should be saved to the db
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

//If user is not active, don't carry out any ^find query
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Confirm if user inputs correct password
userSchema.methods.confirmPassword = async function (inputPass, userPass) {
  return await bcrypt.compare(inputPass, userPass);
};

//Check if password was changed after
userSchema.methods.passwordChangedAfter = function (JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt / 1000, 10);

    return JWTtimestamp < changedAt;
  }
  return false;
};

//Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetTokenExpiresIn = Date.now() + 10 * 60 * 1000;
  // console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
