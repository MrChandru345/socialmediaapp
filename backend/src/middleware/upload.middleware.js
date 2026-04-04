const multer = require("multer");

const { AppError } = require("../utils/helpers");

const storage = multer.memoryStorage();

function fileFilter(req, file, callback) {
  const isAcceptedType =
    file.mimetype.startsWith("image/") || 
    file.mimetype.startsWith("video/") || 
    file.mimetype.startsWith("audio/");

  if (!isAcceptedType) {
    callback(new AppError(400, "Only image and video uploads are supported"));
    return;
  }

  callback(null, true);
}

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 6
  },
  fileFilter
});

module.exports = {
  upload
};
