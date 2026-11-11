const multer = require("multer");
const path = require("path");

/**
 * Photo uploads for ImgBB.
 *
 * ImgBB receives the raw bytes, so multer always buffers the file in
 * memory — there is no disk fallback and no local `/uploads` route. The
 * controller hands `req.file.buffer` to `config/imgbb.js`, which returns
 * the hosted absolute URL the application stores.
 *
 * The 5 MB limit and image-only filter apply to every upload.
 */
const fileFilter = (req, file, cb) => {
  // Images only. The consumers of this middleware are the photo upload
  // routes (`POST /api/marketplace/upload`, `POST /api/user/profile/photo`),
  // so documents are rejected here rather than reaching storage and being
  // rejected downstream.
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error("Only JPEG, PNG, GIF or WebP images are allowed"));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

module.exports = upload;
