class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1)filtering:
    //creating hard copy of req.query object: IMP
    const queryObj = { ...this.queryString };
    //removing excluded fields from queryObj:
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    //2)advanced filtering:
    //replacing req.query with query in MongoDB:
    //{difficulty: 'easy', duration: {$gte:5}}  ->query in MongoDB
    //{difficulty: 'easy', duration: {gte:'5'}}  ->req.query
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => {
      return `$${match}`;
    });

    //build query:
    //method1(writing database queries): MongoDB (filter object)
    this.query = this.query.find(JSON.parse(queryStr));

    return this; //
  }

  sort() {
    //3)sorting:

    //a)simple sorting:
    // if (req.query.sort) {
    //   query = query.sort(req.query.sort);
    // }

    //b)sorting with more than two parameters:
    if (this.queryString.sort) {
      //replacing req.query with query in mongoose:
      //sort('price ratingsAverage') ->mongoose query
      //('price,ratingsAverage') -> req.query
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      //c)default sorting:(if user doesn't specify sort field)
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    //4) Field limiting:
    if (this.queryString.fields) {
      //match them:
      //{fields : 'name,duration,price'}
      //query.select('name duration price)
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      //default case:
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    //5)pagination:
    const page = this.queryString.page * 1 || 1; // first 1 : typecasting, second 1:default value
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // query = query.sort("-createdAt"); //repeating documents problem : because createdAt same for all documents.

    //if page doesn't exist:
    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skip >= numTours) {
    //     throw new Error("This page does not exist");
    //   }
    // }

    return this;
  }
}

module.exports = APIFeatures;
