//importing model:
const Tour = require("../models/toursModel");
// const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

//configuring multer:

//1)how to store files:
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

//controller to upload tourCover(single) and tour images(multiple):
exports.uploadTourImages = upload.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 3 },
]);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  //if no images uploaded(image and imageCover):
  if (!req.files.imageCover || !req.files.images) {
    return next();
  }

  //processing cover image:
  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quantity: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);
  // saving changes in DB:(for imageCover)
  req.body.imageCover = imageCoverFilename;

  //processing other images:
  req.body.images = [];
  //iterating:
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  // console.log(req.body);
  next();
});

//wrapping all handlers around catchAsync:

//controllers:

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage,price";
  req.query.fields = "name,price,ratingsAverage,summary,difficulty";
  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" });

// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };

//for creating documents:
exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  // console.log("Hello");
  const stats = await Tour.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        //grouping everything in one group:
        // _id: null,
        //grouping results for different fields:
        // _id: "$difficulty",
        _id: { $toUpper: "$difficulty" },

        numTours: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        numRatings: { $sum: "$ratingsQuantity" },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: "EASY" } },
    // },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      tour: stats,
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: "$startDates",
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        tours: { $push: "$name" },
      },
    },
    {
      $addFields: { month: "$_id" },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      tour: plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within?distance=233&center=-40,45&unit=mi ->using query string
exports.getToursWithin = catchAsync(async (req, res, next) => {
  //destructuring to get parameters:
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  //if lat, lng exists:
  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }

  // console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  //if lat, lng exists:
  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }

  //calculation:

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: distances,
    },
  });
});
