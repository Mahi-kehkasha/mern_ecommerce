const express = require("express");
const path = require("path");
const ejs = require("ejs");
const app = express();

const connectToDatabase = require("./config/connection");

//for user routes
const userRoute = require("./routes/userRoute");
const adminRoute = require("./routes/adminRoute");

connectToDatabase();

app.use("/", userRoute);
app.use("/admin", adminRoute);

app.use(express.static(__dirname + "/public"));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejs.renderFile);

app.listen(9000, function () {
  console.log("Server is running...");
});
