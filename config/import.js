const fs = require("fs");
require("dotenv").config();

const Product = require("../models/product");
const connectDB = require("./connect");

//Connect to the database
connectDB(process.env.MONGO_URI);

//Fetch Data from their respective JSON file
const products = JSON.parse(
  fs.readFileSync(`${__dirname}/../devdata/product.json`, "utf-8")
);

//Import Data
const importData = async () => {
  try {
    await Product.create(products);
    console.log("Data imported successfully");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Product.deleteMany();
    console.log("Data successfully deleted");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] == "--delete") {
  deleteData();
}
