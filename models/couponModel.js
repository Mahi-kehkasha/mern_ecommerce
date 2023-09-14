const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  couponCode: {
    type: String,
    required: true,
    unique: true,
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  maxDiscount: {
    type: Number,
    required: true,
  },
  validFrom: {
    type: Date,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  maxUses: {
    type: Number,
    required: true,
    default: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  minPurchase: {
    type: Number,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  couponApplied: {
    type: Boolean,
    default: false,
  },
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = Coupon;
