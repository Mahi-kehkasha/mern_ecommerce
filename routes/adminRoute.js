const express = require("express");
const admin_route = express();
const session = require("express-session");

const config = require("../config/config");

admin_route.use(session({ secret: config.sessionSecret }));

const auth1 = require("../middleware/adminAuth");
const auth = require("../middleware/adminAuth");

admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));

const adminController = require("../controllers/adminController");

admin_route.get("/", auth1.isLogout, auth.isLogout, adminController.loadLogin);
admin_route.get(
  "/admin",
  auth1.isLogout,
  auth.isLogout,
  adminController.loadLogin
);

admin_route.post("/", adminController.verifyLogin);

admin_route.get("/dashboard", auth1.isLogin, adminController.loadDashboard);

admin_route.get("/new-user", auth1.isLogin, adminController.newUserLoad);
admin_route.post("/new-user", adminController.addUser);
admin_route.get("/edit-user", auth1.isLogin, adminController.editUserLoad);
admin_route.post("/edit-user", adminController.updateUsers);

admin_route.get("/delete-user", adminController.deleteUser);

admin_route.get("/logout", auth1.isLogin, adminController.adminLogout);

admin_route.get("*", auth1.isLogin, (req, res) => {
  res.redirect("/admin");
});

module.exports = admin_route;
