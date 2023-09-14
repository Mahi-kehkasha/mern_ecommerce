const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model
    required: true,
  },
  items: [
    {
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book", // Assuming you have a Product model
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: [
          "Placed",
          "Shipped",
          "On the Way",
          "Delivered",
          "Cancelled",
          "Returned",
        ],
        default: "Placed",
      },
      countdownEndTime: {
        type: Date,
      },
    },
  ],
  shippingAddress: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
    },
    companyName: String,
    street: {
      type: String,
    },
    landmark: String,
    city: {
      type: String,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  orderTotal: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["Razorpay", "COD", "Wallet", "Paypal"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
