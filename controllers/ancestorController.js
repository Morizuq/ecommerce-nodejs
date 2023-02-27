const APIFeatures = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

/*Every function here is created using closures so has for them to be reusable in multiple controller files just by passing in the neccessary model as a param */

//This is the ancestor for the create one controller
exports.create = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    //If request was successful
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

//This is the ancestor for the get all controller
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    //If request was successful
    res.status(200).json({
      status: "success",
      result: doc.length,
      data: {
        data: doc,
      },
    });
  });

//This is the ancestor for the get one controller
exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const prodId = req.params.id;
    const doc = await Model.findById(prodId);

    //If document wasn't found
    if (!doc) new AppError("NOt Found", 404);

    //If request was successful
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

//This is the ancestor for the update controller
exports.update = (Model) =>
  catchAsync(async (req, res, next) => {
    const prodId = req.params.id;
    const doc = await Model.findByIdAndUpdate(prodId, req.body, {
      new: true,
      runValidators: true,
    });

    //If document wasn't found
    if (!doc) new AppError("Not Found", 404);

    //If request was successful
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

//This is the ancestor for the delete controller
exports.delete = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    //If document wasn't dound
    if (!doc) new AppError("Not Found", 404);

    //If request was successful
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
