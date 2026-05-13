import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4009;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'marketing-service' });
});

app.use('/api/marketing', (req, res) => { res.status(200).json({ message: '/api/marketing handled by marketing-service' }); });
app.use('/api/email-blast', (req, res) => { res.status(200).json({ message: '/api/email-blast handled by marketing-service' }); });
app.use('/api/creative', (req, res) => { res.status(200).json({ message: '/api/creative handled by marketing-service' }); });

app.listen(port, () => {
  console.log(`Marketing Service listening at http://localhost:${port}`);
});
