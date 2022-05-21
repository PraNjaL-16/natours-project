class APIfeatures {
  // constructor will automatically return the entire object of APIfeatures class to support method chaining
  constructor(query, queryString) {
    // adding fields to current object
    this.query = query;
    this.queryStirng = queryString;
  }

  // 1. FILTERING & ADVANCE FILTERING
  filter() {
    const queryObj = { ...this.queryStirng };

    // filter
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // advance filter
    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    // returing the entire object of APIfeatures class to support method chaining on filter() method
    return this;
  }

  // 2. SORTING (ascending & dscending order)
  sort() {
    if (this.queryStirng.sort) {
      const sortBy = this.queryStirng.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    // returing the entire object of APIfeatures class to support method chaining on sort() method
    return this;
  }

  // 3. FIELDS LIMITING or projecting (including & excluding)
  limitFields() {
    if (this.queryStirng.fields) {
      const fields = this.queryStirng.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    // returing the entire object of APIfeatures class to further method chaining on limitFields() method
    return this;
  }

  // 4. PAGINATION
  paginatie() {
    const page = this.queryStirng.page * 1 || 1;
    const limit = this.queryStirng.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    // returing the entire object of APIfeatures class to support method chaining on paginate() method
    return this;
  }
}

module.exports = APIfeatures;
