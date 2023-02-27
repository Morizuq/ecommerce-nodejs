const Product = require("../models/product");
const ancestorController = require("./ancestorController");

exports.createProduct = ancestorController.create(Product);
exports.getProduct = ancestorController.getOne(Product);
exports.getAllProducts = ancestorController.getAll(Product);
exports.updateProduct = ancestorController.update(Product);
exports.deleteProduct = ancestorController.delete(Product);
