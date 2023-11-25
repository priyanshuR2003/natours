const fs = require("fs"); //
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");

const sharp = require("sharp");

//configuring multer:

//1)how to store files:

//a)save file to disk:
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },

//   //unique file name : user-userId-timestamp.jpg
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

//b)save file to memory(buffer):
const multerStorage = multer.memoryStorage();

//2)how to filter data:
const multerFilter = (req, file, cb) => {
  //test if uploaded file is image:(filter -> true:allow false:reject)

  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image, Please upload only images", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

//controller to upload photo:
exports.uploadUserPhoto = upload.single("photo");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

//controller to resize photo:
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  //resizing:
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quantity: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

//controllers:
//i) exporting controllers = replace const with exports object.
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

//updating loggedin/current user's data:
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);

  //1) create error (if user tries to change(POST) password):
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for updating password. Please use /updateMyPassword",
        400
      )
    );
  }

  //2)update user's document:

  //filtering fields:
  const x = filterObj(req.body, "name", "email");
  // saving image name to database:
  if (req.file) {
    x.photo = req.file.filename;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    x, //data to be updated
    {
      //options:
      new: true, //to return updated object
      runValidators: true, //schema validators will work (but mongoose middleware will not work(which we want) because of findByIdAndUpdate())
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  //by user
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

//for admin only:

exports.getUser = factory.getOne(User);
exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not yet defined.Please use /signup",
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User); //don't update passwords with this ( no middlewares run)
exports.deleteUser = factory.deleteOne(User); //by admin
