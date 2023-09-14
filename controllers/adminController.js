const User = require("../models/userModel");
const Book = require("../models/bookModel");
const Category = require("../models/categoryModel");
const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const Transaction = require("../models/transactionModel");
const Banner = require("../models/bannerModel");

const bcrypt = require("bcrypt");
const randomstring = require("randomstring");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    res.render("login");
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
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render("login", { message: "Your're not an authorised Admin" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/admin/dashboard");
        }
      } else {
        res.render("login", { message: "Incorrect email or password" });
      }
    } else {
      res.render("login", { message: "Incorrect Email or Password" });
    }
  } catch (error) {
    console.log(message.error);
  }
};

const adminLogout = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(message.error);
  }
};

//-------------------------------dashboard--------------------------------

const loadDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: today },
    });

    const yesterdayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: yesterday, $lt: today },
    });

    const increasePercentage =
      yesterdayOrdersCount !== 0
        ? Math.floor(
            ((todayOrdersCount - yesterdayOrdersCount) / yesterdayOrdersCount) *
              100
          )
        : 100; // If yesterday's count is 0, consider it as 100% increase

    console.log(todayOrdersCount, increasePercentage, "342344");

    //-----------monthly calculations--------
    const startOfCurrentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );

    const currentMonthOrdersTotal = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$orderTotal" },
        },
      },
    ]);

    const lastMonthOrdersTotal = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfLastMonth, $lt: startOfCurrentMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$orderTotal" },
        },
      },
    ]);

    const currentMonthTotal =
      currentMonthOrdersTotal.length > 0 ? currentMonthOrdersTotal[0].total : 0;
    const lastMonthTotal =
      lastMonthOrdersTotal.length > 0 ? lastMonthOrdersTotal[0].total : 0;

    const monthlyIncreasePercentage =
      lastMonthTotal !== 0
        ? Math.floor(
            ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
          )
        : 100;

    //-----------yearly users count--------------------

    const totalUsersCount = await User.countDocuments();
    console.log(totalUsersCount, "342344");

    //------------
    const bookSalesData = await Order.aggregate([
      {
        $unwind: "$items", // Unwind the items array to work with individual items
      },
      {
        $group: {
          _id: "$items.bookId", // Group by the book's ObjectId
          totalQuantitySold: { $sum: "$items.quantity" }, // Calculate the total quantity sold
        },
      },
      {
        $lookup: {
          from: "books", // The name of your Book collection
          localField: "_id",
          foreignField: "_id",
          as: "bookData",
        },
      },
      {
        $unwind: "$bookData",
      },
      {
        $project: {
          title: "$bookData.title", // Get the book title from the Book collection
          totalQuantitySold: 1,
        },
      },
    ]);

    console.log(bookSalesData, "bookSalesData");

    res.render("dashboard", {
      salesCount: todayOrdersCount,
      increasePercentage,
      monthlyIncreasePercentage,
      monthlyRevenue: currentMonthTotal,
      userCount: totalUsersCount,
      bookSalesData,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
};

//-------------------------------users-------------------------------------

const loadUsers = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 5;

    const userData = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: ".*" + search + ".*", $options: "i" } },
            { email: { $regex: ".*" + search + ".*", $options: "i" } },
            { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
          ],
        },
        { is_admin: { $ne: 1 } }, // Exclude where is_admin is equal to 1
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find({
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    if (userData) {
      res.render("view-users", {
        users: userData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const newUserLoad = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(message.error);
  }
};

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render("edit-user", { user: userData });
    } else {
      res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUsers = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mno,
        },
      }
    );
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.deleteOne({ _id: id });
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId, "111kklklk");

    // Find the user by ID and update their 'is_block' field to true (blocked)
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { is_blocked: true } },
      { new: true }
    );
    console.log(user, "uuuuuuuuuuuuuuuuuuuuuuu");

    if (!user) {
      return res
        .status(404)
        .render("error-page", { message: "User not found" });
    }

    res.redirect("/admin/view-users");
  } catch (error) {
    console.error(error);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

const unblockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log(userId, "kklklk");

    // Find the user by ID and update their 'is_block' field to false (unblocked)
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { is_blocked: false } },
      { new: true }
    );
    console.log(user, "uuuuuuuuuuuuuuuuuuuuuuublockk");
    if (!user) {
      return res
        .status(404)
        .render("error-page", { message: "User not found" });
    }

    res.redirect("/admin/view-users");
  } catch (error) {
    console.error(error);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

//---------------------------------------products-------------------------------------

const loadProducts = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 5;

    const bookData = await Book.find({
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

    if (bookData) {
      res.render("view-products", {
        products: bookData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const newProductLoad = async (req, res) => {
  try {
    const catData = await Category.find({});
    console.log(catData, "catttaaac");
    res.render("add-product", { category: catData });
  } catch (error) {
    console.log(message.error);
  }
};

const addProduct = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      price,
      discount,
      offerPrice,
      description,
      language,
      stock,
      image,
    } = req.body;
    const images = req.files.map((file) => file.filename);
    let categories = await Category.find({});

    const book = new Book({
      title,
      author,
      category, // Use the retrieved category ID
      price,
      discount,
      offerPrice,
      description,
      language,
      stock,
      images,
      addedDate: Date.now(),
    });

    const bookData = await book.save();

    if (bookData) {
      res.render("add-product", { category: categories });
    } else {
      res.render("add-product", {
        message: "Something went wrong!!",
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

const editProductLoad = async (req, res) => {
  try {
    const { productId } = req.params;

    // Fetch the product data from the database
    const product = await Book.findById(productId);
    if (!product) {
      return res
        .status(404)
        .render("error-page", { message: "Product not found" });
    }

    // Fetch the category data from the database
    const categories = await Category.find();

    res.render("edit-product", { product, categories });
  } catch (error) {
    console.error(error);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      title,
      author,
      category,
      price,
      discount,
      offerPrice,
      description,
      language,
      stock,
    } = req.body;
    // Get the updated images from the request
    let images = [];

    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.filename);
    }

    // Update the product in the database
    const updatedProduct = await Book.findByIdAndUpdate(
      productId,
      {
        title,
        author,
        category,
        price,
        discount,
        offerPrice,
        description,
        language,
        stock,
      },
      { new: true }
    );

    // Update the images if any new files were uploaded
    if (images.length > 0) {
      updatedProduct.images = images;
      await updatedProduct.save();
    }

    if (!updatedProduct) {
      return res
        .status(404)
        .render("error-page", { message: "Product not found" });
    }

    res.redirect("/admin/view-products");
  } catch (error) {
    console.error(error);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

//---------------------remove single image----------------------------------

const removeSingleImage = async (req, res) => {
  try {
    const { productId, imageIndex } = req.params;
    const product = await Book.findById(productId);

    if (!product) {
      return res
        .status(400)
        .json({ success: false, error: "Product not found" });
    }

    // Remove the image at the specified index
    const removedImage = product.images.splice(imageIndex, 1)[0];
    await product.save();

    return res
      .status(200)
      .json({ success: true, message: "Image removed successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to remove image" });
  }
};
//--------------------------------Category Management---------------------
const newCategoryLoad = async (req, res) => {
  try {
    res.render("add-category");
  } catch (error) {
    console.log(message.error);
  }
};

const loadCategory = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    const limit = 5;

    const categoryData = await Category.find({
      $or: [{ name: { $regex: "." + search + ".", $options: "i" } }],
    })
      .sort({ addedDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Category.find({
      $or: [{ name: { $regex: "." + search + ".", $options: "i" } }],
    }).countDocuments();

    if (categoryData) {
      res.render("view-category", {
        categories: categoryData,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = new Category({
      name,
      description,
    });

    const categoryData = await category.save();

    if (categoryData) {
      res.redirect("/admin/view-category");
    } else {
      res.render("add-category", { message: "Something went wrong!!" });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

const editCategoryLoad = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Fetch the category data from the database
    const category = await Category.findById(categoryId);
    if (!category) {
      return res
        .status(404)
        .render("error-page", { message: "Category not found" });
    }

    res.render("edit-category", { category });
  } catch (error) {
    console.error(error);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;

    // Update the category in the database
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, description },
      { new: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .render("error-page", { message: "Category not found" });
    }

    res.redirect("/admin/view-category");
  } catch (error) {
    console.error(error);
    res.status(500).render("error-page", { message: "Server error" });
  }
};

//----------------------------------orders-----------------------
const viewAllOrders = async (req, res) => {
  try {
    res.header(
      "Cache-Control",
      "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
    );
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");

    const orders = await Order.find({})
      .populate("customerId")
      .populate("items.bookId")
      .sort({ createdAt: -1 }) // Populate the bookId field in the items array
      .exec();

    const separateOrders = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
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
        };
        separateOrders.push(separateOrder);
      });
    });

    // Pagination setup
    const limit = 5;
    let page = parseInt(req.query.page) || 1;
    const totalPages = Math.ceil(separateOrders.length / limit);
    if (page > totalPages) {
      page = totalPages;
    }
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const ordersToRender = separateOrders.slice(startIndex, endIndex);

    res.render("order-management", {
      orders: ordersToRender,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const updateOrderStatus = async (req, res) => {
  const orderId = req.body.orderId;
  const bookId = req.body.bookId;
  const newStatus = req.body.newStatus;
  const countdownEndTime = req.body.timer;

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
    if (countdownEndTime) {
      itemToUpdate.countdownEndTime = new Date(countdownEndTime);
    }

    // Save the updated order
    await order.save();

    // Send a success response
    res.status(200).json({
      message: "Order status updated successfully",
      newStatus: newStatus,
    });
  } catch (error) {
    console.log(error);
    // Send an error response
    res.status(500).json({ error: "Failed to update order status" });
  }
};

//-----------------------------COUPON MANAGEMNET---------------------

const addCouponLoad = async (req, res) => {
  try {
    res.render("add-coupon");
  } catch (error) {
    console.log(error.message);
  }
};

const addNewCoupon = async (req, res) => {
  try {
    const {
      couponCode,
      discountPercentage,
      validFrom,
      validUntil,
      maxUses,
      maxDiscount,
      minPurchase,
    } = req.body;

    const newCoupon = new Coupon({
      couponCode,
      discountPercentage,
      validFrom,
      validUntil,
      maxUses,
      maxDiscount,
      minPurchase,
    });

    const savedCoupon = await newCoupon.save();
    res.redirect("/admin/view-coupons");
  } catch (error) {
    console.error(error);
    res.render("add-coupon", { error: "Failed to add coupon" });
  }
};

const viewCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.render("view-coupons", { coupons });
  } catch (error) {
    console.log(error.message);
  }
};

//-------------------REPORTS---------------------------
const viewReports = async (req, res) => {
  try {
    const reportData = null;
    res.render("view-reports", { reportData });
  } catch (error) {
    console.log(error.message);
  }
};

// const generateReports = async (req, res) => {
//   try {
//     const { fromDate, toDate } = req.query;

//     const reportData = await Order.aggregate([
//       {
//         $match: {
//           createdAt: {
//             $gte: new Date(fromDate),
//             $lte: new Date(toDate),
//           },
//         },
//       },
//       {
//         $unwind: "$items",
//       },
//       {
//         $lookup: {
//           from: "books", // Replace with the actual collection name
//           localField: "items.bookId",
//           foreignField: "_id",
//           as: "book",
//         },
//       },
//       {
//         $unwind: "$book",
//       },
//       {
//         $group: {
//           _id: "$book._id",
//           bookName: { $first: "$book.title" },
//           authorName: { $first: "$book.author" },
//           price: { $first: "$items.price" },
//           quantity: { $sum: "$items.quantity" },
//           totalPrice: { $sum: "$items.price" },
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           bookName: 1,
//           authorName: 1,
//           price: 1,
//           quantity: 1,
//           totalPrice: 1,
//         },
//       },
//     ]);
//     console.log(fromDate, toDate, "dateeeeeeeee");
//     console.log(reportData, "report");

//     res.render("view-reports", { reportData, fromDate, toDate }); // Replace with your template engine
//   } catch (error) {
//     console.error("Error generating report:", error);
//     res
//       .status(500)
//       .json({ success: false, error: "Failed to generate report" });
//   }
// };

const generateReports = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const reportData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(fromDate),
            $lte: new Date(toDate),
          },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "books", // Replace with the actual collection name
          localField: "items.bookId",
          foreignField: "_id",
          as: "book",
        },
      },
      {
        $unwind: "$book",
      },
      {
        $group: {
          _id: "$book._id",
          bookName: { $first: "$book.title" },
          authorName: { $first: "$book.author" },
          price: { $first: "$items.price" },
          quantity: { $sum: "$items.quantity" },
          totalPrice: { $sum: "$items.price" },
        },
      },
      {
        $group: {
          _id: null,
          reportData: {
            $push: {
              bookName: "$bookName",
              authorName: "$authorName",
              price: "$price",
              quantity: "$quantity",
              totalPrice: "$totalPrice",
            },
          },
          totalBooksSold: { $sum: "$quantity" }, // Total count of each book sold
          totalAmountEarned: { $sum: "$totalPrice" }, // Total amount earned
        },
      },
      {
        $project: {
          _id: 0,
          reportData: 1,
          totalBooksSold: 1,
          totalAmountEarned: 1,
        },
      },
    ]);

    console.log(fromDate, toDate, "dateeeeeeeee");
    console.log(reportData, "report");

    res.render("view-reports", { reportData, fromDate, toDate }); // Replace with your template engine
  } catch (error) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate report" });
  }
};

