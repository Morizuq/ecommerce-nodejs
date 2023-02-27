class APIFeatures {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
  }

  filter() {
    //Spread the req.query props into an {}
    const queryObjs = { ...this.reqQuery };
    //Create an array of special fields to filter out
    const exclFields = ["sort", "page", "field", "limit"];
    //Delete/remove the excFields from the queryObjs
    exclFields.forEach((el) => delete queryObjs[el]);
    //Turn the queryObj into a string
    let queryStr = JSON.stringify(queryObjs);
    //Replace certain val(s) with $val so as to let mongoose recognize them
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (val) => `$${val}`);
    //Get the filtered vals and store back in 'query'
    this.query = this.query.find(JSON.parse(queryStr));
    //Return the whole obj so as to be able to chain another method immediately after this method
    return this;
  }

  sort() {
    if (this.reqQuery.sort) {
      //Get the vals to sort by
      const sortBy = this.reqQuery.sort.split(",").join(" ");
      //Now sort
      this.query = this.query.sort(sortBy);
    } else {
      //If there is no sort request, sort by time created
      this.query = this.query.sort("-createdAt");
    }
    //Return the whole obj so as to be able to chain another method immediately after this method
    return this;
  }

  limitFields() {
    if (this.reqQuery.fields) {
      // Get fields to llimit to
      const fields = this.reqQuery.fields.split(",").join(" ");
      //Limit fields
      this.query = this.query.select(fields);
    } else {
      //If there is no request to limit fields, remove the v flag
      this.query = this.query.select("-__v");
    }
    //Return the whole obj so as to be able to chain another method immediately after this method
    return this;
  }

  paginate() {
    //Get the page
    const page = this.reqQuery.page * 1 || 1;
    //Get the limit per page
    const limit = this.reqQuery.limit * 1 || 100;
    //Declare the skipBy
    const skip = (page - 1) * limit;
    //Paginate
    this.query = this.query.skip(skip).limit(limit);
    //Return the whole obj so as to be able to chain another method immediately after this method
    return this;
  }
}

module.exports = APIFeatures;