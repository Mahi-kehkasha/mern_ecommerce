const express = require("express");
const admin_route = express();
const session = require("express-session");
const uploadMultiple = require("../middleware/multer");

const config = require("../config/config");

admin_route.use(session({ secret: config.sessionSecret }));

const auth1 = require("../middleware/adminAuth");
const auth = require("../middleware/adminAuth");
admin_route.use(express.static(__dirname + "/public"));

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

admin_route.get("/view-users", auth1.isLogin, adminController.loadUsers);

admin_route.get(
  "/add-category",
  auth1.isLogin,
  adminController.newCategoryLoad
);

admin_route.post("/add-category", auth1.isLogin, adminController.addCategory);

admin_route.get("/view-category", auth1.isLogin, adminController.loadCategory);

admin_route.get("/view-products", auth1.isLogin, adminController.loadProducts);

admin_route.get("/add-product", auth1.isLogin, adminController.newProductLoad);

admin_route.post(
  "/add-product",
  uploadMultiple,
  auth1.isLogin,
  adminController.addProduct
);

admin_route.get(
  "/edit-product/:productId",
  auth1.isLogin,
  adminController.editProductLoad
);

admin_route.get(
  "/edit-category/:categoryId",
  auth1.isLogin,
  adminController.editCategoryLoad
);

admin_route.post("/edit-category/:categoryId", adminController.updateCategory);

admin_route.post(
  "/edit-product/:productId",
  uploadMultiple,
  auth1.isLogin,
  adminController.updateProduct
);

admin_route.post(
  "/remove-image/:productId/:imageIndex",
  adminController.removeSingleImage
);

admin_route.get("/new-user", auth1.isLogin, adminController.newUserLoad);
// admin_route.post("/new-user", adminController.addUser);
admin_route.get("/edit-user", auth1.isLogin, adminController.editUserLoad);
admin_route.post("/edit-user", auth1.isLogin, adminController.updateUsers);

admin_route.get("/delete-user", adminController.deleteUser);

admin_route.get("/block-user/:userId", adminController.blockUser);
admin_route.get("/unblock-user/:userId", adminController.unblockUser);

admin_route.get("/view-orders", auth1.isLogin, adminController.viewAllOrders);

admin_route.post(
  "/update-order-status",
  auth1.isLogin,
  adminController.updateOrderStatus
);

admin_route.get("/add-coupon", auth1.isLogin, adminController.addCouponLoad);

admin_route.post("/add-coupon", auth1.isLogin, adminController.addNewCoupon);

admin_route.get("/view-coupons", auth1.isLogin, adminController.viewCoupons);

admin_route.get("/view-reports", auth1.isLogin, adminController.viewReports);

admin_route.get(
  "/view-stock-report",
  auth1.isLogin,
  adminController.viewStockReport
);

admin_route.get(
  "/generate-report",
  auth1.isLogin,
  adminController.generateReports
);

admin_route.get(
  "/add-category-offer",
  auth1.isLogin,
  adminController.addCategoryOffer
);

admin_route.post(
  "/apply-category-offer",
  auth1.isLogin,
  adminController.applyCategoryOffer
);

admin_route.post(
  "/remove-category-offer",
  auth1.isLogin,
  adminController.removeCategoryOffer
);

admin_route.get("/view-banner", auth1.isLogin, adminController.viewBanner);
admin_route.get("/add-banner", auth1.isLogin, adminController.loadAddBanner);
admin_route.post(
  "/add-banner",
  uploadMultiple,
  auth1.isLogin,
  adminController.addBanner
);
admin_route.put("/edit-banners", auth1.isLogin, adminController.editBanner);
admin_route.post(
  "/delete-banner/:id",
  auth1.isLogin,
  adminController.deleteBanner
);

admin_route.get("/logout", auth1.isLogin, adminController.adminLogout);

admin_route.get("*", auth1.isLogin, (req, res) => {
  res.redirect("/admin");
});

module.exports = admin_route;
