import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4013;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'analytics-service' });
});

app.use('/api/analytics', (req, res) => { res.status(200).json({ message: '/api/analytics handled by analytics-service' }); });
app.use('/api/track', (req, res) => { res.status(200).json({ message: '/api/track handled by analytics-service' }); });

app.listen(port, () => {
  console.log(`Analytics Service listening at http://localhost:${port}`);
});
