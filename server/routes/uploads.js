import { Router } from 'express';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';

const router = Router();

if (!existsSync('uploads')) mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB per file
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
      'application/pdf',
      'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Allow up to 20 files per upload
router.post('/', upload.array('files', 20), (req, res) => {
  const files = (req.files || []).map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    path: `/uploads/${f.filename}`,
    size: f.size,
    mimetype: f.mimetype,
  }));
  res.json({ files });
});

export { router as uploadRoutes };
