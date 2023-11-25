const Review = require("./../models/reviewModel");
const catchAsync = require("./../utils/catchAsync");
const factory = require("./handlerFactory");

exports.setTourUserIds = (req, res, next) => {
  //if we didn't specify tourId in postman(body):
  if (!req.body.tour) {
    //take tourId from URL:
    req.body.tour = req.params.tourId;
    // console.log(req.body.tour);
  }

  //if userId is not passed in postman(body):
  if (!req.body.user) {
    //currently logged user:
    req.body.user = req.user.id;
    // console.log(req.body.user);
  }
  next();
};

exports.getAllReview = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
exports.getReview = factory.getOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
