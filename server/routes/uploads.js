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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post('/', upload.array('files', 5), (req, res) => {
  const files = req.files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    path: `/uploads/${f.filename}`,
    size: f.size,
  }));
  res.json({ files });
});

export { router as uploadRoutes };
