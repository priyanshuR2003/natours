//file structure:

const express = require("express");
const morgan = require("morgan");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression"); //to compress text responses
const hpp = require("hpp");
const path = require("path"); //module to manipulate path names
const cookieParser = require("cookie-parser");

//creating app variable:
const app = express();

//app settings:
app.set("view engine", "pug"); //setting template engine to pug
app.set("views", path.join(__dirname, "views")); //define where views are located

//global middlewares:
//for serving static files:
app.use(express.static(`${__dirname}/public`));

//setting security HTTP headers:
app.use(helmet());

//compression middleware:
app.use(compression());

//morgan:to see request data in console
//using env variable:(development logging)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//limit req from IP(same API):
const limiter = rateLimit({
  max: 100, //no. of req per IP
  windowMs: 60 * 60 * 1000, //allow 100 req per hour (in milliseconds) per IP
  message: "Too many requests from this IP, please try again in an hour",
});
app.use("/api", limiter);

//for adding POST request data to req object:(Body Parser: parses data from body)
app.use(express.json());
//middleware : to parse data coming from HTML form:
app.use(
  express.urlencoded({
    extended: true, //allow us to receive complex data
    limit: "10kb", //data size limit
  })
);
//for adding cookies data to req object(Cookie Parser: parses data from cookie)
app.use(cookieParser());

//data sanitization against NoSQL query injection:
app.use(mongoSanitize());

//data sanitization against XSS:
app.use(xss());

//preventing parameter pollution:
app.use(
  hpp({
    //whitelist : array of fields for which we allow duplicates
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

//to  add current date and time to request(Test middleware:)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); //toISOString converts time in readable format
  // console.log(req.headers);
  // console.log(req.cookies);
  next();
});

//route-handlers:
//tours:

//users:

//1)importing routers:(mini application)
const toursRouter = require("./routes/toursRoutes.js");
const usersRouter = require("./routes/usersRoutes.js");
const reviewsRouter = require("./routes/reviewRoutes.js");
const bookingRouter = require("./routes/bookingRoutes.js");
const viewRouter = require("./routes/viewRoutes.js");

//2)mounting routers:
//routes for rendering template:
app.use("/", viewRouter);

//api routes:
app.use("/api/v1/tours", toursRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/reviews", reviewsRouter);
app.use("/api/v1/bookings", bookingRouter);

//for unhandled routes:
app.all("*", (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});

//global error handling middleware:
app.use(globalErrorHandler);

//routes:

//starting server:
//i)exporting app
module.exports = app;
