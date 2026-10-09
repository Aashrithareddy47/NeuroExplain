const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `report-${timestamp}-${cleanName}`);
  }
});

// Multer file filter (Only PDF files allowed)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF neurological reports are supported.'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15 Megabytes max
  },
  fileFilter
});

// Rate limiter for AI interpretation generation (prevent quota exhaustion)
const interpretLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 25, // 25 interpretation requests per 10 mins per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many interpretation requests in a short time. Please wait a few minutes before trying again.'
  }
});

// Report routes (All protected by JWT auth)
router.post('/upload', authenticateToken, upload.single('reportPdf'), reportController.uploadReport);
router.get('/', authenticateToken, reportController.listReports);
router.get('/knowledge/search', authenticateToken, reportController.searchKnowledge);
router.get('/:id', authenticateToken, reportController.getReportById);
router.delete('/:id', authenticateToken, reportController.deleteReport);
router.post('/:id/interpret', authenticateToken, interpretLimiter, reportController.interpretReport);
router.get('/:id/results', authenticateToken, reportController.getReportResults);

// Error handler for Multer upload issues
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Neurological report PDFs must be under 15MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Upload error: ' + err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
});

module.exports = router;