//-------------------------------------stock-reports-------------------------------

const viewStockReport = async (req, res) => {
  try {
    const stockReport = await Book.aggregate([
      {
        $lookup: {
          from: "categories", // Replace with the actual collection name for categories
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          _id: 0,
          bookName: "$title",
          categoryName: "$category.name",
          stock: 1,
        },
      },
    ]);

    res.render("stock-report", { stockReport });
  } catch (error) {
    console.error("Error generating stock report:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to generate stock report" });
  }
};

//-------------------------------------CATEGORY OFFER----------------------------------

const addCategoryOffer = async (req, res) => {
  try {
    const categories = await Category.find({});
    const categoryDiscountsMap = new Map(); // Map to track discount percentages

    // Loop through each category and find products
    for (const category of categories) {
      const productsWithCategory = await Book.find({ category: category._id });

      const discountPercentages = new Set(
        productsWithCategory.map((product) => product.discount)
      );

      if (discountPercentages.size === 1) {
        // If there are multiple discount percentages for this category
        categoryDiscountsMap.set(category, Array.from(discountPercentages));
      }
    }

    // Create category offers from the map
    const categoryOffers = [];
    for (const [category, discountPercentages] of categoryDiscountsMap) {
      discountPercentages.forEach((discountPercentage) => {
        categoryOffers.push({
          category: category.name,
          discountPercentage: discountPercentage,
          catId: category._id,
        });
      });
    }
    console.log(categoryOffers, "catofferss");

    res.render("add-cat-offer", { categories, categoryOffers });
  } catch (error) {
    console.log(error.message);
  }
};

