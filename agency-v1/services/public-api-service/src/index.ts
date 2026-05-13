import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4015;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'public-api-service' });
});

app.use('/api/v1', (req, res) => { res.status(200).json({ message: '/api/v1 handled by public-api-service' }); });
app.use('/api/public', (req, res) => { res.status(200).json({ message: '/api/public handled by public-api-service' }); });
app.use('/api/serve', (req, res) => { res.status(200).json({ message: '/api/serve handled by public-api-service' }); });

app.listen(port, () => {
  console.log(`Public API Service listening at http://localhost:${port}`);
});
