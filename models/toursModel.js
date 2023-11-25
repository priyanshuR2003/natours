const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
const User = require("./userModel");

//creating Schema:(with schema type options)
const tourSchema = new mongoose.Schema(
  //options with schema definition:
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxlength: [40, "A tour name must be smaller than 40"],
      minlength: [10, "A tour name must be greater than 10"],
      // validate: [validator.isAlpha, "Tour name must only contain alphabets"],
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration."],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, "Rating must be less than 5"],
      min: [1, "Rating must be more than 1"],
      //setter function : runs each time new value is set for this field:
      set: (val) => {
        Math.round(val * 10) / 10;
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    slug: String,
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "Discount should be lower than price  {VALUE} ",
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a summary"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, //because it is only name of image which will be read from file system.
      required: [true, "A tour must have a cover image"],
    },
    images: {
      type: [String], //an array of Strings
    },
    //automatically created timestamp:
    createdAt: {
      //createdAt : timeStamp when user adds a new tour
      type: Date,
      default: Date.now(), //Date.now() :gives time in millisecond. mongo will convert it into todays date.
      select: false, //excluding createdAt field from schema
    },
    startDates: [Date], //example) "2021-03-21", "2021-03-21,11:32" or unix timestamp : mongo will automatically parse them.
    startLocation: {
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //embedding:
    //guides:Array,
    //referencing (child):
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  //object for schema options:
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//virtual property:
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//virtual populate:
tourSchema.virtual("reviews", {
  ref: "Review", // model name (child)
  foreignField: "tour", //name of field (refered field) in another model
  localField: "_id", //where is ObjectId (in parent model)
});

//indexing:
//single field index:
// tourSchema.index({ price: 1 });
//compound field index:
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

//indexing:for geospatial query:
tourSchema.index({ startLocation: "2dsphere" });
//1)document middleware:

//a)pre:
tourSchema.pre("save", function (next) {
  //console.log(this); //this = currentProcessed document.

  //creating slug:
  this.slug = slugify(this.name, { lower: true });
  next();
});

//for embedding tour Guides:
// tourSchema.pre('save', async function(next){
//   //looping guides array: to get each document for current ID:
//   const guidesPromises= this.guides.map(async (id)=>{
//     return User.findById(id);
//   });

//   this.guides=await Promise.all(guidesPromises);

//   next();
// });

//for populating Tour guides:
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-passwordChangedAt -__v",
  });

  next();
});

//b)post:

// 2)Query middleware:

//or:

//a)pre:
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//b)post:
tourSchema.post(/^find/, function (docs, next) {
  console.log(`query took ${Date.now() - this.start} milliseconds.`);
  //console.log(docs);
  next();
});

//3)Aggregation middleware:

//a)pre:
// tourSchema.pre("aggregate", function (next) {
//   // console.log(this);
//   // console.log(this.pipeline());

//   //removing secretTours from aggregation pipeline:
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

//creating model:
const Tour = mongoose.model("Tour", tourSchema);

//exporting model:
module.exports = Tour;
