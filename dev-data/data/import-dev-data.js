//to transfer data from JSON file(tours-model.js) to database(MongoDB) :

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const mongoose = require("mongoose");

const fs = require("fs");
const Tour = require("./../../models/toursModel");
const Review = require("./../../models/reviewModel");//
const User = require("./../../models/userModel");//

//replacing <PASSWORD> placeholder:
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

//connect to database:
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    console.log("DB connections successful");
  });

//reading JSON file:
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours.json`, "utf-8")
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/users.json`, "utf-8")//
);
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")//
);

//transfer data to database:
const importData = async () => {
  try {
    await Tour.create(tours); //tours=passing array of JS objects
    await User.create(users, {validateBeforeSave: false});//
    await Review.create(reviews);//
    console.log("Data successfully transfered");
  } catch (err) {
    console.log(err);
  }
  process.exit(); //to exit the process
};

//delete all data from  collection (Tours):
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data successfully deleted");
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// console.log(process.argv);
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
