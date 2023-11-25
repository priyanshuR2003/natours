const express = require("express");

//importing controller:
const toursControllers = require("../controllers/toursControllers");
const authControllers = require("./../controllers/authController");

// const reviewController=require("./../controllers/reviewController");
// toursRouter.route("/:tourId/reviews").post(authControllers.protect,authControllers.restrictTo('user'),reviewController.createReview);

const reviewRouter = require("./../routes/reviewRoutes");

//1)creating router:
//i)changing router name : skipped
const toursRouter = express.Router();

//param middleware:(specific to tour router)
// toursRouter.param("id", toursControllers.checkID);

toursRouter.use("/:tourId/reviews", reviewRouter); //nested route

//routes:
toursRouter
  .route("/top-5-cheap")
  .get(toursControllers.aliasTopTours, toursControllers.getAllTours); //aliasTopTours : middleware to manipulate query object an add query (?limit=5&sort=-ratingsAverage,price)

//aggregation pipeline:
toursRouter.route("/tour-stats").get(toursControllers.getTourStats);
toursRouter
  .route("/monthly-plan/:year")
  .get(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide", "guide"),
    toursControllers.getMonthlyPlan
  );

toursRouter
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(toursControllers.getToursWithin);

toursRouter
  .route("/distances/:latlng/unit/:unit")
  .get(toursControllers.getDistances);

//i)adjusting routes to imported controller(route handlers).
toursRouter
  .route("/")
  .get(toursControllers.getAllTours)
  .post(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    toursControllers.createTour
  );

toursRouter
  .route("/:id")
  .get(toursControllers.getTour)
  .patch(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    toursControllers.uploadTourImages,
    toursControllers.resizeTourImages,
    toursControllers.updateTour
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    toursControllers.deleteTour
  );

//exporting router:
module.exports = toursRouter;
