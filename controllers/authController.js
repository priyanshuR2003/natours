const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken"); //
const AppError = require("./../utils/appError");
const util = require("util");
const Email = require("./../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), //browser will delete the cookie after it expired
    httpOnly: true, //cookie can only be received, stored and send but cannot be accessed or modified by browser
    secure: false,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true; //cookie will only be send on encrypted connection (HTTPS)
  }
  //sending cookie : means attaching cookie with res object
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res
    .set(
      "Content-Security-Policy",
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .status(statusCode)
    .json({
      status: "success",
      token,
      data: {
        user,
      },
    });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);// problem: anyone can specify the role as admin
  //sol:
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  //i)creat and sign token:
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });

  //sending welcome email:
  //a) creating url:
  const url = `${req.protocol}://${req.get("host")}/me`;
  //b) sending mail:
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email and password exists:
  if (!email || !password) {
    return next(new AppError("Please provide email and password ", 400));
  }

  //2)check if user exists && password is correct:
  const user = await User.findOne({ email: email }).select("+password"); //+password : to explicitly add password
  // const correct = await user.correctPassword(password, user.password);

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3)If everything is OK, then send token to client:

  // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.constrainedMemory.JWT_EXPIRES_IN,
  // });

  createSendToken(user, 200, res);
};

exports.protect = catchAsync(async (req, res, next) => {
  //1)getting token and check if it exists:
  let token;
  if (
    //auth JWT using headers:
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (
    //auth JWT using cookies:
    req.cookies.jwt
  ) {
    token = req.cookies.jwt;
  }

  if (!token) {
    //no token
    return next(
      new AppError("you are not logged in! Please login to get access", 401)
    );
  }

  //2)validation of token : i) check if payload is unchanged or not  ii) token is expired or not
  // jwt.verify(token, process.env.JWT_SECRET, () => {});
  //promisification of function (jwt.verify()):
  const decode = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  //3)check if user still exists: (case: user is deleted and token still exists)
  const freshUser = await User.findById(decode.id);

  if (!freshUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  //4)check if user changed password after the token was issued:
  if (freshUser.changedPasswordAfter(decode.iat)) {
    return next(
      new AppError("User recently changed password! Please login again!", 401)
    );
  }

  //grant access to protected route:(authenticated user is available on req object):
  req.user = freshUser;
  //also putting current user on res.locals:
  res.locals.user = freshUser;

  next();
});

// for rendered pages: no error created
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (
    //auth JWT using cookies:
    req.cookies.jwt
  ) {
    //1)verify token:
    const decode = await util.promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    //2)check if user still exists: (case: user is deleted and token still exists)
    const freshUser = await User.findById(decode.id);

    if (!freshUser) {
      //no error created:
      return next();
    }

    //3)check if user changed password after the token was issued:
    if (freshUser.changedPasswordAfter(decode.iat)) {
      return next();
    }

    //means there is a logged in user:(grant access to protected templates-loggedin user is available in pug template)
    res.locals.user = freshUser;
    return next();
  }
  //no cookie:
  next();
});

exports.restrictTo = (...roles) => {
  //roles=['admin','lead-guide']  role=req.user.role
  return (req, res, next) => {
    console.log(req.user.role);
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action"),
        403
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on POSTed email:
  const user = await User.findOne({ email: req.body.email });
  //if user doesn't exist:
  if (!user) {
    return next(new AppError("There is no user with specified email", 404));
  }

  //2)Generate random resetToken: (with instance method)
  const resetToken = user.createPasswordResetToken();
  //updating or saving document: (also storing encrypted token in DB)

  await user.save({ validateBeforeSave: false }); //both email and password are required fields therefore : disable validators

  //3)send it to user's email:
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to : ${resetURL} \n If you didn't forget your password, please ignore this email! `;

  try {
    //if error happens then:
    //1)set back password reset token
    //2)set back password reset expire

    //old email handler:

    // await sendEmail({
    //   email: user.email, //or req.body.email
    //   subject: "your password reset token (valid for 10min)",
    //   message: message,
    // });

    //new email handler:
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    //reset token + expire property:

    //modify data:
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    //sava data:
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email.Try again later!", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //comparing token(send by user=> encrypt it) with database token:
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  //1)identify user from token:
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //console.log(user);

  //2)set new password ( if token is not expired + user exists):
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  //delete reset token+expire:
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //saving changes:
  await user.save();

  //3) update changedPasswordAt property for user: user mongoose pre middleware

  //4)login user + send JWT:
  createSendToken(user, 200, res);
});

//changing password(of logged in user)
exports.updatePassword = catchAsync(async (req, res, next) => {
  //asking current password (before updating):

  //1)get user from collection:
  const user = await User.findById(req.user.id).select("+password"); //adding password

  //2)check if POSTed password is correct:
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("your current password is wrong.", 401));
  }

  //3)update password:
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  //4)login user+ send JWT:
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  //overriding cookie:
  res.cookie("jwt", "", {
    //short expiration time :(10 sec)
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};
