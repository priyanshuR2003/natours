const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty."],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    //parent referencing:
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "Review must belong to a tour"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "review must belong to a user"],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//populating review (with user and tour field):
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //     path: 'tour',
  //     select: 'name' //field to show in response
  // }).populate({
  //     path:'user',
  //     select:'name photo'
  // })

  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

//static method:(which can be called directly on model) for calculation  1)no. of ratings on each tour 2)average rating of each tour
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //aggregation pipeline:
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 }, //nRating : no. of ratings/reviews
        avgRating: { $avg: "$rating" }, //avgRating: average rating
      },
    },
  ]);

  // console.log(stats);

  //reviews are present
  if (stats.length > 0) {
    //persisting changes to DB:
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    //resetting default values:
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

//creation of reviews:
reviewSchema.post("save", function () {
  //this-> document that currently is being saved.

  this.constructor.calcAverageRatings(this.tour);
});

//updation and deletion of reviews:
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne(); //this.r : to pass data to post middleware, this.findOne : current query
  // console.log(this.r);
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

//preventing duplicate reviews:
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
