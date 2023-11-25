const reviewController = require("./../controllers/reviewController");
const express = require("express");
const authController = require("./../controllers/authController");

const router = express.Router({ mergeParams: true }); //mergeParams : to enable review router to access :tourId parameter (from tours route)

router.use(authController.protect);

//POST /tours/3sdf432/reviews
//POST /reviews
router
  .route("/")
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview
  );
router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview
  );
module.exports = router;
