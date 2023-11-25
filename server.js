//for saving env variables from config.env file. IMP: should be done before importing app
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" }); //take variables from config.env and saves then in process.env(node env var)
const mongoose = require("mongoose"); //

//catching uncaught exception :should be at the Top of code :
process.on("uncaughtException", (err) => {
  // console.log(err);
  console.log("Uncaught exception! Shutting down!");
  // console.log(err.name, err.message);
  process.exit(1);
});

//i)importing app:
const app = require("./app");

//replacing <PASSWORD> placeholder:
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

//connect to database:
mongoose
  // .connect(process.env.DATABASE_LOCAL, { //to connect to local Database
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    // console.log(con.connections);
    console.log("DB connections successful");
  });

//locally managing unhandled promise rejections:
// .catch((err) => {
//   console.log("ERROR");
// });

//starting server:
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//globally managing unhandled promise rejections: (for all asynchronous code)
// process.on("unhandledRejection", (err) => {
//   console.log(err.name, err.message);
//   console.log("Unhandled Rejection! Shutting down!");
//   //shutdown application:
//   process.exit(1);
// });

//gracefull shutdown:
process.on("unhandledRejection", (err) => {
  // console.log(err.name, err.message);
  console.log("Unhandled Rejection! Shutting down!");
  //shutdown server:
  server.close(() => {
    //shutdown application:
    process.exit(1);
  });
});

//catching uncaught exception : (handling all errors in synchronous code)
// process.on("uncaughtException", (err) => {
//   console.log("Uncaught exception! Shutting down!");
//   console.log(err.name, err.message);

//   //gracefull shutdown:
//   server.close(() => {
//     process.exit(1);
//   });
// });
