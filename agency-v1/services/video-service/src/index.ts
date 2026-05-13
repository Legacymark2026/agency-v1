import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4007;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'video-service' });
});

// Placeholder routes for video processing
app.use('/api/media', (req, res) => {
  res.status(200).json({ message: 'Media routes will be handled here.' });
});

app.use('/api/video', (req, res) => {
  res.status(200).json({ message: 'Video generation routes will be handled here.' });
});

app.listen(port, () => {
  console.log(`Video service listening at http://localhost:${port}`);
});
