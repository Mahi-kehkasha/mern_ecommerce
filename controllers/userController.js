const User = require("../models/userModel");
const Book = require("../models/bookModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Transaction = require("../models/transactionModel");
const Banner = require("../models/bannerModel");
const Wishlist = require("../models/wishlistModel");

const accountSid = "ACb27968e40b0aeb18fcfbf2196c3d3402";
const authToken = "7fff2fc8493c1583ffee8051e89f8835";
const verifySid = "VA3190668a75939b921b971c0e7d239c91";
const client = require("twilio")(accountSid, authToken);

const bcrypt = require("bcrypt");
const {
  ItemAssignmentContextImpl,
} = require("twilio/lib/rest/numbers/v2/regulatoryCompliance/bundle/itemAssignment");

const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: "rzp_test_ayOgq7chuv4Aeq",
  key_secret: "i7GEYFabFT2STp8GOaG2fnX2",
});

const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", // 'sandbox' or 'live'
  client_id:
    "AYvyImhfAzZHTVlLcaHFD7qciVDHaRQRQa2rbu1bwJ78m3xsIu32lkQk-PWxEXzTxZG8wpMg9-IlwgPn",
  client_secret:
    "EADgaiI7rkErU6o-_vlFU-i-jYrXdnWD8X_zVNhQLZa7wKeo4qtp7YIbUb2pyuJnNQT-sS3cFjfTwrBP",
});

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//-------------------------forgot password------------------------

const loadForgotPassword = async (req, res) => {
  try {
    res.render("forgot-password");
  } catch (error) {
    console.log(message.error);
  }
};

