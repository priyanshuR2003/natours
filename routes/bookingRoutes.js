const express = require("express");
const bookingController = require("./../controllers/bookingController");
const authController = require("./../controllers/authController");

const router = express.Router();

//for protecting all routes:
router.use(authController.protect);

router.get(
  "/checkout-session/:tourID",
  authController.protect,
  bookingController.getCheckoutSession
);

//for admin or lead guide to update or delete bookings:
router.use(authController.restrictTo("admin", "lead-guide"));

//routes:
router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);
router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
