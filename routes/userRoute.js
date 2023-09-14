const express = require("express");
const user_route = express();
const session = require("express-session");

const config = require("../config/config");

user_route.use(session({ secret: config.sessionSecret }));

const auth = require("../middleware/auth");
const auth1 = require("../middleware/adminAuth");
user_route.use(express.static(__dirname + "/public"));

user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

const bodyParser = require("body-parser");
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const userController = require("../controllers/userController");

user_route.get("/register", auth.isLogout, userController.loadRegister);
user_route.post("/register", userController.insertUser);
user_route.get("/", auth.isLogout, auth1.isLogout, userController.loginLoad);
user_route.get(
  "/login",
  auth1.isLogout,
  auth.isLogout,
  userController.loginLoad
);

user_route.post("/login", userController.verifyLogin);

user_route.get("/forgot-password", userController.loadForgotPassword);

user_route.post("/get-otp", userController.getOtp);

user_route.post("/verify-otp", userController.verifyOtp);

user_route.post("/reset-password", userController.resetPassword);

user_route.post("/send-otp-signup", userController.getOtpSignup);

user_route.post("/verify-otp-signup", userController.verifyOtpSignup);

user_route.get("/home", auth.isLogin, userController.loadHome);

user_route.get("/products", auth.isLogin, userController.loadProducts);

user_route.get(
  "/search-by-category/:categoryID",
  auth.isLogin,
  userController.loadByCategory
);

user_route.get(
  "/products/:productID",
  auth.isLogin,
  userController.loadSingleProduct
);

user_route.get("/search", userController.handleSearchFilters);

user_route.get("/search-by-lang", userController.handleSearchByLang);

user_route.get("/filter-books-by-price", userController.handleSearchByPrice);

user_route.get("/view-cart", auth.isLogin, userController.viewCartItems);

user_route.get("/view-wishlist", auth.isLogin, userController.viewWishlist);

user_route.post("/add-to-wishlist", auth.isLogin, userController.addToWishlist);

user_route.post("/add-to-cart", auth.isLogin, userController.addToCart);

user_route.post(
  "/update-cart-quantity",
  auth.isLogin,
  userController.updateCartQuantity
);

user_route.post("/delete-item", auth.isLogin, userController.deleteCartItem);

user_route.post(
  "/delete-wishlist-item",
  auth.isLogin,
  userController.deleteWishlistItem
);

user_route.get("/get-cart-count", auth.isLogin, userController.getCartCount);

user_route.get(
  "/get-wishlist-count",
  auth.isLogin,
  userController.getWishlistCount
);

user_route.get("/proceed-to-checkout", auth.isLogin, userController.checkOut);

user_route.post("/add-address", auth.isLogin, userController.addNewAddress);

user_route.post(
  "/update-address/:addressId",
  auth.isLogin,
  userController.updateAddress
);

user_route.delete(
  "/delete-address/:addressId",
  auth.isLogin,
  userController.deleteAddress
);

user_route.post("/place-order", auth.isLogin, userController.orderPlacement);

user_route.get("/success", auth.isLogin, userController.successPage);

user_route.get("/failure", auth.isLogin, userController.failurePage);

user_route.get("/view-orders", auth.isLogin, userController.viewOrders);

user_route.post(
  "/update-order-status",
  auth.isLogin,
  userController.updateOrderStatus
);

user_route.get("/profile", auth.isLogin, userController.myProfile);

user_route.post(
  "/update-personal-details",
  auth.isLogin,
  userController.updatePersonalDetails
);

user_route.post(
  "/update-password",
  auth.isLogin,
  userController.updatePassword
);

user_route.post("/check-coupon", auth.isLogin, userController.couponCheck);

user_route.post("/remove-coupon", auth.isLogin, userController.removeCoupon);

user_route.post(
  "/verify-razorpay-payment",
  auth.isLogin,
  userController.verifyRazorpayPayment
);

user_route.get("/wallet", auth.isLogin, userController.showWallet);

user_route.get("/invoice", auth.isLogin, userController.orderInvoice);

user_route.get("/logout", auth.isLogin, userController.userLogout);

module.exports = user_route;