const applyCategoryOffer = async (req, res) => {
  try {
    const { category, discountPercentage } = req.body;

    // Find all books belonging to the given category
    const booksToUpdate = await Book.find({ category });

    // Loop through each book and update discount and offerPrice
    for (const book of booksToUpdate) {
      const originalPrice = book.price;

      // Calculate new offerPrice based on the discountPercentage
      const newOfferPrice = originalPrice * (1 - discountPercentage / 100);

      // Update book's discount and offerPrice fields
      book.discount = discountPercentage;
      book.offerPrice = newOfferPrice;

      // Save the updated book
      await book.save();
    }

    console.log("Books updated successfully");

    // Redirect to a success page or render a success message
    res.redirect("/admin/add-category-offer"); // Change this to your desired success page
  } catch (error) {
    console.log(error.message);
    // Redirect to an error page or render an error message
    res.redirect("/admin/error-page"); // Change this to your desired error page
  }
};

const removeCategoryOffer = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;

    // Find all books belonging to the given category
    const booksToUpdate = await Book.find({ category: categoryId });

    // Loop through each book and reset discount and offerPrice
    for (const book of booksToUpdate) {
      const originalPrice = book.price;

      // Reset the discount to 0
      book.discount = 0;

      // Reset the offerPrice to the original price
      book.offerPrice = null;

      // Save the updated book
      await book.save();
    }

    // Redirect or respond as needed
    res.redirect("/admin/add-category-offer");
  } catch (error) {
    console.error("Error removing category offer:", error);
    // Handle the error and respond appropriately
    res
      .status(500)
      .json({ success: false, error: "Failed to remove category offer" });
  }
};

