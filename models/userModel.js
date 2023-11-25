const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); //

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Pleast tell us your name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    //validating E-mail:
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    //adding default photo (to new user)
    default: "default.jpg",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    //hiding password field from responses:
    password: {
      select: false,
    },
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    //to make sure password === passwordConfirm:
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not same",
    },
  },
  passwordChangedAt: Date,
  //
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  //
  passwordResetToken: String,
  passwordResetExpires: Date,
  //
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

//mongoose middleware: for encrypting password:
userSchema.pre("save", async function (next) {
  //to check if password field is modified in present request:
  if (!this.isModified("password")) {
    return next();
  }

  //hash password :
  this.password = await bcrypt.hash(this.password, 12); // (password, cost parameter) , cost parameter : how CPU intensive password encryption is.

  //deleting passwordConfirm:
  this.passwordConfirm = undefined;
  next();
});

//mongoose pre middleware: to update changedPasswordAt property for user:
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //1000: to ensure that token is always created after the password has been changed.
  next();
});

//query middleware : to exclude {active: false} fields from all queries starting with find:
userSchema.pre(/^find/, function (next) {
  //this: points to current query

  this.find({ active: { $ne: false } });

  next();
});

//instance method: to check if entered password is correct or not:
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//4th step of protecting route:
//instance method:
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // console.log(this.passwordChangedAt, JWTTimestamp);

    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // console.log(this.passwordChangedAt, JWTTimestamp);

    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

//instance method: to generate reset token:
userSchema.methods.createPasswordResetToken = function () {
  //i)creating random string:(with crypto)
  const resetToken = crypto.randomBytes(32).toString("hex");

  //ii)encryption:(of random string)
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  //iii)token life:
  this.passwordResetExpires = Date.now + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
