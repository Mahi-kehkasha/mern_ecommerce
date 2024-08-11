const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  images: {
    type: [String],
    required: true,
  },
});

const Banner = mongoose.model("Banner", bannerSchema);

module.exports = Banner;