//------------------------------------BANNER MANAGEMENT--------------------------------

const viewBanner = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.render("view-banner", { banners });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

const loadAddBanner = async (req, res) => {
  try {
    res.render("add-banner");
  } catch (error) {
    console.log(error.message);
  }
};

const addBanner = async (req, res) => {
  try {
    const { title, subtitle, bannerImages } = req.body;
    console.log(req.body, "bodyyy");
    const images = req.files.map((file) => file.filename);
    console.log(images, "jjjjjjjj");
    const newBanner = new Banner({ title, subtitle, images });
    await newBanner.save();
    res.redirect("/admin/add-banner");
  } catch (error) {
    res.status(500).json({ error: "Failed to create banner" });
  }
};

const editBanner = async (req, res) => {
  try {
    const { title, subtitle, imageURL } = req.body;
    await Banner.findByIdAndUpdate(req.params.id, {
      title,
      subtitle,
      imageURL,
    });
    res.json({ success: true, message: "Banner updated" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update banner" });
  }
};

const deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;

    // Find the banner by ID and remove it
    const deletedBanner = await Banner.findByIdAndRemove(bannerId);

    if (!deletedBanner) {
      return res
        .status(404)
        .json({ success: false, error: "Banner not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ success: false, error: "Failed to delete banner" });
  }
};
//--------------------------------------------------------------------------------------

module.exports = {
  loadDashboard,
  editUserLoad,
  loadUsers,
  newUserLoad,
  updateUsers,
  deleteUser,
  loadLogin,
  verifyLogin,
  adminLogout,
  newProductLoad,
  loadProducts,
  addProduct,
  newCategoryLoad,
  loadCategory,
  addCategory,
  editProductLoad,
  updateProduct,
  editCategoryLoad,
  updateCategory,
  blockUser,
  unblockUser,
  viewAllOrders,
  updateOrderStatus,
  addCouponLoad,
  addNewCoupon,
  viewCoupons,
  viewReports,
  generateReports,
  removeSingleImage,
  addCategoryOffer,
  applyCategoryOffer,
  viewBanner,
  addBanner,
  loadAddBanner,
  editBanner,
  deleteBanner,
  viewStockReport,
  removeCategoryOffer,
};