const getOtp = async (req, res) => {
  try {
    const { mobileNo } = req.body;

    // --Check if the mobile number exists
    const mobile = await User.findOne({ mobile: mobileNo });

    if (!mobile) {
      res.render("forgot-password", { message: "Mobile no not registered" });
    }

    // Mobile number found, proceed with sending the OTP
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: `+91${mobileNo}`, channel: "sms" });

    console.log(verification.status);
    req.session.mobileNo = mobileNo;
    res.render("forgot-password", {
      message: `OTP sent successfully to ${mobileNo}`,
      mobileNo: req.session.mob,
    });
  } catch (error) {
    console.log(error.message);
    res.render("forgot-password", { error: "Failed to send OTP" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const otpMobileNo = req.session.mobileNo;

    // Check if the mobile number exists in the session
    if (!otpMobileNo) {
      return res.render("forgot-password", {
        message: "Mobile number not found",
      });
    }

    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: `+91${otpMobileNo}`, code: otp });
    console.log(verificationCheck.status);
    if (verificationCheck.status === "approved") {
      // OTP verification successful
      req.session.isVerified = true; // Store the verification status in session

      // Fetch the user's ID using their mobile number
      const user = await User.findOne({ mobile: otpMobileNo });

      if (!user) {
        return res.render("forgot-password", { message: "User not found" });
      }

      // Access the user's ID
      const userId = user._id;
      req.session.userID = userId;

      res.render("forgot-password", {
        message: "OTP verfication successful",
        isVerfied: true,
        userId: req.session.userID,
      });
    } else {
      // Invalid OTP
      res.render("forgot-password", {
        message: "Invalid OTP",
        isVerified: false,
      });
    }
  } catch (error) {
    console.log(error.message);
    console.log("not working");
    res.render("forgot-password", { error: "Failed to verify OTP" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    // Validate that the password and confirm password match
    if (password !== confirmPassword) {
      return res.render("forgot-password", {
        message: "Passwords do not match",
      });
    }

    // Generate a bcrypt hash of the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    //access user from session
    const userId = req.session.userID;

    // Update the user's password in the database
    const user = await User.findOneAndUpdate(
      { _id: userId }, // Assuming you have the authenticated user's ID in req.user._id
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      res.render("forgot-password", { message: "User Not Found" });
    }

    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.render("forgot-password", { error: "Internal Server Error" });
  }
};

//----------------------------------------------------------------

const getOtpSignup = async (req, res) => {
  try {
    const { mobileNo } = req.body;

    // Check if the mobile number exists in the database
    const existingUser = await User.findOne({ mobile: mobileNo });

    if (existingUser) {
      return res
        .status(200)
        .json({ error: "Mobile number already registered" });
    }

    // Mobile number found, proceed with sending the OTP
    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({ to: `+91${mobileNo}`, channel: "sms" });

    console.log(verification.status);
    req.session.mobileNo = mobileNo;
    res.status(200).json({ success: `OTP sent successfully to ${mobileNo}` });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

const verifyOtpSignup = async (req, res) => {
  try {
    const { otp } = req.body;
    const otpMobileNo = req.session.mobileNo;

    // Check if the mobile number exists in the session
    if (!otpMobileNo) {
      return res.status(400).json({ error: "Mobile number not found" });
    }

    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: `+91${otpMobileNo}`, code: otp });

    console.log(verificationCheck.status);
    if (verificationCheck.status === "approved") {
      // OTP verification successful
      req.session.isVerified = true; // Store the verification status in session
      req.session.mobileNo = null; // Clear the mobile number from the session

      // Continue with user registration
      res.status(200).json({ success: "OTP verification successful" });
    } else {
      // Invalid OTP
      res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};

const loadRegister = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    // Check if the OTP verification is successful
    if (req.session.isVerified !== true) {
      return res.render("registration", {
        message:
          "OTP verification failed. Please verify your mobile number first.",
      });
    }

    const spassword = await securePassword(req.body.password);
    const user = User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      // Registration is successful
      // Clear the isVerified session variable after successful registration
      req.session.isVerified = false;
      res.render("registration", {
        message: "Your registration is successful",
      });
    } else {
      res.render("registration", { message: "Your registration is failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//login methods

const loginLoad = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    res.render("login", { loginPage: true });
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      if (userData.is_blocked) {
        res.render("login", {
          message: "User is blocked. Please contact the administrator.",
        });
      } else {
        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (passwordMatch) {
          req.session.user = userData._id;
          res.redirect("/home");
        } else {
          res.render("login", { message: "Incorrect user credentials" });
        }
      }
    } else {
      res.render("login", { message: "Incorrect user credentials" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    const banners = await Banner.find();
    const userId = req.session.user;
    const user = await User.findOne({ userId });
    res.render("home", { banners, user });
  } catch (error) {
    console.log(error.message);
  }
};

//-----------------------------------------products---------------------------------

const loadProducts = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    const userId = req.session.user;

    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 6;

    const books = await Book.find({
      $or: [
        { title: { $regex: ".*" + search + ".*", $options: "i" } },
        { author: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .sort({ addedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("category") // Populate the category field
      .exec();

    const count = await Book.find({
      $or: [
        { title: { $regex: ".*" + search + ".*", $options: "i" } },
        { author: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    const categories = await Category.find();
    res.render("products", {
      books,
      categories,
      userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page ? page : 1,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadByCategory = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    const userId = req.session.user;
    const categoryID = req.params.categoryID;

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 6;

    const books = await Book.find({ category: categoryID })
      .populate("category")
      .sort({ addedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Book.find({}).countDocuments();

    const categories = await Category.find();
    res.render("products", {
      books,
      categories,
      userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page ? page : 1,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//----------------------------------product filters-------------------

const handleSearchFilters = async (req, res) => {
  try {
    const userId = req.session.user;
    const { last30Days, last90Days, next90Days } = req.query;

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 6;

    const filter = {};

    if (last30Days) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filter.addedDate = { $gte: thirtyDaysAgo };
    }

    if (last90Days) {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      filter.addedDate = { $gte: ninetyDaysAgo };
    }

    if (next90Days) {
      const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      filter.addedDate = { $lt: ninetyDaysFromNow };
    }

    const filteredBooks = await Book.find(filter)
      .populate("category")
      .sort({ addedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Book.find({}).countDocuments();

    const categories = await Category.find();

    res.render("products", {
      books: filteredBooks,
      categories: categories,
      userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page ? page : 1,
    });
  } catch (error) {
    console.error(error);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

const handleSearchByLang = async (req, res) => {
  try {
    const userId = req.session.user;
    const { language } = req.query;

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 6;

    const books = await Book.find({ language: language })
      .populate("category")
      .sort({ addedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Book.find({}).countDocuments();

    const categories = await Category.find();

    res.render("products", {
      books,
      categories,
      userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page ? page : 1,
    });
  } catch (error) {
    console.error("Error searching by language:", error);
    res.render("error-page", { message: "Failed to search by language" });
  }
};

const handleSearchByPrice = async (req, res) => {
  try {
    const minPrice = 50;
    const maxPrice = parseInt(req.query.minPrice);

    const userId = req.session.user;

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 6;

    console.log("min, ", minPrice, maxPrice, "maxPricemaxPricemaxPrice");

    const filteredBooks = await Book.find({
      price: { $gte: minPrice, $lte: maxPrice },
    })
      .populate("category")
      .sort({ addedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Book.find({}).countDocuments();

    console.log(filteredBooks, "filteredBooks");

    const categories = await Category.find();

    res.render("products", {
      books: filteredBooks,
      categories: categories,
      userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page ? page : 1,
    });
  } catch (error) {
    console.error("Error filtering books by price:", error);
    res.status(500).json({ error: "Failed to filter books by price" });
  }
};

//----------------------------------single product-----------------------
const loadSingleProduct = async (req, res) => {
  try {
    const productID = req.params.productID;

    const userId = req.session.user;

    // Fetch the product from the database based on the productID
    const product = await Book.findById(productID).populate("category");

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.render("single-product", { products: product, userId: userId });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Server error" });
  }
};

//-------------------------------WISHLIST-------------------------------------------------

const viewWishlist = async (req, res) => {
  try {
    const userId = req.session.user;

    // Find the user's cart based on the userId
    const wishlist = await Wishlist.findOne({ userId }).populate(
      "items.bookId"
    );

    console.log(wishlist, "view wish");

    if (!wishlist) {
      // If the cart doesn't exist, you can handle it appropriately (e.g., show an empty cart page)
      return res.render("wishlist", { wishlist: [] });
    }

    // Calculate the total price of the cart

    const wishlistItemsArray = wishlist.items;

    console.log(wishlistItemsArray, "wishlistItemsArray");

    res.render("wishlist", {
      wishlist: wishlistItemsArray,
      userId,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Failed to view Wishlist items" });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { userId, bookId } = req.body;

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId });
    }

    // Check if the book is already in the cart
    const wishlistItem = wishlist.items.find(
      (item) => item.bookId.toString() === bookId
    );

    if (wishlistItem) {
      const itemPrice =
        book.offerPrice !== 0 && book.offerPrice !== null
          ? book.offerPrice
          : book.price;
      cartItem.price = itemPrice * cartItem.quantity;
      cartItem.realPrice = book.price * cartItem.quantity;
    } else {
      // If the book is not in the cart, add it as a new item
      const itemPrice =
        book.offerPrice !== 0 && book.offerPrice !== null
          ? book.offerPrice
          : book.price;

      wishlist.items.push({
        bookId,
        price: itemPrice,
        realPrice: book.price,
      });
    }

    await wishlist.save();

    res.status(200).json(wishlist);
  } catch (error) {
    console.error("Error adding item to wishlist:", error);
    res.status(500).json({ error: "Failed to add item to wishlist" });
  }
};

//------------------------------ CART -------------------------------------------------------------

const viewCartItems = async (req, res) => {
  try {
    const userId = req.session.user;

    // Find the user's cart based on the userId
    const cart = await Cart.findOne({ userId }).populate("items.bookId");

    if (!cart) {
      // If the cart doesn't exist, you can handle it appropriately (e.g., show an empty cart page)
      return res.render("cart", { cart: [], totalPrice: 0 });
    }

    // Calculate the total price of the cart
    let totalPrice = 0;
    for (const item of cart.items) {
      totalPrice += item.price;
    }

    let realPrice = 0;
    for (const item of cart.items) {
      realPrice += item.realPrice;
    }

    let couponPrice = cart.couponDiscountPrice;
    let couponApplied = cart.couponApplied;
    let couponName = cart.couponName;

    let saved = realPrice - totalPrice;

    const cartItemsArray = cart.items;

    res.render("cart", {
      cart: cartItemsArray,
      totalPrice: totalPrice,
      realPrice,
      saved,
      couponPrice,
      couponApplied,
      couponName,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Failed to view cart items" });
  }
};

const addToCart = async (req, res) => {
  try {
    const { userId, bookId, quantity } = req.body;

    const quant = parseInt(quantity);

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Get the user's cart or create a new one if it doesn't exist
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId });
    }

    // Check if the book is already in the cart
    const cartItem = cart.items.find(
      (item) => item.bookId.toString() === bookId
    );

    if (cartItem) {
      cartItem.quantity += quant;
      const itemPrice =
        book.offerPrice !== 0 && book.offerPrice !== null
          ? book.offerPrice
          : book.price;
      cartItem.price = itemPrice * cartItem.quantity;
      cartItem.realPrice = book.price * cartItem.quantity;
    } else {
      // If the book is not in the cart, add it as a new item
      const itemPrice =
        book.offerPrice !== 0 && book.offerPrice !== null
          ? book.offerPrice
          : book.price;

      cart.items.push({
        bookId,
        quantity,
        price: itemPrice * quantity,
        realPrice: book.price * quantity,
      });
    }

    cart.totalPrice = cart.items.reduce((total, item) => {
      const itemPrice = parseInt(
        item.offerPrice !== 0 && !isNaN(item.offerPrice)
          ? item.offerPrice
          : item.price
      );
      return total + parseInt(itemPrice); // Ensure the value is a number
    }, 0);

    cart.relPrice = cart.items.reduce((total, item) => {
      return total + item.realPrice; // Ensure the value is a number
    }, 0);

    // Save the cart to the database
    await cart.save();

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;

    // Check if the book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const userId = req.session.user;

    // Find the user's cart based on the userId
    const cart = await Cart.findOne({ userId }).populate("items.bookId");

    const cartItemIndex = cart.items.findIndex(
      (item) => item.bookId.id === bookId
    );

    const cartItem = cartItemIndex !== -1 ? cart.items[cartItemIndex] : null;

    if (!cartItem) {
      return res.status(404).json({ error: "Book not found in cart" });
    }

    // Calculate the new price based on the updated quantity
    const itemPrice = parseFloat(
      book.offerPrice !== 0 && book.offerPrice !== null
        ? book.offerPrice
        : book.price
    );
    const newPrice = itemPrice * parseFloat(quantity);

    // Calculate the real price of the cart item
    cartItem.realPrice = book.price * parseFloat(quantity);

    // Update the cart item's quantity and price
    cartItem.quantity = parseInt(quantity);
    cartItem.price = newPrice;

    // Update the total price of the cart
    cart.totalPrice = cart.items.reduce((total, item) => {
      const itemPrice = parseFloat(
        item.bookId.offerPrice !== 0 && item.bookId.offerPrice !== null
          ? item.bookId.offerPrice
          : item.bookId.price
      );
      return total + itemPrice * item.quantity;
    }, 0);

    // Calculate the total real price of the cart
    cart.relPrice = cart.items.reduce((total, item) => {
      return total + item.realPrice; // Ensure the value is a number
    }, 0);

    const saved = cart.relPrice - cart.totalPrice;

    // Save the updated cart to the database
    await cart.save();

    res.status(200).json({
      message: "Cart quantity updated successfully",
      totalPrice: cart.totalPrice,
      newPrice: newPrice,
      realPrice: cart.relPrice,
      saved: saved,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Failed to update cart quantity" });
  }
};

const getCartCount = async (req, res) => {
  try {
    // Assuming you have the userId available in the request (e.g., from passport.js)
    const userId = req.session.user;
    const cart = await Cart.findOne({ userId }).populate("items.bookId");
    // Calculate the total number of items in the cart
    let cartItemCount = 0;
    if (cart) {
      cartItemCount = cart.items.length;
    }
    // Send the cart item count as part of the response
    return res.status(200).json({ itemCount: cartItemCount });
  } catch (error) {
    console.log(error.message);
  }
};

const getWishlistCount = async (req, res) => {
  try {
    // Assuming you have the userId available in the request (e.g., from passport.js)
    const userId = req.session.user;
    const wishlist = await Wishlist.findOne({ userId }).populate(
      "items.bookId"
    );
    // Calculate the total number of items in the cart
    let wishlistItemCount = 0;
    if (wishlist) {
      wishlistItemCount = wishlist.items.length;
    }
    // Send the cart item count as part of the response
    return res.status(200).json({ itemCount: wishlistItemCount });
  } catch (error) {
    console.log(error.message);
  }
};

const deleteCartItem = async (req, res) => {
  const { cartItemId } = req.body;
  const userId = req.session.user; // Assuming you have the user ID stored in the session

  try {
    // Find the user's cart and remove the item with the specified cartItemId
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const removedItem = cart.items.find(
      (item) => item.id.toString() === cartItemId
    );

    if (!removedItem) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    const removedPrice = removedItem.price * removedItem.quantity;
    const removedRealPrice = removedItem.realPrice * removedItem.quantity;

    // Decrement the cart's totalPrice and relPrice by the removed item's prices
    cart.totalPrice -= removedPrice;
    cart.relPrice -= removedRealPrice;

    // Remove the item from the cart's items array
    cart.items = cart.items.filter((item) => item.id.toString() !== cartItemId);

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Item deleted from cart successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete item from cart" });
  }
};

const deleteWishlistItem = async (req, res) => {
  const { cartItemId } = req.body;
  const userId = req.session.user; // Assuming you have the user ID stored in the session

  try {
    // Find the user's cart and remove the item with the specified cartItemId
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ error: "Cart not found" });
    }

    const removedItem = wishlist.items.find(
      (item) => item.id.toString() === cartItemId
    );

    if (!removedItem) {
      return res.status(404).json({ error: "Item not found in cart" });
    }

    // Remove the item from the cart's items array
    wishlist.items = wishlist.items.filter(
      (item) => item.id.toString() !== cartItemId
    );

    // Save the updated cart
    await wishlist.save();

    res.status(200).json({ message: "Item deleted from cart successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to delete item from cart" });
  }
};

//------------------------------------COUPON CHECK---------------------------------

const couponCheck = async (req, res) => {
  try {
    const { couponCode } = req.body;

    // Find the coupon by its code
    const coupon = await Coupon.findOne({ couponCode });

    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    // Check if the coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({ error: "Coupon is not active" });
    }

    // Check if the coupon is within the valid date range
    const currentDate = new Date();
    if (currentDate < coupon.validFrom || currentDate > coupon.validUntil) {
      return res
        .status(400)
        .json({ error: "Coupon is not valid at this time" });
    }

    // Check if the maximum uses limit has been reached
    if (coupon.usedCount < coupon.maxUses) {
      // Increment usedCount by 1
      coupon.usedCount += 1;
      await coupon.save();

      // Get the user's cart based on the userId
      const userId = req.session.user; // Assuming you have a user session
      const cart = await Cart.findOne({ userId });

      if (cart.totalPrice >= coupon.minPurchase) {
        if (!cart.couponApplied) {
          // Calculate the maximum discount based on the coupon's maxDiscount
          const maxDiscountAmount = Math.min(
            coupon.maxDiscount,
            cart.totalPrice * (coupon.discountPercentage / 100)
          );
          // Calculate the discounted total price
          const totalPriceWithDiscount = cart.totalPrice - maxDiscountAmount;

          // Update the cart's total price and applied coupon details
          cart.couponDiscountPrice = totalPriceWithDiscount;
          cart.couponApplied = true; // Mark the coupon as applied
          cart.couponName = couponCode;
          await cart.save();

          // Send back the updated cart total price with discount
          res.status(200).json({
            message: "Coupon applied successfully",
            totalPriceWithDiscount,
            maxDiscountAmount,
          });
        } else {
          res
            .status(400)
            .json({ error: "Coupon already applied to this cart" });
        }
      } else {
        res.status(400).json({
          error: `Minimum purchase amount of ₹${coupon.minPurchase} required to apply this coupon`,
        });
      }
    } else {
      res.status(400).json({ error: "Coupon has reached its maximum uses" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to apply coupon" });
  }
};

//-------------REMOVE COUPON-----------
const removeCoupon = async (req, res) => {
  try {
    const userId = req.session.user;

    // Find the user's cart based on the userId
    const cart = await Cart.findOne({ userId });

    if (cart.couponApplied) {
      const couponCode = cart.couponName;

      // Find the applied coupon
      const coupon = await Coupon.findOne({ couponCode });

      if (coupon) {
        // Decrement usedCount by 1
        if (coupon.usedCount > 0) {
          coupon.usedCount -= 1;
        }

        // Update the coupon and cart models
        coupon.save();
        cart.couponApplied = false;
        cart.couponName = "";
        cart.couponDiscountPrice = 0;
        await cart.save();

        res.status(200).json({ message: "Coupon removed successfully" });
      } else {
        res.status(404).json({ error: "Coupon not found" });
      }
    } else {
      res.status(400).json({ error: "No coupon applied to this cart" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove coupon" });
  }
};

//----------------------------------------checkout----------------------------------

const checkOut = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    if (userData.is_blocked) {
      res.render("login", {
        message: "User is blocked. Please contact the administrator.",
      });
    } else {
      const cart = await Cart.findOne({ userId }).populate("items.bookId");
      const addresses = await Address.find({ user: userId });
      const totalPrice = cart.items.reduce(
        (total, item) => total + item.price,
        0
      );

      res.render("checkout", { cart, totalPrice, addresses, userId });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//------------------------address------------------------

const addNewAddress = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      companyName,
      street,
      landmark,
      city,
      state,
      pincode,
      mobileNo,
      email,
    } = req.body;

    const userId = req.session.user;
    const newAddressData = {
      user: userId,
      firstName,
      lastName,
      companyName,
      street,
      landmark,
      city,
      state,
      pincode,
      mobileNo,
      email,
    };

    const newAddress = new Address(newAddressData);
    await newAddress.save();

    res
      .status(200)
      .json({ message: "Address saved successfully", address: newAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save address" });
  }
};

const updateAddress = async (req, res) => {
  const addressId = req.params.addressId;
  const {
    firstName,
    lastName,
    companyName,
    street,
    landmark,
    city,
    state,
    pincode,
    mobileNo,
    email /* Add more fields as needed */,
  } = req.body;

  try {
    // Find the address by ID
    const existingAddress = await Address.findById(addressId);

    if (!existingAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Update the address fields with the new values
    existingAddress.firstName = firstName;
    existingAddress.lastName = lastName;
    existingAddress.companyName = companyName;
    existingAddress.street = street;
    existingAddress.landmark = landmark;
    existingAddress.city = city;
    existingAddress.state = state;
    existingAddress.pincode = pincode;
    existingAddress.mobileNo = mobileNo;
    existingAddress.email = email;
    // Update more fields as needed

    // Save the updated address
    await existingAddress.save();

    res.status(200).json({ message: "Address updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update address" });
  }
};

const deleteAddress = async (req, res) => {
  const addressId = req.params.addressId;
  console.log(addressId, "addressId");
  try {
    // Find the address by ID and delete it
    const deletedAddress = await Address.findByIdAndDelete(addressId);

    if (!deletedAddress) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete address" });
  }
};

//--------------------------------------place order-----------------------------------

const orderPlacement = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findOne({ _id: userId });
    console.log(userData, "userdata");
    if (userData.is_blocked) {
      res.render("login", {
        message: "User is blocked. Please contact the administrator.",
      });
    } else {
      const {
        orderNumber,
        customerId,
        items,
        addressId,
        orderTotal,
        paymentMethod,
      } = req.body;

      const address = await Address.findById(addressId);
      if (!address) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid address ID" });
      }

      if (paymentMethod === "Razorpay") {
        const options = {
          amount: orderTotal * 100, // Amount in paise (Indian currency)
          currency: "INR",
          receipt: orderNumber,
        };
        console.log(options, "optionssssss");
        const order = await razorpay.orders.create(options);

        // Redirect the user to the Razorpay checkout page
        res.status(200).json({
          success: true,
          payment: {
            order_id: order.id,
            currency: order.currency,
            amount: order.amount,
          },
          paymentMethod: "Razorpay",
        });
        return;
      } else if (paymentMethod === "Paypal") {
        const paypalPaymentData = {
          intent: "sale",
          payer: {
            payment_method: "paypal",
          },
          redirect_urls: {
            return_url: "http://localhost:9000/success", // Update with your actual return URL
            cancel_url: "http://localhost:9000/failure", // Update with your actual cancel URL
          },
          transactions: [
            {
              amount: {
                total: (orderTotal * 100).toFixed(0), // Ensure the total is formatted correctly
                currency: "USD", // Update with your desired currency
              },
              description: `Order #${orderNumber}`, // Update with your description
            },
          ],
        };

        paypal.payment.create(paypalPaymentData, (error, payment) => {
          if (error) {
            console.error(error);
            return res.status(500).json({
              success: false,
              error: "PayPal payment creation failed",
            });
          } else {
            // Extract the approval URL from the payment response
            const approvalUrl = payment.links.find(
              (link) => link.rel === "approval_url"
            ).href;
            console.log(approvalUrl, "approvalUrl");

            // Send the approval URL as a response to the AJAX request
            res.status(200).json({
              success: true,
              order: { paymentMethod: "Paypal" },
              approval_url: approvalUrl,
              paymentMethod: "Paypal",
            });
            return;
          }
        });
      }

      const newOrder = new Order({
        orderNumber,
        customerId,
        items,
        shippingAddress: address,
        orderTotal,
        paymentMethod,
      });

      for (const item of items) {
        const book = await Book.findById(item.bookId);
        if (!book) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid book ID" });
        }

        if (book.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: "Insufficient stock for one or more items",
          });
        }

        book.stock -= item.quantity;
        await book.save();
      }

      // Save the new order
      const savedOrder = await newOrder.save();

      if (paymentMethod === "COD") {
        res
          .status(201)
          .json({ success: true, order: savedOrder, paymentMethod: "COD" });
      }

      if (paymentMethod === "Wallet") {
        const userId = req.session.user;
        const user = await User.findById(userId);

        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        if (user.walletBalance < orderTotal) {
          return res.status(400).json({ error: "Insufficient wallet balance" });
        }

        // Decrement user's wallet balance
        user.walletBalance -= orderTotal;
        await user.save();

        // Create a transaction record for the wallet debit
        const transactionData = {
          userId,
          type: "debit",
          amount: orderTotal,
        };
        await Transaction.create(transactionData);
        res.status(201).json({
          success: true,
          order: savedOrder,
          paymentMethod: "Wallet",
        });
      }

      //Delete the cart
      const deletedCart = await Cart.findOneAndDelete({ userId: customerId });
      if (!deletedCart) {
        console.log("Cart not found for customerId:", customerId);
      } else {
        console.log("Cart deleted:", deletedCart);
      }

      // Return the order details in the response
      //
    }
  } catch (error) {
    // Handle any errors that occurred during order placement
    console.error(error);
    res
      .status(500)
      .json({ success: false, error: "Failed to place the order" });
  }
};

//-----------------------------RAZORPAY VERIICATION-----------------------------

const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderData,
    } = req.body;

    console.log(req.body, orderData, "requestData");

    const signatureData = razorpay_order_id + "|" + razorpay_payment_id;

    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", "i7GEYFabFT2STp8GOaG2fnX2");
    hmac.update(signatureData);
    const generatedSignature = hmac.digest("hex");

    console.log(generatedSignature, "generatedSignature");

    if (generatedSignature === razorpay_signature) {
      const {
        orderNumber,
        customerId,
        items,
        addressId,
        orderTotal,
        paymentMethod,
      } = orderData;

      console.log(orderData, "requestData.orderData");

      if (!addressId) {
        return res
          .status(400)
          .json({ success: false, error: "Address ID is missing" });
      }

      const address = await Address.findById(addressId);
      if (!address) {
        return res
          .status(400)
          .json({ success: false, error: "Invalid address ID" });
      }
      console.log(address, "addressss");
      const newOrder = new Order({
        orderNumber,
        customerId,
        items,
        shippingAddress: address,
        orderTotal,
        paymentMethod,
      });

      // Decrement stock counts in the books collection
      for (const item of items) {
        const book = await Book.findById(item.bookId);
        if (!book) {
          return res
            .status(400)
            .json({ success: false, error: "Invalid book ID" });
        }

        if (book.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: "Insufficient stock for one or more items",
          });
        }

        book.stock -= item.quantity;
        await book.save();
      }

      // Save the new order
      const savedOrder = await newOrder.save();

      // Delete the cart
      const deletedCart = await Cart.findOneAndDelete({ userId: customerId });
      if (!deletedCart) {
        console.log("Cart not found for customerId:", customerId);
      } else {
        console.log("Cart deleted:", deletedCart);
      }

      // Return the order details in the response
      res.status(201).json({ success: true, order: savedOrder });
    } else {
      res
        .status(400)
        .json({ success: false, error: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, error: "Failed to verify payment" });
  }
};

//----------------------------------successpage-----------------------------------

const successPage = async (req, res) => {
  try {
    res.render("success");
  } catch (error) {
    console.log(error.message);
  }
};

//-----------------------------------failure page---------------------------------

const failurePage = async (req, res) => {
  try {
    res.render("failure");
  } catch (error) {
    console.log(error.message);
  }
};

//------------------------------------view-orders--------------------------------

const viewOrders = async (req, res) => {
  try {
    const userId = req.session.user;
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 6;

    const orders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("customerId")
      .populate("items.bookId") // Populate the bookId field in the items array
      .exec();

    const count = await Order.find({}).countDocuments();

    const separateOrders = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        console.log(order._id, "8888888888888");
        const separateOrder = {
          _id: order._id,
          bookId: item.bookId._id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          bookName: item.bookId.title, // Access the book title directly from the populated item
          price: item.price / item.quantity,
          quantity: item.quantity,
          shippingAddress: order.shippingAddress,
          orderTotal: (item.price / item.quantity) * item.quantity,
          paymentMethod: order.paymentMethod,
          orderStatus: item.status,
          createdAt: order.createdAt,
          countdownEndTime: item.countdownEndTime,
          individualID: item._id,
        };
        separateOrders.push(separateOrder);
      });
    });

    res.render("view-orders", {
      orders: separateOrders,
      userId,
      totalPages: Math.ceil(count / limit),
      currentPage: page ? page : 1,
    });
  } catch (error) {
    console.log(error.message);
  }
};

//------------------------------------profile--------------------------------

const myProfile = async (req, res) => {
  const userId = req.session.user;
  const userdetails = await User.findOne({ _id: userId });
  const addresses = await Address.find({ user: userId });

  res.render("profile", {
    user: userId,
    userdata: userdetails,
    addresses: addresses,
  });
};

const updatePersonalDetails = (req, res) => {
  const { fullName, email } = req.body;

  User.findByIdAndUpdate(
    req.session.user,
    { $set: { name: fullName, email: email } },
    { new: true }
  )
    .then(() => {
      // Send a success response
      res
        .status(200)
        .json({ message: "Personal details updated successfully" });
    })
    .catch((err) => {
      // Handle any errors that occurred during the update
      res.status(500).json({ error: "Failed to update personal details" });
    });
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.session.user;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate the current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: "Invalid current password" });
    }

    // Validate the new password and confirm password
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password" });
  }
};

//---------------------------------SHOW WALLET----------------------------------

const showWallet = async (req, res) => {
  try {
    const userId = req.session.user;

    // Fetch the user's wallet information
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch the user's transactions from the transaction collection
    const transactions = await Transaction.find({ userId }).sort({
      timestamp: -1,
    });

    // Render the "wallet" view and pass the user and transactions data
    res.render("wallet", { user, transactions });
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    res.status(500).json({ error: "Failed to fetch wallet details" });
  }
};

//--------------------------------------logout---------------------------------------

const userLogout = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

const updateOrderStatus = async (req, res) => {
  const orderId = req.body.orderId;
  const bookId = req.body.bookId;
  const newStatus = req.body.newStatus;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Find the item with the matching bookId within the order
    const itemToUpdate = order.items.find(
      (item) => item.bookId.toString() === bookId
    );

    if (!itemToUpdate) {
      return res.status(404).json({ error: "Item not found in the order" });
    }

    // Update the status field in the item
    itemToUpdate.status = newStatus;

    // If the new status is "Returned" or "Cancelled"
    if (newStatus === "Returned" || newStatus === "Cancelled") {
      // Restore the stock to the books collection
      const book = await Book.findById(bookId);
      if (book) {
        book.stock += itemToUpdate.quantity;
        await book.save();
        const userId = req.session.user;
        // Find the user associated with the order
        const user = await User.findById(userId);

        console.log(user, "userllllll");

        if (user) {
          // Increment walletBalance
          user.walletBalance += itemToUpdate.price;
          await user.save();

          // Create a transaction record for wallet credit
          const transactionData = {
            userId: userId,
            type: "credit",
            amount: itemToUpdate.price * itemToUpdate.quantity,
          };
          await Transaction.create(transactionData);
        }
      }
    }

    // Save the updated order
    await order.save();

    // Send a success response
    res.status(200).json({ message: "Order status updated successfully" });
  } catch (error) {
    console.log(error);
    // Send an error response
    res.status(500).json({ error: "Failed to update order status" });
  }
};

//---------------------------invoice-----------------------------
const orderInvoice = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const bookId = req.query.bookId;

    const order = await Order.findOne({ _id: orderId });
    const book = await Book.findOne({ _id: bookId });

    console.log(order, "-----", book);

    if (!order || !book) {
      // Handle the case where the order or book is not found
      return res
        .status(404)
        .render("error", { message: "Order or book not found" });
    }

    // Render the 'invoice.ejs' template with order and book information
    res.render("invoice", { order, book });
  } catch (error) {
    console.error(error.message);
    // Handle other errors, possibly render an error page or send an error response
    res.status(500).render("error", { message: "Internal server error" });
  }
};

//----------------------------------------------------------------

// const updateOrderStatus = async (req, res) => {
//   const orderId = req.body.orderId;
//   const bookId = req.body.bookId;
//   const newStatus = req.body.newStatus;

//   console.log(orderId, bookId, newStatus, "999999999999999999");

//   try {
//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res.status(404).json({ error: "Order not found" });
//     }

//     // Find the item with the matching bookId within the order
//     const itemToUpdate = order.items.find(
//       (item) => item.bookId.toString() === bookId
//     );

//     if (!itemToUpdate) {
//       return res.status(404).json({ error: "Item not found in the order" });
//     }

//     // Update the status field in the item
//     itemToUpdate.status = newStatus;

//     // If the new status is "Returned" or "Cancelled"
//     if (newStatus === "Returned" || newStatus === "Cancelled") {
//       // Restore the stock to the books collection
//       const book = await Book.findById(bookId);
//       if (book) {
//         book.stock += itemToUpdate.quantity;
//         await book.save();
//       }
//     }

//     // Save the updated order
//     await order.save();

//     // Send a success response
//     res.status(200).json({ message: "Order status updated successfully" });
//   } catch (error) {
//     console.log(error);
//     // Send an error response
//     res.status(500).json({ error: "Failed to update order status" });
//   }
// };

module.exports = {
  loadRegister,
  insertUser,
  loginLoad,
  verifyLogin,
  loadHome,
  loadProducts,
  userLogout,
  loadForgotPassword,
  getOtp,
  verifyOtp,
  resetPassword,
  loadSingleProduct,
  getOtpSignup,
  verifyOtpSignup,
  loadByCategory,
  handleSearchFilters,
  handleSearchByLang,
  handleSearchByPrice,
  viewCartItems,
  addToCart,
  updateCartQuantity,
  getCartCount,
  deleteCartItem,
  checkOut,
  addNewAddress,
  updateAddress,
  deleteAddress,
  orderPlacement,
  successPage,
  failurePage,
  viewOrders,
  updateOrderStatus,
  updatePersonalDetails,
  myProfile,
  updatePassword,
  couponCheck,
  removeCoupon,
  verifyRazorpayPayment,
  showWallet,
  orderInvoice,
  viewWishlist,
  addToWishlist,
  deleteWishlistItem,
  getWishlistCount,
};
