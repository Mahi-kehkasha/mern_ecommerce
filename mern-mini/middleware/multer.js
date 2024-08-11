const multer = require("multer");

// Configure storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/product-imgs"); // Specify the directory where uploaded images will be stored
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadMultiple = multer({ storage: storage }).array("images", 5);

module.exports = uploadMultiple;
