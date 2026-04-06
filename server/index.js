import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { profileRoutes } from './routes/profiles.js';
import { aiRoutes } from './routes/ai.js';
import { uploadRoutes } from './routes/uploads.js';
import { apiConfigRoutes } from './routes/apiConfig.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

app.use('/api/profiles', profileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/config', apiConfigRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`BrandGen server running on port ${PORT}`);
});
