const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_admin: {
    type: Number,
    required: true,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  walletBalance: {
    type: Number,
    default: 100,
  },
});
module.exports = mongoose.model("User", userSchema);
