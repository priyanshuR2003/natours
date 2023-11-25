const Tour = require("../models/toursModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const User = require("../models/userModel");
const Booking = require("../models/bookingModel");
const { async } = require("../public/js/bundle");

exports.getOverview = catchAsync(async (req, res) => {
  //1)get all data (tour data from collection):
  const tours = await Tour.find();

  //2)build template:

  //3)render template:

  res.status(200).render("overview", {
    title: "All tours",
    tours: tours, //4)passing data into template
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1)get data:
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  //
  if (!tour) {
    return next(new AppError("There is no tour with that name"), 404);
  }

  //2)build template:

  //3)render template:
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "default-src 'self' https://*.mapbox.com ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://cdnjs.cloudflare.com https://api.mapbox.com 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    )
    .render("tour", {
      title: `${tour.name} Tour`,
      tour, //4)passing data
    });
});

exports.getLoginForm = (req, res) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render("login", {
      title: "Log into your account",
    });
};

exports.getAccount = (req, res) => {
  res
    .status(200)
    .set(
      "Content-Security-Policy",
      "connect-src 'self' https://cdnjs.cloudflare.com"
    )
    .render("account", {
      title: "Your account",
    });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  // console.log(req.body);

  //update user data:
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  exports.getMyTours = catchAsync(async (req, res, next) => {
    //1)find all bookings for currently logged-in user:
    const bookings = await Booking.find({
      user: req.user.id,
    });

    //2)find tours with the returned IDs:
    //i) creating array of above IDs:
    const tourIDs = bookings.map((el) => el.tour);

    ///ii) query for tours that have above IDs:
    const tours = await Tour.find({
      _id: {
        $in: tourIDs,
      },
    });

    //rendering bookings (by reusing "overview" template):
    res.status(200).render("overview", {
      title: "My Tours",
      tours,
    });
  });

  //render account page again with updated data:
  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
});
