//
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const Tour = require("../models/toursModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //1)getting info of tour currently in purchasing stage:
  const tour = await Tour.findById(req.params.tourID);

  //2)creating checkout session:
  const session = await stripe.checkout.sessions.create({
    //details about session :

    //three options compulsary:
    //i) payment method options:
    payment_method_types: ["card"],
    //ii)url called when transaction is successfull: //TEMPORARY SOL : passing data into success url using query string
    success_url: `${req.protocol}://${req.get("host")}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`,

    //iii) cancel URL when transaction is cancelled by user:
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,

    //optional :(but imp)
    // iv)customer email:
    customer_email: req.user.email,

    //v) allows us to pass data about session we are currently creating:
    client_reference_id: req.params.tourID,

    //vi) details of product (to send):
    // line_items: [
    //   {
    //     name: `${tour.name} Tour`,
    //     description: tour.summary,
    //     images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    //     amount: tour.price * 100,
    //     currency: "usd",
    //     quantity: 1,
    //   },
    // ],

    //updated-version :
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "inr",
          unit_amount: tour.price,
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
          },
        },
      },
    ],
    mode: "payment",
  });

  //sending session:
  res.status(200).json({
    status: "success",
    session: session,
  });
});

//creating new booking in database:
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  //checking existence of data in query string:
  if (!tour && !user && !price) {
    return next();
  }

  //creating booking:(in DB)
  await Booking.create({ tour, user, price });

  //redirecting to success_url instead of next():
  res.redirect(`${req.protocol}://${req.get("host")}/`);
});

//CRUD operations on booking:
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
