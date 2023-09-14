const mongoose = require("mongoose");

const connectToDatabase = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/bookStore")
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
};

module.exports = connectToDatabase;
