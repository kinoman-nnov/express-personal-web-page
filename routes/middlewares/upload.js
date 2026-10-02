const multer = require('multer');
const path = require('path');

const UPLOAD_DIR = path.join(process.cwd(), './public/assets/img/products');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter(req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error();
      error.code = 'INVALID_FILE_TYPE'; 
      
      cb(error, false);
    }
  }
});

module.exports = {
  uploadMiddleware: upload.single('photo'),
  UPLOAD_DIR
}